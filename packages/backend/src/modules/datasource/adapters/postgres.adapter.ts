import { IDataSourceAdapter, TestConnectionResult, SchemaResult, QueryResult, TableInfo, ColumnInfo } from './datasource-adapter.interface';
import { PostgreSQLConfig } from '@novabuilder/shared/types/datasource';

export class PostgresAdapter implements IDataSourceAdapter {
  private client: any;
  private config: PostgreSQLConfig;

  constructor(config: PostgreSQLConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const { Client } = require('pg');
    this.client = new Client({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
    });
    await this.client.connect();
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      await this.connect();
      await this.client.query('SELECT 1');
      await this.disconnect();
      return { success: true, message: '连接成功' };
    } catch (error: any) {
      return { success: false, message: '连接失败', error: error.message };
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    if (!this.client) {
      await this.connect();
    }
    const result = await this.client.query(query, params);
    return {
      columns: result.fields.map((f: any) => f.name),
      rows: result.rows,
      rowCount: result.rowCount,
    };
  }

  async getSchema(): Promise<SchemaResult> {
    if (!this.client) {
      await this.connect();
    }

    // Get all tables
    const tablesResult = await this.client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);

    const tables: TableInfo[] = [];

    for (const row of tablesResult.rows) {
      const columnsResult = await this.client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'public'
      `, [row.table_name]);

      const columns: ColumnInfo[] = columnsResult.rows.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
      }));

      tables.push({ name: row.table_name, columns });
    }

    return { tables };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
  }
}
