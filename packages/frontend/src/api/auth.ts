import apiClient from './client';
import type { LoginRequest, LoginResponse, RegisterRequest } from '@novabuilder/shared';
import type { User } from '@novabuilder/shared';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (refreshToken: string): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  me: async (): Promise<{ user: User }> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};
