import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Query, QueryType } from './query.entity';
import { DataSourceService } from '../datasource/datasource.service';
import { DataSourceAdapterFactory } from '../datasource/adapters/datasource-adapter.factory';
import { EncryptionService } from '../../common/encryption.service';
import axios from 'axios';

interface QueryResultData {
  data: any;
  rowsAffected?: number;
}

export interface QueryResult extends QueryResultData {
  executionTime: number;
  error?: string;
}

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(Query)
    private queryRepository: Repository<Query>,
    private dataSourceService: DataSourceService,
    private encryptionService: EncryptionService,
  ) {}

  async findAllByAppId(appId: string): Promise<Query[]> {
    return this.queryRepository.find({
      where: { appId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Query> {
    const query = await this.queryRepository.findOne({ where: { id } });
    if (!query) {
      throw new NotFoundException('查询不存在');
    }
    return query;
  }

  async create(data: {
    appId: string;
    name: string;
    dataSourceId: string;
    type: QueryType;
    content: any;
    options?: any;
  }): Promise<Query> {
    const query = this.queryRepository.create({
      appId: data.appId,
      name: data.name,
      dataSourceId: data.dataSourceId,
      type: data.type,
      content: data.content,
      options: data.options,
    });
    return this.queryRepository.save(query);
  }

  async update(id: string, data: { name?: any; content?: any; options?: any }): Promise<Query> {
    const query = await this.findById(id);

    if (data.name !== undefined) {
      query.name = data.name;
    }
    if (data.content !== undefined) {
      query.content = data.content;
    }
    if (data.options !== undefined) {
      query.options = data.options;
    }

    return this.queryRepository.save(query);
  }

  async delete(id: string): Promise<void> {
    const query = await this.findById(id);
    await this.queryRepository.remove(query);
  }

  async executeQuery(id: string, params?: Record<string, any>): Promise<QueryResult> {
    const query = await this.findById(id);
    return this.executeQueryByType(
      query.dataSourceId,
      query.type,
      query.content,
      query.options,
      params
    );
  }

  async previewQuery(
    dataSourceId: string,
    type: string,
    content: any,
    options?: any,
    params?: Record<string, any>
  ): Promise<QueryResult> {
    return this.executeQueryByType(dataSourceId, type, content, options, params);
  }

  private async executeQueryByType(
    dataSourceId: string,
    type: string,
    content: any,
    options?: any,
    params?: Record<string, any>
  ): Promise<QueryResult> {
    const startTime = Date.now();

    // 智能类型检测：如果content中有sql字段但type是javascript，自动修正
    // 或者如果content中有sql字段，也按SQL处理
    let actualType = type;
    if (content?.sql) {
      actualType = 'sql';
    } else if (content?.code && type !== 'sql') {
      actualType = 'javascript';
    }

    try {
      let result: any;

      switch (actualType) {
        case 'sql':
          result = await this.executeSqlQuery(dataSourceId, content.sql, params);
          break;
        case 'javascript':
          result = await this.executeJavascriptQuery(content.code, params);
          break;
        case 'visual':
          result = await this.executeVisualQuery(dataSourceId, content, params);
          break;
        case 'rest':
          result = await this.executeRestApiQuery(content, params);
          break;
        default:
          throw new BadRequestException(`不支持的查询类型: ${type}`);
      }

      // Apply transformer if specified
      if (options?.transformer && result.data) {
        result.data = await this.applyTransformer(options.transformer, result.data);
      }

      return {
        ...result,
        executionTime: Date.now() - startTime,
      };
    } catch (error: any) {
      return {
        data: null,
        executionTime: Date.now() - startTime,
        error: error.message || '查询执行失败',
      };
    }
  }

  // SQL 模式：参数化执行
  private async executeSqlQuery(
    dataSourceId: string,
    sql: string,
    params?: Record<string, any>
  ): Promise<QueryResultData> {
    // Replace {{variable}} with parameterized placeholders
    const { parameterizedSql, paramValues } = this.replaceVariables(sql, params);

    const dataSource = await this.dataSourceService.findById(dataSourceId);
    const config = this.dataSourceService.getDecryptedConfig(dataSource.config);
    const adapter = DataSourceAdapterFactory.createAdapter(dataSource.type, config);

    const queryResult = await adapter.executeQuery(parameterizedSql, paramValues);

    return {
      data: queryResult.rows,
      rowsAffected: queryResult.rowCount,
    };
  }

  // JavaScript 模式：vm2 沙箱执行
  private async executeJavascriptQuery(code: string, params?: Record<string, any>): Promise<QueryResultData> {
    const timeout = 10000; // 10 seconds

    // Dynamic import of vm2
    const { NodeVM } = await import('vm2');

    const vm = new NodeVM({
      timeout,
      sandbox: {
        params: params || {},
        console: {
          log: (...args: any[]) => console.log('[JS Query]', ...args),
          error: (...args: any[]) => console.error('[JS Query Error]', ...args),
        },
        require: undefined, // Disable require for security
      },
      eval: false,
      wasm: false,
    });

    try {
      const result = vm.run(code, 'query.js');
      return {
        data: result,
      };
    } catch (error: any) {
      throw new BadRequestException(`JavaScript 执行错误: ${error.message}`);
    }
  }

  // 可视化模式：转换为 SQL 执行
  private async executeVisualQuery(
    dataSourceId: string,
    content: any,
    params?: Record<string, any>
  ): Promise<QueryResultData> {
    const { operation, tableName, columns, filters, orders, pagination, values } = content;

    let sql = '';
    const paramValues: any[] = [];

    switch (operation) {
      case 'select':
        const cols = columns && columns.length > 0 ? columns.join(', ') : '*';
        sql = `SELECT ${cols} FROM ${tableName}`;

        // Add filters
        if (filters && filters.length > 0) {
          const whereClauses: string[] = [];
          for (const filter of filters) {
            if (filter.operator === 'is_null') {
              whereClauses.push(`${filter.column} IS NULL`);
            } else if (filter.operator === 'is_not_null') {
              whereClauses.push(`${filter.column} IS NOT NULL`);
            } else if (filter.operator === 'in') {
              const placeholders = filter.value.map((_: any, i: number) => `$${paramValues.length + i + 1}`).join(', ');
              whereClauses.push(`${filter.column} IN (${placeholders})`);
              paramValues.push(...filter.value);
            } else if (filter.operator === 'like') {
              whereClauses.push(`${filter.column} LIKE $${paramValues.length + 1}`);
              paramValues.push(filter.value);
            } else {
              whereClauses.push(`${filter.column} ${filter.operator} $${paramValues.length + 1}`);
              paramValues.push(filter.value);
            }
          }
          if (whereClauses.length > 0) {
            sql += ' WHERE ' + whereClauses.join(' AND ');
          }
        }

        // Add orders
        if (orders && orders.length > 0) {
          const orderClauses = orders.map((o: { column: string; direction: string }) => `${o.column} ${o.direction.toUpperCase()}`);
          sql += ' ORDER BY ' + orderClauses.join(', ');
        }

        // Add pagination
        if (pagination) {
          const offset = (pagination.page - 1) * pagination.pageSize;
          sql += ` LIMIT $${paramValues.length + 1} OFFSET $${paramValues.length + 2}`;
          paramValues.push(pagination.pageSize, offset);
        }
        break;

      case 'insert':
        if (!values) {
          throw new BadRequestException('插入操作需要提供 values');
        }
        const insertCols = Object.keys(values).join(', ');
        const insertPlaceholders = Object.keys(values).map((_, i) => `$${i + 1}`).join(', ');
        sql = `INSERT INTO ${tableName} (${insertCols}) VALUES (${insertPlaceholders})`;
        paramValues.push(...Object.values(values));
        break;

      case 'update':
        if (!values) {
          throw new BadRequestException('更新操作需要提供 values');
        }
        const updateClauses = Object.keys(values).map((col, i) => `${col} = $${i + 1}`).join(', ');
        sql = `UPDATE ${tableName} SET ${updateClauses}`;

        const updateParamStart = paramValues.length + 1;
        paramValues.push(...Object.values(values));

        if (filters && filters.length > 0) {
          const whereClauses: string[] = [];
          for (const filter of filters) {
            if (filter.operator === 'is_null') {
              whereClauses.push(`${filter.column} IS NULL`);
            } else if (filter.operator === 'is_not_null') {
              whereClauses.push(`${filter.column} IS NOT NULL`);
            } else {
              whereClauses.push(`${filter.column} ${filter.operator} $${paramValues.length + 1}`);
              paramValues.push(filter.value);
            }
          }
          sql += ' WHERE ' + whereClauses.join(' AND ');
        }
        break;

      case 'delete':
        sql = `DELETE FROM ${tableName}`;

        if (filters && filters.length > 0) {
          const whereClauses: string[] = [];
          for (const filter of filters) {
            if (filter.operator === 'is_null') {
              whereClauses.push(`${filter.column} IS NULL`);
            } else if (filter.operator === 'is_not_null') {
              whereClauses.push(`${filter.column} IS NOT NULL`);
            } else {
              whereClauses.push(`${filter.column} ${filter.operator} $${paramValues.length + 1}`);
              paramValues.push(filter.value);
            }
          }
          sql += ' WHERE ' + whereClauses.join(' AND ');
        }
        break;

      default:
        throw new BadRequestException(`不支持的操作类型: ${operation}`);
    }

    const dataSource = await this.dataSourceService.findById(dataSourceId);
    const config = this.dataSourceService.getDecryptedConfig(dataSource.config);
    const adapter = DataSourceAdapterFactory.createAdapter(dataSource.type, config);

    const queryResult = await adapter.executeQuery(sql, paramValues);

    return {
      data: operation === 'select' ? queryResult.rows : null,
      rowsAffected: queryResult.rowCount,
    };
  }

  // REST API 模式
  private async executeRestApiQuery(content: any, params?: Record<string, any>): Promise<QueryResultData> {
    const { method, url, headers, params: queryParams, body } = content;

    // Replace {{variable}} in url, headers, params, body
    const resolvedUrl = this.replaceTemplateVariables(url, params);
    const resolvedHeaders = this.replaceTemplateVariables(headers, params);
    const resolvedParams = this.replaceTemplateVariables(queryParams, params);
    const resolvedBody = this.replaceTemplateVariables(body, params);

    const response = await axios({
      method,
      url: resolvedUrl,
      headers: resolvedHeaders,
      params: resolvedParams,
      data: resolvedBody,
      timeout: 30000,
    });

    return {
      data: response.data,
      rowsAffected: Array.isArray(response.data) ? response.data.length : 1,
    };
  }

  // Replace {{variable}} with values from params
  private replaceVariables(sql: string, params?: Record<string, any>): { parameterizedSql: string; paramValues: any[] } {
    if (!params || Object.keys(params).length === 0) {
      return { parameterizedSql: sql, paramValues: [] };
    }

    // Find all {{variable}} patterns
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const paramValues: any[] = [];
    let paramIndex = 1;

    const parameterizedSql = sql.replace(variablePattern, (match, varName) => {
      const key = varName.trim();
      if (params.hasOwnProperty(key)) {
        paramValues.push(params[key]);
        return `$${paramIndex++}`;
      }
      return match;
    });

    return { parameterizedSql, paramValues };
  }

  // Replace {{variable}} in template with params values
  private replaceTemplateVariables(template: any, params?: Record<string, any>): any {
    if (!template) return template;
    if (!params) return template;

    if (typeof template === 'string') {
      return template.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
        const key = varName.trim();
        return params.hasOwnProperty(key) ? params[key] : match;
      });
    }

    if (Array.isArray(template)) {
      return template.map(item => this.replaceTemplateVariables(item, params));
    }

    if (typeof template === 'object') {
      const result: any = {};
      for (const key in template) {
        result[key] = this.replaceTemplateVariables(template[key], params);
      }
      return result;
    }

    return template;
  }

  // Apply transformer JS code
  private async applyTransformer(code: string, data: any): Promise<any> {
    const { NodeVM } = await import('vm2');

    const vm = new NodeVM({
      timeout: 5000,
      sandbox: {
        data,
        console: {
          log: (...args: any[]) => console.log('[Transformer]', ...args),
        },
      },
      eval: false,
      wasm: false,
    });

    try {
      // Wrap code to return transformed data
      const wrappedCode = `module.exports = (function() { ${code} return data; })();`;
      return vm.run(wrappedCode, 'transformer.js');
    } catch (error: any) {
      console.error('Transformer error:', error);
      throw new BadRequestException(`数据转换错误: ${error.message}`);
    }
  }
}
