import { create } from 'zustand';
import { aiApi, AiRequirement, AiMessage, AppPatch } from '../api/ai';

type AiStatus = 'idle' | 'analyzing' | 'showingSummary' | 'generating' | 'done' | 'error'
  | 'modifying' | 'showingPatch' | 'applyingPatch';

interface AiState {
  isOpen: boolean;
  messages: AiMessage[];
  status: AiStatus;
  currentRequirement: AiRequirement | null;
  generateProgress: number;
  error: string | null;

  // Step 8: 增量修改相关
  currentPatch: AppPatch | null;
  patchSummary: string | null;

  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  sendMessage: (input: string, appId: string) => Promise<void>;
  confirmGenerate: (appId: string) => Promise<any>;
  generateSQL: (description: string, dataSourceId: string) => Promise<{ sql: string; explanation: string }>;
  loadHistory: (appId: string) => Promise<void>;
  reset: () => void;

  // Step 8: 增量修改 actions
  sendModification: (instruction: string, appId: string, pageId?: string) => Promise<void>;
  confirmPatch: (appId: string, onSuccess?: (appDefinition: any) => void) => Promise<any>;
  rejectPatch: () => void;
}

export const useAiStore = create<AiState>((set, get) => ({
  isOpen: false,
  messages: [],
  status: 'idle',
  currentRequirement: null,
  generateProgress: 0,
  error: null,

  // Step 8: 增量修改相关
  currentPatch: null,
  patchSummary: null,

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),

  openPanel: () => set({ isOpen: true }),

  closePanel: () => set({ isOpen: false }),

  sendMessage: async (input: string, appId: string) => {
    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], status: 'analyzing', error: null }));

    try {
      const res = await aiApi.analyze(input, appId);
      const requirement = res.data;

      const aiMsg: AiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: requirement.summary || '已分析完成，请确认需求摘要：',
        metadata: { type: 'requirement', data: requirement },
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, aiMsg],
        status: 'showingSummary',
        currentRequirement: requirement,
      }));
    } catch (err: any) {
      set(() => ({
        status: 'error',
        error: err.response?.data?.message || 'AI 分析失败，请重试',
      }));
    }
  },

  confirmGenerate: async (appId: string) => {
    const { currentRequirement } = get();
    if (!currentRequirement) return;

    set({ status: 'generating', generateProgress: 10 });

    const progressInterval = setInterval(() => {
      set((s) => ({
        generateProgress: Math.min(s.generateProgress + 15, 85),
      }));
    }, 1500);

    try {
      const res = await aiApi.generate(currentRequirement, appId);
      clearInterval(progressInterval);

      const doneMsg: AiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `应用已生成！创建了 ${res.data.createdTables?.length || 0} 个数据表。你可以在画布上查看和编辑。`,
        metadata: { type: 'generation', data: res.data },
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, doneMsg],
        status: 'done',
        generateProgress: 100,
      }));

      return res.data;
    } catch (err: any) {
      clearInterval(progressInterval);
      set(() => ({
        status: 'error',
        error: err.response?.data?.message || '应用生成失败，请重试',
      }));
    }
  },

  generateSQL: async (description: string, dataSourceId: string) => {
    const res = await aiApi.generateSQL(description, dataSourceId);
    return res.data;
  },

  loadHistory: async (appId: string) => {
    try {
      const res = await aiApi.getHistory(appId);
      set({ messages: res.data || [] });
    } catch {
      // 静默失败
    }
  },

  reset: () =>
    set({
      messages: [],
      status: 'idle',
      currentRequirement: null,
      generateProgress: 0,
      error: null,
      currentPatch: null,
      patchSummary: null,
    }),

  // Step 8: 增量修改 - 发送修改请求
  sendModification: async (instruction: string, appId: string, pageId?: string) => {
    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: instruction,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ messages: [...s.messages, userMsg], status: 'modifying', error: null }));

    try {
      const res = await aiApi.modify(instruction, appId, pageId);
      const { patch } = res.data;

      const aiMsg: AiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: patch.summary || '已生成修改方案：',
        metadata: { type: 'modification', data: patch },
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, aiMsg],
        status: 'showingPatch',
        currentPatch: patch,
        patchSummary: patch.summary,
      }));
    } catch (err: any) {
      set(() => ({
        status: 'error',
        error: err.response?.data?.message || '修改方案生成失败，请重试',
      }));
    }
  },

  // Step 8: 增量修改 - 确认应用 Patch
  confirmPatch: async (appId: string, onSuccess?: (appDefinition: any) => void) => {
    const { currentPatch } = get();
    if (!currentPatch) return;

    set({ status: 'applyingPatch' });

    try {
      const res = await aiApi.applyPatch(appId, currentPatch);
      const appDefinition = res.data.appDefinition;

      const doneMsg: AiMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `修改已应用！`,
        metadata: { type: 'patchApplied', data: { appDefinition } },
        createdAt: new Date().toISOString(),
      };
      set((s) => ({
        messages: [...s.messages, doneMsg],
        status: 'done',
        currentPatch: null,
        patchSummary: null,
      }));

      // 回调通知外部更新应用定义
      if (onSuccess) {
        onSuccess(appDefinition);
      }

      return { appDefinition };
    } catch (err: any) {
      set(() => ({
        status: 'error',
        error: err.response?.data?.message || '应用修改失败，请重试',
      }));
    }
  },

  // Step 8: 增量修改 - 拒绝 Patch
  rejectPatch: () => {
    set({
      currentPatch: null,
      patchSummary: null,
      status: 'idle',
    });
  },
}));
