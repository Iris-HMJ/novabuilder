import apiClient from './client';

export interface AiRequirement {
  appName: string;
  summary: string;
  pages: any[];
  dataModel: any[];
  queries: any[];
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    type?: 'requirement' | 'generation' | 'modification' | 'patchApplied';
    data?: any;
  };
  createdAt: string;
}

// Step 8: Patch types
export interface AppPatch {
  summary: string;
  actions: PatchAction[];
}

export type PatchAction =
  | { type: 'updateComponent'; componentId: string; changes: Record<string, any> }
  | { type: 'addComponent'; component: any; pageId?: string }
  | { type: 'removeComponent'; componentId: string }
  | { type: 'addQuery'; query: any; pageId?: string }
  | { type: 'updateQuery'; queryId: string; changes: Record<string, any> }
  | { type: 'removeQuery'; queryId: string }
  | { type: 'addColumn'; tableName: string; column: { name: string; type: string } }
  | { type: 'addTable'; table: { tableName: string; description?: string; columns: any[] } };

export const aiApi = {
  // 需求分析
  analyze: (input: string, appId?: string) =>
    apiClient.post('/ai/analyze', { input, appId }),

  // 应用生成
  generate: (requirement: AiRequirement, appId: string) =>
    apiClient.post('/ai/generate', { requirement, appId }),

  // SQL 生成
  generateSQL: (description: string, dataSourceId: string) =>
    apiClient.post('/ai/generate-sql', { description, dataSourceId }),

  // Step 8: 增量修改 - 生成 Patch
  modify: (instruction: string, appId: string, pageId?: string) =>
    apiClient.post('/ai/modify', { instruction, appId, pageId }),

  // Step 8: 增量修改 - 应用 Patch
  applyPatch: (appId: string, patch: AppPatch, pageId?: string) =>
    apiClient.post('/ai/apply-patch', { appId, patch, pageId }),

  // 获取会话历史
  getHistory: (appId: string) =>
    apiClient.get<AiMessage[]>(`/ai/sessions/${appId}`),
};
