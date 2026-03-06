// Query Types

import { DataSourceType } from './datasource';

export type QueryType = 'sql' | 'javascript' | 'visual' | 'rest';

export interface Query {
  id: string;
  appId: string;
  name: string;
  dataSourceId: string;
  type: QueryType;
  content: QueryContent;
  options: QueryOptions;
  createdAt: Date;
  updatedAt: Date;
}

export type QueryContent =
  | SqlQueryContent
  | JavascriptQueryContent
  | VisualQueryContent
  | RestApiQueryContent;

export interface SqlQueryContent {
  sql: string;
}

export interface JavascriptQueryContent {
  code: string;
}

export interface VisualQueryContent {
  operation: 'select' | 'insert' | 'update' | 'delete';
  tableName: string;
  columns?: string[];
  filters?: VisualFilter[];
  orders?: VisualOrder[];
  pagination?: VisualPagination;
  values?: Record<string, any>; // For insert/update
}

export interface VisualFilter {
  column: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'like' | 'in' | 'is_null' | 'is_not_null';
  value: any;
  logic?: 'and' | 'or';
}

export interface VisualOrder {
  column: string;
  direction: 'asc' | 'desc';
}

export interface VisualPagination {
  page: number;
  pageSize: number;
}

export interface RestApiQueryContent {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
}

export interface QueryOptions {
  runOnPageLoad?: boolean;
  confirmationRequired?: boolean;
  timeout?: number;
  transformer?: string;
  successCallback?: string;
}

export interface CreateQueryDto {
  appId: string;
  name: string;
  dataSourceId: string;
  type: QueryType;
  content: QueryContent;
  options?: QueryOptions;
}

export interface UpdateQueryDto {
  name?: string;
  content?: QueryContent;
  options?: QueryOptions;
}

export interface ExecuteQueryDto {
  parameters?: Record<string, any>;
}

export interface PreviewQueryDto {
  appId: string;
  dataSourceId: string;
  type: QueryType;
  content: QueryContent;
  parameters?: Record<string, any>;
}

export interface QueryResult {
  data: any;
  rowsAffected?: number;
  executionTime: number;
  error?: string;
}

// Query Trigger Types
export type QueryTriggerType = 'onPageLoad' | 'onEvent';

export interface QueryTrigger {
  type: QueryTriggerType;
  event?: string;
}
