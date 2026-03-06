// DataSource Types

export type DataSourceType = 'postgresql' | 'mysql' | 'restapi' | 'novadb';

export interface DataSource {
  id: string;
  workspaceId: string;
  name: string;
  type: DataSourceType;
  config: DataSourceConfig;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DataSourceConfig =
  | PostgreSQLConfig
  | MySQLConfig
  | RestAPIConfig
  | NovaDBConfig;

export interface BaseConfig {
  // 公共配置
}

export interface PostgreSQLConfig extends BaseConfig {
  type: 'postgresql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  sslCa?: string;
  sslCert?: string;
  sslKey?: string;
}

export interface MySQLConfig extends BaseConfig {
  type: 'mysql';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RestAPIConfig extends BaseConfig {
  type: 'restapi';
  baseUrl: string;
  auth: {
    type: 'none' | 'apikey' | 'bearer' | 'basic';
    key?: string;
    value?: string;
    headerName?: string;
  };
  defaultHeaders?: Record<string, string>;
}

export interface NovaDBConfig extends BaseConfig {
  type: 'novadb';
}

export interface CreateDataSourceDto {
  name: string;
  workspaceId: string;
  type: DataSourceType;
  config: DataSourceConfig;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  error?: string;
}
