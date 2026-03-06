export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey?: boolean;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  error?: string;
}

export interface SchemaResult {
  tables: TableInfo[];
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
}

export interface IDataSourceAdapter {
  testConnection(): Promise<TestConnectionResult>;
  executeQuery(query: string, params?: any[]): Promise<QueryResult>;
  getSchema(): Promise<SchemaResult>;
  disconnect(): Promise<void>;
}
