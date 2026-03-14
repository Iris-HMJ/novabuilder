import { create } from 'zustand';
import type { Query, QueryResult, QueryType, QueryContent } from '@novabuilder/shared';
import { queryApi } from '../api/query';

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

  // Execute query (supports both stored queries and inline page queries)
  executeQuery: (query: any) => Promise<void>;

  // Clear all results
  clearAllResults: () => void;

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

  // Execute a query - supports both stored queries (by id) and inline page queries (full query object)
  executeQuery: async (query: any) => {
    const queryId = query.id;
    const queryName = query.name || queryId;

    // Mark as loading
    set((state) => ({
      isExecuting: true,
      queryResults: {
        ...state.queryResults,
        [queryId]: { data: undefined, executionTime: 0, error: undefined },
        [queryName]: { data: undefined, executionTime: 0, error: undefined },
      },
    }));

    try {
      let result: QueryResult;

      if (query.id && !query.sql && !query.content?.sql) {
        // Stored query - use API with query ID
        result = await queryApi.execute(query.id);
      } else {
        // Inline query - use preview API with query config
        result = await queryApi.preview({
          appId: query.appId || '',
          dataSourceId: query.dataSourceId,
          type: query.type || 'sql',
          content: query.content || { sql: query.sql || '' },
        });
      }

      // Store result by both id and name
      set((state) => ({
        isExecuting: false,
        queryResults: {
          ...state.queryResults,
          [queryId]: result,
          [queryName]: result,
        },
      }));
    } catch (error: any) {
      set((state) => ({
        isExecuting: false,
        queryResults: {
          ...state.queryResults,
          [queryId]: { data: undefined, executionTime: 0, error: error.message },
          [queryName]: { data: undefined, executionTime: 0, error: error.message },
        },
      }));
    }
  },

  // Clear all query results
  clearAllResults: () => set({ queryResults: {} }),
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
