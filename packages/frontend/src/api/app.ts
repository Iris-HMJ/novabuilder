import apiClient from './client';
import type { App, CreateAppDto, UpdateAppDto, AppDefinition } from '@novabuilder/shared';

export const appApi = {
  list: async (params?: { page?: number; pageSize?: number; search?: string }) => {
    const response = await apiClient.get<{ data: App[]; total: number }>('/apps', { params });
    return response.data;
  },

  get: async (id: string): Promise<App> => {
    const response = await apiClient.get<App>(`/apps/${id}`);
    return response.data;
  },

  create: async (data: CreateAppDto): Promise<App> => {
    const response = await apiClient.post<App>('/apps', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAppDto): Promise<App> => {
    const response = await apiClient.patch<App>(`/apps/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/apps/${id}`);
  },

  publish: async (id: string): Promise<App> => {
    const response = await apiClient.post<App>(`/apps/${id}/publish`);
    return response.data;
  },

  rollback: async (id: string): Promise<App> => {
    const response = await apiClient.post<App>(`/apps/${id}/rollback`);
    return response.data;
  },

  clone: async (id: string): Promise<App> => {
    const response = await apiClient.post<App>(`/apps/${id}/clone`);
    return response.data;
  },

  getPublished: async (id: string): Promise<{ id: string; name: string; definition: AppDefinition }> => {
    const response = await apiClient.get(`/apps/${id}/published`);
    return response.data;
  },
};
