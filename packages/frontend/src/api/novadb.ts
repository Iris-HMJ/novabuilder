import apiClient from './client';

export interface NovaTable {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NovaColumn {
  id: string;
  tableId: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'datetime';
  isNullable: boolean;
  defaultValue?: string;
  columnOrder: number;
  createdAt: string;
}

export interface QueryRowsParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  filters?: string; // JSON stringified array of { column: string; operator: string; value: any }
  sorts?: string; // JSON stringified array of { column: string; order: 'asc' | 'desc' }
}

export interface QueryRowsResult {
  rows: Record<string, any>[];
  total: number;
}

export interface SqlResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export const novadbApi = {
  // Tables
  getTables: () => apiClient.get<NovaTable[]>('/novadb/tables'),

  getTable: (id: string) => apiClient.get<NovaTable>(`/novadb/tables/${id}`),

  createTable: (name: string, createdBy: string) =>
    apiClient.post<NovaTable>('/novadb/tables', { name, createdBy }),

  updateTable: (id: string, name: string) =>
    apiClient.patch<NovaTable>(`/novadb/tables/${id}`, { name }),

  deleteTable: (id: string) => apiClient.delete(`/novadb/tables/${id}`),

  // Columns
  getColumns: (tableId: string) =>
    apiClient.get<NovaColumn[]>(`/novadb/tables/${tableId}/columns`),

  addColumn: (tableId: string, data: Partial<NovaColumn>) =>
    apiClient.post<NovaColumn>(`/novadb/tables/${tableId}/columns`, data),

  updateColumn: (tableId: string, columnId: string, data: Partial<NovaColumn>) =>
    apiClient.put<NovaColumn>(`/novadb/tables/${tableId}/columns/${columnId}`, data),

  deleteColumn: (tableId: string, columnId: string) =>
    apiClient.delete(`/novadb/tables/${tableId}/columns/${columnId}`),

  // Rows
  queryRows: (tableId: string, params?: QueryRowsParams) =>
    apiClient.get<QueryRowsResult>(`/novadb/tables/${tableId}/rows`, { params }),

  createRow: (tableId: string, data: Record<string, any>) =>
    apiClient.post<any>(`/novadb/tables/${tableId}/rows`, { data }),

  updateRow: (tableId: string, rowId: string, data: Record<string, any>) =>
    apiClient.put<any>(`/novadb/tables/${tableId}/rows/${rowId}`, { data }),

  deleteRows: (tableId: string, ids: string[]) =>
    apiClient.delete(`/novadb/tables/${tableId}/rows`, { data: { ids } }),

  // SQL
  executeSql: (sql: string, params?: any[]) =>
    apiClient.post<SqlResult>('/novadb/sql', { sql, params }),

  // Template & Import
  getTemplate: (tableId: string) =>
    apiClient.get(`/novadb/tables/${tableId}/template`, { responseType: 'blob' }),

  importData: (tableId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ImportResult>(`/novadb/tables/${tableId}/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
