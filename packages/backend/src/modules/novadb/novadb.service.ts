import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NovaTable } from './nova-table.entity';
import { NovaColumn, ColumnType } from './nova-column.entity';
import { Client } from 'pg';

@Injectable()
export class NovaDBService {
  private pgClient: Client;

  constructor(
    @InjectRepository(NovaTable)
    private tableRepository: Repository<NovaTable>,
    @InjectRepository(NovaColumn)
    private columnRepository: Repository<NovaColumn>,
    private dataSource: DataSource,
  ) {}

  private async getPgClient(): Promise<Client> {
    if (!this.pgClient) {
      this.pgClient = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'novabuilder',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });
      await this.pgClient.connect();
    }
    return this.pgClient;
  }

  // ========== Table Operations ==========

  async findAllTables(): Promise<NovaTable[]> {
    return this.tableRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findTableById(id: string): Promise<NovaTable> {
    const table = await this.tableRepository.findOne({
      where: { id },
      relations: ['columns'],
    });
    if (!table) {
      throw new NotFoundException('表不存在');
    }
    // Sort columns by columnOrder
    table.columns.sort((a, b) => a.columnOrder - b.columnOrder);
    return table;
  }

  async createTable(name: string, createdBy: string): Promise<NovaTable> {
    // Check if table name already exists
    const existing = await this.tableRepository.findOne({ where: { name } });
    if (existing) {
      throw new ConflictException('表名已存在，请使用其他名称');
    }

    const tableName = `ud_${name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;

    // Create table in PostgreSQL
    const client = await this.getPgClient();
    await client.query(`
      CREATE TABLE IF NOT EXISTS novadb.${tableName} (
        id SERIAL PRIMARY KEY
      )
    `);

    // Save to metadata
    const novaTable = this.tableRepository.create({
      name,
      createdBy,
    });
    return this.tableRepository.save(novaTable);
  }

  async updateTable(id: string, name: string): Promise<NovaTable> {
    const novaTable = await this.findTableById(id);

    // Check if new table name already exists (excluding current table)
    const existing = await this.tableRepository.findOne({ where: { name } });
    if (existing && existing.id !== id) {
      throw new ConflictException('表名已存在，请使用其他名称');
    }

    // Rename table in PostgreSQL if name changed
    if (name !== novaTable.name) {
      const oldTableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
      const newTableName = `ud_${name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;

      const client = await this.getPgClient();
      await client.query(`ALTER TABLE novadb.${oldTableName} RENAME TO ${newTableName}`);

      novaTable.name = name;
    }

    return this.tableRepository.save(novaTable);
  }

  async deleteTable(id: string): Promise<void> {
    const novaTable = await this.findTableById(id);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;

    // Drop table from PostgreSQL
    const client = await this.getPgClient();
    await client.query(`DROP TABLE IF EXISTS novadb.${tableName}`);

    // Delete metadata
    await this.tableRepository.delete(id);
  }

  // ========== Column Operations ==========

  async findColumnsByTableId(tableId: string): Promise<NovaColumn[]> {
    return this.columnRepository.find({
      where: { tableId },
      order: { columnOrder: 'ASC' },
    });
  }

  async addColumn(
    tableId: string,
    data: { name: string; type: ColumnType; isNullable?: boolean; defaultValue?: string; columnOrder?: number },
  ): Promise<NovaColumn> {
    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;

    // Get max column order
    const maxOrder = await this.columnRepository
      .createQueryBuilder('col')
      .where('col.tableId = :tableId', { tableId })
      .select('MAX(col.columnOrder)', 'max')
      .getRawOne();

    const columnOrder = data.columnOrder ?? (maxOrder?.max ?? -1) + 1;

    // Add column to PostgreSQL
    const client = await this.getPgClient();
    const pgType = this.getPgType(data.type);
    const nullable = data.isNullable !== false ? 'NULL' : 'NOT NULL';
    const defaultClause = data.defaultValue ? `DEFAULT ${this.formatDefaultValue(data.type, data.defaultValue)}` : '';

    await client.query(`ALTER TABLE novadb.${tableName} ADD COLUMN IF NOT EXISTS "${data.name}" ${pgType} ${nullable} ${defaultClause}`);

    // Save to metadata
    const column = this.columnRepository.create({
      tableId,
      name: data.name,
      type: data.type,
      isNullable: data.isNullable ?? true,
      defaultValue: data.defaultValue,
      columnOrder,
    });
    return this.columnRepository.save(column);
  }

  async updateColumn(
    tableId: string,
    columnId: string,
    data: { name?: string; type?: ColumnType; isNullable?: boolean; defaultValue?: string; columnOrder?: number },
  ): Promise<NovaColumn> {
    const column = await this.columnRepository.findOne({ where: { id: columnId, tableId } });
    if (!column) {
      throw new NotFoundException('列不存在');
    }

    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
    const client = await this.getPgClient();

    // Rename column if name changed
    if (data.name && data.name !== column.name) {
      await client.query(`ALTER TABLE novadb.${tableName} RENAME COLUMN "${column.name}" TO "${data.name}"`);
      column.name = data.name;
    }

    // Change column type if changed
    if (data.type && data.type !== column.type) {
      await client.query(`ALTER TABLE novadb.${tableName} ALTER COLUMN "${column.name}" TYPE ${this.getPgType(data.type)} USING "${column.name}"::${this.getPgType(data.type)}`);
      column.type = data.type;
    }

    // Change nullable
    if (data.isNullable !== undefined && data.isNullable !== column.isNullable) {
      const nullable = data.isNullable ? 'DROP NOT NULL' : 'SET NOT NULL';
      await client.query(`ALTER TABLE novadb.${tableName} ALTER COLUMN "${column.name}" ${nullable}`);
      column.isNullable = data.isNullable;
    }

    // Change default value
    if (data.defaultValue !== undefined) {
      const defaultClause = data.defaultValue ? `SET DEFAULT ${this.formatDefaultValue(column.type, data.defaultValue)}` : 'DROP DEFAULT';
      await client.query(`ALTER TABLE novadb.${tableName} ALTER COLUMN "${column.name}" ${defaultClause}`);
      column.defaultValue = data.defaultValue;
    }

    if (data.columnOrder !== undefined) {
      column.columnOrder = data.columnOrder;
    }

    return this.columnRepository.save(column);
  }

  async deleteColumn(tableId: string, columnId: string): Promise<void> {
    const column = await this.columnRepository.findOne({ where: { id: columnId, tableId } });
    if (!column) {
      throw new NotFoundException('列不存在');
    }

    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;

    // Drop column from PostgreSQL
    const client = await this.getPgClient();
    await client.query(`ALTER TABLE novadb.${tableName} DROP COLUMN IF EXISTS "${column.name}"`);

    // Delete from metadata
    await this.columnRepository.delete(columnId);
  }

  // ========== Row Operations ==========

  async queryRows(
    tableId: string,
    options: { search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; page?: number | string; pageSize?: number | string; filters?: string; sorts?: string },
  ): Promise<{ rows: any[]; total: number }> {
    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
    const client = await this.getPgClient();

    const page = parseInt(String(options.page || 1));
    const pageSize = parseInt(String(options.pageSize || 20));
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    const params: any[] = [];

    // Parse filters from JSON string
    let filters: Array<{ column: string; operator: string; value: any }> = [];
    if (options.filters) {
      try {
        filters = JSON.parse(options.filters);
      } catch (e) {
        // Invalid filters JSON, ignore
      }
    }

    // Build WHERE clause from search and filters
    const conditions: string[] = [];

    // Search condition
    if (options.search) {
      const textColumns = novaTable.columns.filter((c) => c.type === 'text').map((c) => `"${c.name}"`);
      if (textColumns.length > 0) {
        conditions.push(`(${textColumns.map((col) => `${col} ILIKE $${params.length + 1}`).join(' OR ')})`);
        params.push(`%${options.search}%`);
      }
    }

    // Filter conditions
    for (const filter of filters) {
      const column = filter.column;
      const operator = filter.operator;
      const value = filter.value;

      // Skip empty value for operators that check emptiness
      if (operator === 'is_empty' || operator === 'is_not_empty') {
        if (operator === 'is_empty') {
          conditions.push(`"${column}" IS NULL OR "${column}" = ''`);
        } else {
          conditions.push(`"${column}" IS NOT NULL AND "${column}" != ''`);
        }
        continue;
      }

      // Skip if value is undefined/null for other operators
      if (value === undefined || value === null || value === '') {
        continue;
      }

      const paramIndex = params.length + 1;

      switch (operator) {
        // Text operators
        case 'eq':
          conditions.push(`"${column}" = $${paramIndex}`);
          params.push(value);
          break;
        case 'neq':
          conditions.push(`"${column}" != $${paramIndex}`);
          params.push(value);
          break;
        case 'contains':
          conditions.push(`"${column}" ILIKE $${paramIndex}`);
          params.push(`%${value}%`);
          break;
        case 'not_contains':
          conditions.push(`"${column}" NOT ILIKE $${paramIndex}`);
          params.push(`%${value}%`);
          break;
        // Number operators
        case 'gt':
          conditions.push(`"${column}" > $${paramIndex}`);
          params.push(Number(value));
          break;
        case 'lt':
          conditions.push(`"${column}" < $${paramIndex}`);
          params.push(Number(value));
          break;
        case 'gte':
          conditions.push(`"${column}" >= $${paramIndex}`);
          params.push(Number(value));
          break;
        case 'lte':
          conditions.push(`"${column}" <= $${paramIndex}`);
          params.push(Number(value));
          break;
        // DateTime operators
        case 'before':
          conditions.push(`"${column}" < $${paramIndex}`);
          params.push(value);
          break;
        case 'after':
          conditions.push(`"${column}" > $${paramIndex}`);
          params.push(value);
          break;
        // Boolean operators
        case 'eq':
          conditions.push(`"${column}" = $${paramIndex}`);
          params.push(value === true || value === 'true');
          break;
        default:
          // Default to equals
          conditions.push(`"${column}" = $${paramIndex}`);
          params.push(value);
      }
    }

    if (conditions.length > 0) {
      whereClause = `WHERE ${conditions.join(' AND ')}`;
    }

    // Parse sorts from JSON string
    let sorts: Array<{ column: string; order: 'asc' | 'desc' }> = [];
    if (options.sorts) {
      try {
        sorts = JSON.parse(options.sorts);
      } catch (e) {
        // Invalid sorts JSON, ignore
      }
    }

    // Build ORDER BY clause
    let orderClause = '';
    if (sorts && sorts.length > 0) {
      // Use the new sorts array
      orderClause = `ORDER BY ${sorts.map(s => `"${s.column}" ${s.order.toUpperCase()}`).join(', ')}`;
    } else if (options.sortBy) {
      // Fallback to old single sort
      const sortBy = options.sortBy || 'id';
      const sortOrder = options.sortOrder || 'desc';
      orderClause = `ORDER BY "${sortBy}" ${sortOrder.toUpperCase()}`;
    } else {
      // Default sort by id ascending
      orderClause = 'ORDER BY id ASC';
    }

    // Get total count
    const countResult = await client.query(`SELECT COUNT(*) as total FROM novadb.${tableName} ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total);

    // Get rows
    const result = await client.query(
      `SELECT * FROM novadb.${tableName} ${whereClause} ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, pageSize, offset],
    );

    return { rows: result.rows, total };
  }

  async createRow(tableId: string, data: Record<string, any>): Promise<any> {
    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
    const client = await this.getPgClient();

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    const result = await client.query(
      `INSERT INTO novadb.${tableName} (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  async updateRow(tableId: string, rowId: string, data: Record<string, any>): Promise<any> {
    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
    const client = await this.getPgClient();

    const updates = Object.keys(data).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
    const values = [...Object.values(data), rowId];

    const result = await client.query(`UPDATE novadb.${tableName} SET ${updates} WHERE id = $${values.length} RETURNING *`, values);
    if (result.rowCount === 0) {
      throw new NotFoundException('行不存在');
    }
    return result.rows[0];
  }

  async deleteRows(tableId: string, ids: string[]): Promise<void> {
    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
    const client = await this.getPgClient();

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    await client.query(`DELETE FROM novadb.${tableName} WHERE id IN (${placeholders})`, ids);
  }

  // ========== SQL Execution ==========

  async executeSql(sql: string, params?: any[]): Promise<{ columns: string[]; rows: any[]; rowCount: number; executionTime: number; error?: string }> {
    const client = await this.getPgClient();

    // Validate SQL is only for novadb schema
    const normalizedSql = sql.trim().toLowerCase();
    if (!normalizedSql.includes('novadb.') && !normalizedSql.includes('novadb ')) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: '只能执行 novadb schema 的 SQL',
      };
    }

    try {
      const startTime = Date.now();
      const result = await client.query(sql, params);
      const executionTime = Date.now() - startTime;

      return {
        columns: result.fields.map((f) => f.name),
        rows: result.rows,
        rowCount: result.rowCount || 0,
        executionTime,
      };
    } catch (error: any) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        executionTime: 0,
        error: error.message || 'SQL 执行失败',
      };
    }
  }

  // ========== Helpers ==========

  private getPgType(type: ColumnType): string {
    switch (type) {
      case 'text':
        return 'TEXT';
      case 'number':
        return 'DOUBLE PRECISION';
      case 'boolean':
        return 'BOOLEAN';
      case 'datetime':
        return 'TIMESTAMP';
      default:
        return 'TEXT';
    }
  }

  private formatDefaultValue(type: ColumnType, value: string): string {
    switch (type) {
      case 'text':
        return `'${value.replace(/'/g, "''")}'`;
      case 'number':
        return value;
      case 'boolean':
        return value.toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
      case 'datetime':
        return `'${value}'`;
      default:
        return `'${value}'`;
    }
  }

  // ========== Template & Import ==========

  async generateTemplate(tableId: string): Promise<{ filename: string; content: string }> {
    const novaTable = await this.findTableById(tableId);
    const columns = novaTable.columns.sort((a, b) => a.columnOrder - b.columnOrder);

    // CSV header (exclude id column)
    const headers = columns.map(c => c.name);
    const csvContent = headers.join(',') + '\n';

    return {
      filename: `${novaTable.name}_template.csv`,
      content: csvContent,
    };
  }

  async importData(tableId: string, file: Express.Multer.File): Promise<{ success: boolean; imported: number; errors: string[] }> {
    const novaTable = await this.findTableById(tableId);
    const tableName = `ud_${novaTable.name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')}`;
    const client = await this.getPgClient();

    const columns = novaTable.columns.sort((a, b) => a.columnOrder - b.columnOrder);
    const columnNames = columns.map(c => c.name);

    // Parse CSV
    const Papa = require('papaparse');
    const parsed = Papa.parse(file.buffer.toString('utf-8'), {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
    });

    if (parsed.errors.length > 0) {
      throw new BadRequestException(`CSV 解析错误: ${parsed.errors[0].message}`);
    }

    const data = parsed.data as Record<string, string>[];
    const errors: string[] = [];
    let imported = 0;

    // Batch insert (100 rows per batch)
    const batchSize = 100;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const values: any[] = [];
      const placeholders: string[] = [];

      for (const row of batch) {
        // Validate column count
        const rowColumns = Object.keys(row);
        if (rowColumns.length !== columnNames.length) {
          errors.push(`行 ${i + data.indexOf(row) + 2}: 列数不匹配，期望 ${columnNames.length} 列，实际 ${rowColumns.length} 列`);
          continue;
        }

        // Build values array
        const rowValues = columnNames.map(colName => {
          const value = row[colName];
          const column = columns.find(c => c.name === colName);

          if (value === undefined || value === null || value === '') {
            if (column?.isNullable) {
              return null;
            }
            // Use default value if available
            if (column?.defaultValue) {
              return this.parseValueByType(column.defaultValue, column.type);
            }
            // For non-nullable without default, use empty string for text
            if (column?.type === 'text') {
              return '';
            }
            return null;
          }

          return this.parseValueByType(value, column?.type || 'text');
        });

        values.push(...rowValues);
        placeholders.push(`(${rowValues.map((_, idx) => `$${values.length - rowValues.length + idx + 1}`).join(', ')})`);
      }

      if (placeholders.length > 0) {
        try {
          const insertSql = `INSERT INTO novadb.${tableName} (${columnNames.map(c => `"${c}"`).join(', ')}) VALUES ${placeholders.join(', ')}`;
          await client.query(insertSql, values);
          imported += placeholders.length;
        } catch (error: any) {
          errors.push(`批量插入失败: ${error.message}`);
        }
      }
    }

    return {
      success: true,
      imported,
      errors,
    };
  }

  private parseValueByType(value: string, type: ColumnType): any {
    switch (type) {
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      case 'datetime':
        return value;
      default:
        return value;
    }
  }
}
