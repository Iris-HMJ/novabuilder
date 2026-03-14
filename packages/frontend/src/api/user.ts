import apiClient from './client';
import type { User } from '@novabuilder/shared';

export const userApi = {
  list: async () => {
    const res = await apiClient.get<{ data: User[] }>('/users');
    return res.data;
  },

  get: async (id: string) => {
    const res = await apiClient.get<User>(`/users/${id}`);
    return res.data;
  },

  update: async (id: string, data: { name?: string; role?: string; isActive?: boolean }) => {
    const res = await apiClient.patch<User>(`/users/${id}`, data);
    return res.data;
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
};
