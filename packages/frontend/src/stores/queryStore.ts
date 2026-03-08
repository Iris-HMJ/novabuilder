import { create } from 'zustand';
import type { Query, QueryResult, QueryType, QueryContent } from '@novabuilder/shared';

interface QueryState {
  // Query data
  queries: Query[];
  activeQueryId: string | null;
  queryResults: Record<string, QueryResult>;

  // Loading states
  isLoading: boolean;
  isExecuting: boolean;

  // Actions
  setQueries: (queries: Query[]) => void;
  addQuery: (query: Query) => void;
  updateLocalQuery: (queryId: string, updates: Partial<Query>) => void;
  deleteQuery: (queryId: string) => void;
  setActiveQuery: (queryId: string | null) => void;
  setQueryResult: (queryId: string, result: QueryResult) => void;
  clearQueryResult: (queryId: string) => void;
  setLoading: (loading: boolean) => void;
  setExecuting: (executing: boolean) => void;

  // Helpers
  getActiveQuery: () => Query | null;
  getQueryResult: (queryId: string) => QueryResult | null;
}

export const useQueryStore = create<QueryState>()((set, get) => ({
  // Initial state
  queries: [],
  activeQueryId: null,
  queryResults: {},
  isLoading: false,
  isExecuting: false,

  // Actions
  setQueries: (queries) => set({ queries }),

  addQuery: (query) => set((state) => ({ queries: [...state.queries, query] })),

  updateLocalQuery: (queryId, updates) => {
    set((state) => ({
      queries: state.queries.map((q) => (q.id === queryId ? { ...q, ...updates } : q)),
    }));
  },

  deleteQuery: (queryId) => {
    set((state) => ({
      queries: state.queries.filter((q) => q.id !== queryId),
      activeQueryId: state.activeQueryId === queryId ? null : state.activeQueryId,
    }));
  },

  setActiveQuery: (queryId) => set({ activeQueryId: queryId }),

  setQueryResult: (queryId, result) => {
    set((state) => ({
      queryResults: { ...state.queryResults, [queryId]: result },
    }));
  },

  clearQueryResult: (queryId) => {
    set((state) => {
      const newResults = { ...state.queryResults };
      delete newResults[queryId];
      return { queryResults: newResults };
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setExecuting: (executing) => set({ isExecuting: executing }),

  // Helpers
  getActiveQuery: () => {
    const { queries, activeQueryId } = get();
    return queries.find((q) => q.id === activeQueryId) || null;
  },

  getQueryResult: (queryId) => {
    const { queryResults } = get();
    return queryResults[queryId] || null;
  },
}));

// Helper to create a new query with defaults
export const createNewQuery = (
  appId: string,
  name: string,
  dataSourceId: string,
  type: QueryType
): Query => {
  const now = new Date();

  const getDefaultContent = (queryType: QueryType): QueryContent => {
    switch (queryType) {
      case 'sql':
        return { sql: '' };
      case 'javascript':
        return { code: '// 处理查询结果\nreturn data;' };
      case 'visual':
        return {
          operation: 'select',
          tableName: '',
          columns: [],
          filters: [],
          orders: [],
          pagination: { page: 1, pageSize: 10 },
        } as QueryContent;
      case 'rest':
        return { method: 'GET', url: '', headers: {}, params: {}, body: undefined };
      default:
        return { sql: '' };
    }
  };

  return {
    id: Math.random().toString(36).substring(2, 11),
    appId,
    name,
    dataSourceId,
    type,
    content: getDefaultContent(type),
    options: {
      runOnPageLoad: false,
      timeout: 30000,
    },
    createdAt: now,
    updatedAt: now,
  };
};
