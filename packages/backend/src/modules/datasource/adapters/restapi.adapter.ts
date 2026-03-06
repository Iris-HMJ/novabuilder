import axios, { AxiosInstance } from 'axios';
import { IDataSourceAdapter, TestConnectionResult, SchemaResult, QueryResult } from './datasource-adapter.interface';
import { RestAPIConfig } from '@novabuilder/shared/types/datasource';

export class RestApiAdapter implements IDataSourceAdapter {
  private client: AxiosInstance;
  private config: RestAPIConfig;

  constructor(config: RestAPIConfig) {
    this.config = config;

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.defaultHeaders,
    };

    if (config.auth) {
      if (config.auth.type === 'bearer' && config.auth.value) {
        headers['Authorization'] = `Bearer ${config.auth.value}`;
      } else if (config.auth.type === 'apikey' && config.auth.key && config.auth.value) {
        headers[config.auth.key] = config.auth.value;
      } else if (config.auth.type === 'basic' && config.auth.value) {
        const basic = Buffer.from(config.auth.value).toString('base64');
        headers['Authorization'] = `Basic ${basic}`;
      }
    }

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers,
      timeout: 30000,
    });
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      await this.client.get('/');
      return { success: true, message: '连接成功' };
    } catch (error: any) {
      // Even if the root path returns 404, if we got a response, the connection is OK
      if (error.response) {
        return { success: true, message: `连接成功 (状态码: ${error.response.status})` };
      }
      return { success: false, message: '连接失败', error: error.message };
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    // For REST API, the "query" is actually the HTTP method + path
    // Format: "GET /users" or "POST /users"
    const [method, path] = query.split(' ');

    try {
      const response = await this.client.request({
        method: method.toLowerCase(),
        url: path,
        data: params?.[0], // First param is request body
      });

      // Convert response to query result format
      const data = response.data;
      const rows = Array.isArray(data) ? data : [data];

      return {
        columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        rows,
        rowCount: rows.length,
      };
    } catch (error: any) {
      throw new Error(`REST API 请求失败: ${error.message}`);
    }
  }

  async getSchema(): Promise<SchemaResult> {
    // REST API doesn't have a schema in the traditional sense
    // Return empty schema
    return { tables: [] };
  }

  async disconnect(): Promise<void> {
    // No persistent connection for REST API
  }
}
