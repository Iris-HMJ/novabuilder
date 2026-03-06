import { IDataSourceAdapter, TestConnectionResult, SchemaResult, QueryResult, TableInfo, ColumnInfo } from './datasource-adapter.interface';

export class NovaDBAdapter implements IDataSourceAdapter {
  private client: any;

  constructor(_config: any) {
    // NovaDB uses the built-in PostgreSQL connection, no additional config needed
  }

  private async getClient(): Promise<any> {
    if (!this.client) {
      const { Client } = require('pg');
      // Connect to the same database but use novadb schema
      this.client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'novabuilder',
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      });
      await this.client.connect();
    }
    return this.client;
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      const client = await this.getClient();
      await client.query('SELECT 1');
      return { success: true, message: 'NovaDB 连接成功' };
    } catch (error: any) {
      return { success: false, message: 'NovaDB 连接失败', error: error.message };
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    const client = await this.getClient();
    const result = await client.query(query, params);
    return {
      columns: result.fields.map((f: any) => f.name),
      rows: result.rows,
      rowCount: result.rowCount,
    };
  }

  async getSchema(): Promise<SchemaResult> {
    const client = await this.getClient();

    // Get all tables from novadb schema
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'novadb'
      AND table_type = 'BASE TABLE'
    `);

    const tables: TableInfo[] = [];

    for (const row of tablesResult.rows) {
      const columnsResult = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_name = $1 AND table_schema = 'novadb'
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
