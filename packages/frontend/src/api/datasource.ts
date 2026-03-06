import apiClient from './client';

export type DataSourceStatus = 'connected' | 'untested' | 'failed';

export interface DataSource {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'restapi' | 'novadb';
  status?: DataSourceStatus;
  lastTestedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  config?: any; // For detail view with decrypted (masked) config
}

export interface CreateDataSourceDto {
  name: string;
  type: 'postgresql' | 'mysql' | 'restapi';
  config: any;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  error?: string;
}

export const dataSourceApi = {
  list: async (): Promise<DataSource[]> => {
    const response = await apiClient.get<DataSource[]>('/data-sources');
    return response.data;
  },

  get: async (id: string): Promise<DataSource> => {
    const response = await apiClient.get<DataSource>(`/data-sources/${id}`);
    return response.data;
  },

  create: async (data: CreateDataSourceDto): Promise<DataSource> => {
    const response = await apiClient.post<DataSource>('/data-sources', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateDataSourceDto>): Promise<DataSource> => {
    const response = await apiClient.put<DataSource>(`/data-sources/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/data-sources/${id}`);
  },

  testConnection: async (id: string): Promise<TestConnectionResult> => {
    const response = await apiClient.post<TestConnectionResult>(`/data-sources/${id}/test`);
    return response.data;
  },

  testConnectionDirect: async (type: string, config: any): Promise<TestConnectionResult> => {
    const response = await apiClient.post<TestConnectionResult>('/data-sources/test', { type, config });
    return response.data;
  },

  getSchema: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/data-sources/${id}/schema`);
    return response.data;
  },
};
