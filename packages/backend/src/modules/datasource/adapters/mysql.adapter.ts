import { IDataSourceAdapter, TestConnectionResult, SchemaResult, QueryResult, TableInfo, ColumnInfo } from './datasource-adapter.interface';
import { MySQLConfig } from '@novabuilder/shared/types/datasource';

export class MysqlAdapter implements IDataSourceAdapter {
  private connection: any;
  private config: MySQLConfig;

  constructor(config: MySQLConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const mysql = require('mysql2/promise');
    this.connection = await mysql.createConnection({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : undefined,
    });
  }

  async testConnection(): Promise<TestConnectionResult> {
    try {
      await this.connect();
      await this.connection.query('SELECT 1');
      await this.disconnect();
      return { success: true, message: '连接成功' };
    } catch (error: any) {
      return { success: false, message: '连接失败', error: error.message };
    }
  }

  async executeQuery(query: string, params?: any[]): Promise<QueryResult> {
    if (!this.connection) {
      await this.connect();
    }
    const [rows, fields] = await this.connection.query(query, params);
    const resultRows = Array.isArray(rows) ? rows : [rows];
    return {
      columns: fields ? fields.map((f: any) => f.name) : [],
      rows: resultRows,
      rowCount: resultRows.length,
    };
  }

  async getSchema(): Promise<SchemaResult> {
    if (!this.connection) {
      await this.connect();
    }

    const [tables] = await this.connection.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
    `);

    const tableList: TableInfo[] = [];

    for (const row of tables) {
      const [columns] = await this.connection.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_key
        FROM information_schema.columns
        WHERE table_name = ? AND table_schema = DATABASE()
      `, [row.table_name]);

      const columnInfos: ColumnInfo[] = columns.map((col: any) => ({
        name: col.column_name,
        type: col.data_type,
        nullable: col.is_nullable === 'YES',
        isPrimaryKey: col.column_key === 'PRI',
      }));

      tableList.push({ name: row.table_name, columns: columnInfos });
    }

    return { tables: tableList };
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}
