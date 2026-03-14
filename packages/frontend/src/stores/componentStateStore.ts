import { create } from 'zustand';

// 组件状态类型
export interface ComponentStates {
  // Table 组件状态
  selectedRow?: Record<string, any>;
  selectedRows?: Record<string, any>[];
  // TextInput 组件状态
  value?: string;
  // Select 组件状态
  selectedOption?: { label: string; value: any };
}

interface ComponentStateStore {
  // 组件状态存储: componentId -> 状态
  states: Record<string, ComponentStates>;

  // 设置组件状态
  setState: (componentId: string, key: keyof ComponentStates, value: any) => void;

  // 获取组件状态
  getState: (componentId: string, key: keyof ComponentStates) => any;

  // 获取组件所有状态
  getAllStates: (componentId: string) => ComponentStates;

  // 清除组件状态
  clearState: (componentId: string) => void;

  // 清除所有状态
  clearAll: () => void;
}

export const useComponentStateStore = create<ComponentStateStore>((set, get) => ({
  states: {},

  setState: (componentId: string, key: keyof ComponentStates, value: any) => {
    set((s) => ({
      states: {
        ...s.states,
        [componentId]: {
          ...s.states[componentId],
          [key]: value,
        },
      },
    }));
  },

  getState: (componentId: string, key: keyof ComponentStates) => {
    return get().states[componentId]?.[key];
  },

  getAllStates: (componentId: string) => {
    return get().states[componentId] || {};
  },

  clearState: (componentId: string) => {
    set((s) => {
      const newStates = { ...s.states };
      delete newStates[componentId];
      return { states: newStates };
    });
  },

  clearAll: () => {
    set({ states: {} });
  },
}));
