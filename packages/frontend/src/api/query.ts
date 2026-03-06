import apiClient from './client';

export type QueryType = 'sql' | 'javascript' | 'visual' | 'rest';

export interface Query {
  id: string;
  appId: string;
  name: string;
  dataSourceId: string;
  type: QueryType;
  content: any;
  options: any;
  createdAt: string;
  updatedAt: string;
}

export interface QueryContent {
  sql?: string;
  code?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete';
  tableName?: string;
  columns?: string[];
  filters?: any[];
  orders?: any[];
  pagination?: any;
  values?: Record<string, any>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url?: string;
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

export interface QueryResult {
  data: any;
  rowsAffected?: number;
  executionTime: number;
  error?: string;
}

export interface PreviewQueryDto {
  appId: string;
  dataSourceId: string;
  type: QueryType;
  content: QueryContent;
  parameters?: Record<string, any>;
}

export const queryApi = {
  list: async (appId: string): Promise<Query[]> => {
    const response = await apiClient.get<Query[]>(`/queries?appId=${appId}`);
    return response.data;
  },

  get: async (id: string): Promise<Query> => {
    const response = await apiClient.get<Query>(`/queries/${id}`);
    return response.data;
  },

  create: async (data: CreateQueryDto): Promise<Query> => {
    const response = await apiClient.post<Query>('/queries', data);
    return response.data;
  },

  update: async (id: string, data: UpdateQueryDto): Promise<Query> => {
    const response = await apiClient.put<Query>(`/queries/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/queries/${id}`);
  },

  execute: async (id: string, parameters?: Record<string, any>): Promise<QueryResult> => {
    const response = await apiClient.post<QueryResult>(`/queries/${id}/run`, { parameters });
    return response.data;
  },

  preview: async (data: PreviewQueryDto): Promise<QueryResult> => {
    const response = await apiClient.post<QueryResult>('/queries/preview', data);
    return response.data;
  },
};
