import React, { useState, useRef, useCallback, useEffect, useImperativeHandle } from 'react';
import {
  Tabs,
  Select,
  Button,
  Space,
  Table,
  Input,
  Checkbox,
  Modal,
  message,
  Spin,
  Dropdown,
  Typography,
} from 'antd';
import {
  PlayCircleOutlined,
  PlusOutlined,
  SettingOutlined,
  CodeOutlined,
  DatabaseOutlined,
  ApiOutlined,
  FileTextOutlined,
  CaretUpOutlined,
  CaretDownOutlined,
  DeleteOutlined,
  CopyOutlined,
  EditOutlined,
  SaveOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { queryApi, QueryType, QueryResult, QueryContent } from '../../api/query';
import { novadbApi } from '../../api/novadb';
import { dataSourceApi, DataSource } from '../../api/datasource';
import { useQueryStore } from '../../stores/queryStore';
import { useAuthStore } from '../../stores/authStore';

// Local Query type (avoids Date type mismatch)
interface LocalQuery {
  id: string;
  appId: string;
  name: string;
  dataSourceId: string;
  type: QueryType;
  content: QueryContent;
  options: Record<string, any>;
  lastResult?: QueryResult;
  createdAt: string;
  updatedAt: string;
}

interface QueryPanelWrapperProps {
  appId: string;
  queryPanelRef?: React.RefObject<QueryPanelRef>;
}

export interface QueryPanelRef {
  openPanel: () => void;
  selectQuery: (queryId: string) => void;
  openNewQueryModal: () => void;
  getQueries: () => LocalQuery[];
}

const QueryPanelWrapper: React.FC<QueryPanelWrapperProps> = (props) => {
  const internalRef = useRef<QueryPanelRef>(null);
  const ref = props.queryPanelRef || internalRef;
  const { appId } = props;
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [queries, setQueries] = useState<LocalQuery[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<LocalQuery | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState<string>('sql');
  const [showSettings, setShowSettings] = useState(false);

  // Panel state
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [panelHeight, setPanelHeight] = useState(360);
  const [showResult, setShowResult] = useState(false);
  const [resultExpanded, setResultExpanded] = useState(true);
  const [resultViewMode, setResultViewMode] = useState<'table' | 'json'>('table');
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(280);

  // Modals
  const [newQueryModal, setNewQueryModal] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');
  const [newQueryDataSourceId, setNewQueryDataSourceId] = useState('');
  const [newQueryType, setNewQueryType] = useState<QueryType>('sql');

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameQueryId, setRenameQueryId] = useState<string | null>(null);
  const [renameQueryName, setRenameQueryName] = useState('');

  // Editor state
  const [queryName, setQueryName] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('sql');
  const [dataSourceId, setDataSourceId] = useState('');
  const [content, setContent] = useState<QueryContent>({});
  const [options, setOptions] = useState<Record<string, any>>({});
  const [schema, setSchema] = useState<any>(null);

  // Inline name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingNameValue, setEditingNameValue] = useState('');
  const nameInputRef = useRef<any>(null);

  // Save/clear state
  const [savedContent, setSavedContent] = useState<QueryContent | null>(null);
  const [savedResult, setSavedResult] = useState<QueryResult | null>(null);

  // Inline name editing functions
  const startEditingName = useCallback(() => {
    setEditingNameValue(queryName);
    setIsEditingName(true);
    // Focus and select after render
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 0);
  }, [queryName]);

  const cancelEditingName = useCallback(() => {
    setIsEditingName(false);
    setEditingNameValue('');
  }, []);

  const saveEditingName = useCallback(async () => {
    const newName = editingNameValue.trim();
    if (!newName) {
      message.warning('请输入查询名称');
      return;
    }
    if (!selectedQuery) return;

    const authState = useAuthStore.getState();
    if (!authState._hasHydrated || !authState.accessToken) {
      message.error('请稍候...');
      return;
    }

    try {
      const updated = await queryApi.update(selectedQuery.id, { name: newName });
      const updatedQuery = updated as unknown as LocalQuery;
      const newQueriesList = queries.map(q => q.id === updated.id ? updatedQuery : q);
      setQueries(newQueriesList);
      setQueryStoreQueries(newQueriesList as any);
      setSelectedQuery(updatedQuery);
      setQueryName(updated.name);
      setIsEditingName(false);
      setEditingNameValue('');
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    }
  }, [editingNameValue, selectedQuery, queries]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditingName();
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  }, [saveEditingName, cancelEditingName]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    openPanel: () => setPanelExpanded(true),
    selectQuery: (queryId: string) => {
      const query = queries.find(q => q.id === queryId);
      if (query) {
        setSelectedQuery(query);
        setQueryName(query.name);
        setQueryType(query.type);
        setDataSourceId(query.dataSourceId);
        setContent(query.content || {});
        setOptions(query.options || {});
        setActiveTab(query.type);
        setResult(null);
        setShowResult(false);
        setPanelExpanded(true);
        setIsEditingName(false);
        setEditingNameValue('');
      }
    },
    openNewQueryModal: () => setNewQueryModal(true),
    getQueries: () => queries,
  }), [queries]);

  // Load queries and data sources
  useEffect(() => {
    // Wait for auth to be ready before loading data
    const authState = useAuthStore.getState();
    if (!authState._hasHydrated) {
      // Wait for auth store to hydrate by checking periodically
      const checkAuth = setInterval(() => {
        const state = useAuthStore.getState();
        if (state._hasHydrated) {
          clearInterval(checkAuth);
          loadQueries();
          loadDataSources();
        }
      }, 100);
      return () => clearInterval(checkAuth);
    } else {
      loadQueries();
      loadDataSources();
    }
  }, [appId]);

  const { setQueries: setQueryStoreQueries, setQueryResult } = useQueryStore();

  const loadQueries = async () => {
    setLoading(true);
    try {
      const data = await queryApi.list(appId);
      // Convert to local type to avoid Date type issues
      const localQueries = data as unknown as LocalQuery[];
      setQueries(localQueries);
      // Sync with queryStore
      setQueryStoreQueries(data as any[]);

      // Also restore saved results to queryStore for components
      localQueries.forEach((query) => {
        if (query.lastResult) {
          setQueryResult(query.id, query.lastResult);
        }
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || '加载查询列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadDataSources = async () => {
    try {
      const data = await dataSourceApi.list();
      // Check if NovaDB exists in the list, if not add it as fallback
      const novadbDs = data.find(ds => ds.type === 'novadb');
      if (!novadbDs) {
        const novadbOption: DataSource = {
          id: 'novadb',
          name: 'NovaDB',
          type: 'novadb' as const,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setDataSources([novadbOption, ...data]);
      } else {
        setDataSources(data);
      }
    } catch (error: any) {
      console.error('加载数据源失败', error);
    }
  };

  useEffect(() => {
    if (dataSourceId) {
      loadSchema(dataSourceId);
    }
  }, [dataSourceId]);

  const loadSchema = async (dsId: string) => {
    try {
      const schemaData = await dataSourceApi.getSchema(dsId);
      setSchema(schemaData);
    } catch (error) {
      console.error('加载表结构失败', error);
      setSchema(null);
    }
  };

  // Select query
  const handleSelectQuery = (query: LocalQuery) => {
    setSelectedQuery(query);
    setQueryName(query.name);
    setQueryType(query.type);
    setDataSourceId(query.dataSourceId);
    setContent(query.content || {});
    setOptions(query.options || {});
    setActiveTab(query.type);
    setPanelExpanded(true);

    // Restore saved result if exists
    const lastResult = query.lastResult;
    if (lastResult) {
      setResult(lastResult);
      setSavedContent(query.content || {});
      setSavedResult(lastResult);
      setShowResult(true);
      // Also save to queryStore for components to use
      setQueryResult(query.id, lastResult);
    } else {
      setResult(null);
      setShowResult(false);
    }
  };

  // Create query
  const handleCreateQuery = async () => {
    if (!newQueryName || !newQueryDataSourceId) {
      message.error('请填写查询名称并选择数据源');
      return;
    }

    // Check if auth is ready
    const authState = useAuthStore.getState();
    if (!authState._hasHydrated) {
      message.error('请稍候...');
      return;
    }

    if (!authState.isAuthenticated || !authState.accessToken) {
      message.error('请先登录');
      return;
    }

    try {
      const defaultContent = getDefaultContent(newQueryType);
      const newQuery = await queryApi.create({
        appId,
        name: newQueryName,
        dataSourceId: newQueryDataSourceId,
        type: newQueryType,
        content: defaultContent,
        options: {},
      });
      setQueries([...queries, newQuery as unknown as LocalQuery]);
      setSelectedQuery(newQuery as unknown as LocalQuery);
      setQueryName(newQueryName);
      setQueryType(newQueryType);
      setDataSourceId(newQueryDataSourceId);
      setContent(defaultContent);
      setOptions({});
      setActiveTab(newQueryType);
      setNewQueryModal(false);
      setNewQueryName('');
      setNewQueryDataSourceId('');
      setNewQueryType('sql');
      setPanelExpanded(true);
      message.success('查询创建成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建查询失败');
    }
  };

  const getDefaultContent = (type: QueryType): QueryContent => {
    switch (type) {
      case 'sql': return { sql: '' };
      case 'javascript': return { code: '// Return the data\nreturn data;' };
      case 'visual': return { operation: 'select', tableName: '', columns: [], filters: [], orders: [], pagination: { page: 1, pageSize: 10 } };
      case 'rest': return { method: 'GET', url: '', headers: {}, params: {}, body: undefined };
      default: return { sql: '' };
    }
  };

  const handleTypeChange = (type: QueryType) => {
    setQueryType(type);
    setActiveTab(type);
    setContent(getDefaultContent(type));
  };

  // Delete query
  const handleDeleteQuery = async (id: string) => {
    const authState = useAuthStore.getState();
    if (!authState._hasHydrated || !authState.accessToken) {
      message.error('请稍候...');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个查询吗？',
      onOk: async () => {
        try {
          await queryApi.delete(id);
          setQueries(queries.filter(q => q.id !== id));
          if (selectedQuery?.id === id) {
            setSelectedQuery(null);
            setContent({});
            setQueryName('');
            setPanelExpanded(false);
          }
          message.success('删除成功');
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
  };

  // Copy query
  const handleCopyQuery = async (query: LocalQuery) => {
    try {
      const newQuery = await queryApi.create({
        appId,
        name: `${query.name} (copy)`,
        dataSourceId: query.dataSourceId,
        type: query.type,
        content: query.content,
        options: query.options,
      });
      setQueries([...queries, newQuery as unknown as LocalQuery]);
      message.success('复制成功');
    } catch (error: any) {
      message.error(error.response?.data?.message || '复制失败');
    }
  };

  // Rename
  const handleOpenRename = (query: LocalQuery) => {
    setRenameQueryId(query.id);
    setRenameQueryName(query.name);
    setRenameModalOpen(true);
  };

  const handleRename = async () => {
    if (!renameQueryId || !renameQueryName.trim()) {
      message.warning('请输入查询名称');
      return;
    }
    try {
      const updated = await queryApi.update(renameQueryId, { name: renameQueryName.trim() });
      setQueries(queries.map(q => q.id === updated.id ? updated as unknown as LocalQuery : q));
      if (selectedQuery?.id === renameQueryId) {
        setSelectedQuery(updated as unknown as LocalQuery);
        setQueryName(updated.name);
      }
      setRenameModalOpen(false);
      setRenameQueryId(null);
      setRenameQueryName('');
    } catch (error: any) {
      message.error(error.response?.data?.message || '重命名失败');
    }
  };

  // Execute query
  const handleExecute = async () => {
    if (!dataSourceId) {
      message.error('请先选择数据源');
      return;
    }

    setExecuting(true);
    setShowResult(true);

    try {
      let res: QueryResult;

      // Check if NovaDB is selected
      if (dataSourceId === 'novadb' || dataSourceId === 'novadb-builtin') {
        // Use NovaDB API for SQL queries
        const sql = content.sql || '';
        const novadbResult = await novadbApi.executeSql(sql);
        res = {
          data: novadbResult.data.rows,
          rowsAffected: novadbResult.data.rowCount,
          executionTime: novadbResult.data.executionTime,
          error: novadbResult.data.error,
        };
      } else {
        // Use regular query API
        res = await queryApi.preview({
          appId,
          dataSourceId,
          type: queryType,
          content,
        });
      }
      setResult(res);
      // Save query result to queryStore for components to use
      if (selectedQuery && !res.error) {
        setQueryResult(selectedQuery.id, res);
      }
      // Auto-save content for display after panel collapse
      setSavedContent({ ...content });
      setSavedResult(res);
    } catch (error: any) {
      setResult({
        data: null,
        executionTime: 0,
        error: error.response?.data?.message || error.message || '执行失败',
      });
    } finally {
      setExecuting(false);
    }
  };

  // Save query (save content and result)
  const handleSave = async () => {
    if (!selectedQuery) {
      message.warning('请先创建或选择一个查询');
      return;
    }

    if (!dataSourceId) {
      message.warning('请选择数据源');
      return;
    }

    try {
      // Save content and result separately for persistence
      await queryApi.update(selectedQuery.id, {
        content,
        options,
        ...(result && !result.error ? { lastResult: result } : {}),
      });

      // Also save the result for display
      if (result && !result.error) {
        setSavedContent({ ...content });
        setSavedResult(result);
        // Save to queryStore for components
        setQueryResult(selectedQuery.id, result);
      }
      message.success('查询已保存');
      loadQueries();
    } catch (error: any) {
      message.error(error.response?.data?.message || '保存失败');
    }
  };

  // Clear query (clear content and result)
  const handleClear = () => {
    setContent(getDefaultContent(queryType));
    setResult(null);
    setSavedContent(null);
    setSavedResult(null);
    setShowResult(false);
  };

  // Load saved content and result when panel expands
  useEffect(() => {
    if (panelExpanded && selectedQuery && savedContent) {
      // Restore saved content to editor
      setContent(savedContent);
      // Restore saved result
      if (savedResult && !savedResult.error) {
        setResult(savedResult);
        setShowResult(true);
      }
    }
  }, [panelExpanded]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = panelHeight;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [panelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const newHeight = Math.max(150, Math.min(600, startHeight.current + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sql': return <DatabaseOutlined />;
      case 'javascript': return <CodeOutlined />;
      case 'visual': return <FileTextOutlined />;
      case 'rest': return <ApiOutlined />;
      default: return <CodeOutlined />;
    }
  };

  // SQL Editor
  const renderSqlEditor = () => (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
      <CodeMirror
        value={content.sql || ''}
        height="160px"
        extensions={[sql()]}
        theme={oneDark}
        onChange={(val) => setContent({ ...content, sql: val })}
        placeholder="SELECT * FROM users WHERE id = {{userId}}"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
      <div style={{ padding: '8px 12px', fontSize: 12, color: '#888', background: '#fafafa' }}>
        使用 {'{{variableName}}'} 语法引用参数
      </div>
    </div>
  );

  // JS Editor
  const renderJsEditor = () => (
    <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden' }}>
      <CodeMirror
        value={content.code || ''}
        height="160px"
        extensions={[javascript()]}
        theme={oneDark}
        onChange={(val) => setContent({ ...content, code: val })}
        placeholder="// 处理查询结果\nreturn data;"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );

  // Visual Editor
  const renderVisualEditor = () => {
    const tables = schema?.tables || [];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Select
            value={content.operation || 'select'}
            style={{ width: 100 }}
            onChange={(val) => setContent({ ...content, operation: val })}
            options={[
              { label: '读取', value: 'select' },
              { label: '插入', value: 'insert' },
              { label: '更新', value: 'update' },
              { label: '删除', value: 'delete' },
            ]}
          />
          <Select
            value={content.tableName || undefined}
            style={{ width: 160 }}
            placeholder="选择表"
            onChange={(val) => setContent({ ...content, tableName: val })}
            options={tables.map((t: any) => ({ label: t.name, value: t.name }))}
            allowClear
          />
        </div>
      </div>
    );
  };

  // REST Editor
  const renderRestEditor = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Select
          value={content.method || 'GET'}
          style={{ width: 100 }}
          onChange={(val) => setContent({ ...content, method: val })}
          options={[
            { label: 'GET', value: 'GET' },
            { label: 'POST', value: 'POST' },
            { label: 'PUT', value: 'PUT' },
            { label: 'DELETE', value: 'DELETE' },
          ]}
        />
        <Input
          placeholder="URL"
          value={content.url || ''}
          onChange={(e) => setContent({ ...content, url: e.target.value })}
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );

  // Result
  const renderResult = () => {
    if (!result) return null;

    if (result.error) {
      return (
        <div style={{ padding: 12, background: '#fff1f0', borderRadius: 4, marginTop: 8 }}>
          <div style={{ color: '#ff4d4f', fontWeight: 500 }}>执行失败</div>
          <div style={{ color: '#ff4d4f', marginTop: 4, fontSize: 12 }}>{result.error}</div>
        </div>
      );
    }

    const data = result.data;
    const isTableView = Array.isArray(data) && data.length > 0;

    const getColumns = () => {
      if (!data || data.length === 0) return [];
      return Object.keys(data[0]).map(key => ({
        title: key,
        dataIndex: key,
        key,
        width: 150,
        ellipsis: true,
        render: (val: any) => {
          if (val === null) return <span style={{ color: '#999' }}>null</span>;
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        }
      }));
    };

    return (
      <div style={{ marginTop: 8, padding: '0 8px', animation: 'slideUp 0.2s ease' }}>
        {/* Stats and toggle buttons in same row */}
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="large">
            <span style={{ fontSize: 12, color: '#888' }}>耗时: {result.executionTime}ms</span>
            {result.rowsAffected !== undefined && (
              <span style={{ fontSize: 12, color: '#888' }}>行数: {result.rowsAffected}</span>
            )}
          </Space>
          {isTableView && (
            <Space size="small">
              <Button
                size="small"
                type={resultViewMode === 'table' ? 'primary' : 'default'}
                onClick={() => setResultViewMode('table')}
              >
                表格
              </Button>
              <Button
                size="small"
                type={resultViewMode === 'json' ? 'primary' : 'default'}
                onClick={() => setResultViewMode('json')}
              >
                JSON
              </Button>
            </Space>
          )}
        </div>
        {isTableView ? (
          resultViewMode === 'table' ? (
            <div style={{ height: 300, overflow: 'auto', border: '1px solid #f0f0f0', borderRadius: 4 }}>
              <Table
                dataSource={data}
                columns={getColumns()}
                size="small"
                pagination={false}
                scroll={{ x: 'max-content', y: 280 }}
                rowKey={(record: any) => record.id || Math.random().toString(36).substr(2, 9)}
                style={{ overflow: 'auto' }}
              />
            </div>
          ) : (
            <pre style={{ background: '#f5f5f5', padding: 12, overflow: 'auto', fontSize: 12, maxHeight: 300, borderRadius: 4 }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )
        ) : (
          <pre style={{ background: '#f5f5f5', padding: 12, overflow: 'auto', fontSize: 12, maxHeight: 300, borderRadius: 4 }}>
            {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    );
  };

  // Query list
  const renderQueryList = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 600, fontSize: 12 }}>查询列表</span>
        <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => setNewQueryModal(true)} />
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: 16, textAlign: 'center' }}><Spin size="small" /></div>
        ) : queries.length === 0 ? (
          <div style={{ padding: 16, color: '#888', fontSize: 12, textAlign: 'center' }}>暂无查询</div>
        ) : (
          queries.map(query => {
            const menuItems = {
              items: [
                { key: 'rename', icon: <EditOutlined />, label: '重命名', onClick: () => handleOpenRename(query) },
                { key: 'copy', icon: <CopyOutlined />, label: '复制', onClick: () => handleCopyQuery(query) },
                { type: 'divider' as const },
                { key: 'delete', icon: <DeleteOutlined />, label: '删除', danger: true, onClick: () => handleDeleteQuery(query.id) },
              ],
            };
            return (
              <Dropdown key={query.id} menu={menuItems} trigger={['contextMenu']}>
                <div
                  onClick={() => handleSelectQuery(query)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    background: selectedQuery?.id === query.id ? '#e6f7ff' : 'transparent',
                    borderLeft: selectedQuery?.id === query.id ? '3px solid #1677ff' : '3px solid transparent',
                    borderBottom: '1px solid #f5f5f5',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'background 0.2s',
                  }}
                >
                  {getTypeIcon(query.type)}
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{query.name}</span>
                </div>
              </Dropdown>
            );
          })
        )}
      </div>
    </div>
  );

  // Editor
  const renderEditor = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Toolbar */}
      <div
        style={{
          height: 40,
          padding: '0 12px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {/* Left: Query name + Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {/* Query name area - fixed width to prevent jumping */}
          <div style={{ width: 160, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {selectedQuery ? (
              isEditingName ? (
                <Input
                  ref={nameInputRef}
                  value={editingNameValue}
                  onChange={(e) => setEditingNameValue(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={saveEditingName}
                  size="small"
                  style={{ width: 150 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div
                  onClick={startEditingName}
                  className="query-name-editable"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 4,
                    width: '100%',
                  }}
                >
                  <Typography.Text strong style={{ fontSize: 14 }}>
                    {queryName}
                  </Typography.Text>
                  <EditOutlined className="edit-icon" style={{ fontSize: 10, color: '#999' }} />
                </div>
              )
            ) : (
              <Typography.Text style={{ fontSize: 14, color: '#999' }}>新查询</Typography.Text>
            )}
          </div>

          {/* Query type tabs - left aligned with 24px gap */}
          <Tabs
            className="query-panel-tabs"
            size="small"
            activeKey={activeTab}
            onChange={(key) => handleTypeChange(key as QueryType)}
            items={[
              { key: 'sql', label: 'SQL' },
              { key: 'javascript', label: 'JavaScript' },
              { key: 'visual', label: '可视化' },
              { key: 'rest', label: 'REST API' },
            ]}
            style={{ marginLeft: 24 }}
            tabBarStyle={{ marginBottom: 0 }}
          />
        </div>

        {/* Right: Run and Settings buttons */}
        <Space size="small">
          <Button
            size="small"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!selectedQuery}
          >
            保存
          </Button>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClear}
            disabled={!savedContent && !result}
          >
            清空
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={handleExecute}
            loading={executing}
          >
            运行
          </Button>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setShowSettings(!showSettings)}
          />
        </Space>
      </div>

      {/* Editor content area */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {activeTab === 'sql' && renderSqlEditor()}
        {activeTab === 'javascript' && renderJsEditor()}
        {activeTab === 'visual' && renderVisualEditor()}
        {activeTab === 'rest' && renderRestEditor()}
      </div>

      {/* Result */}
      {showResult && (
        <div style={{ borderTop: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column' }}>
          <div
            onClick={() => setResultExpanded(!resultExpanded)}
            style={{
              padding: '8px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: '#fafafa',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 12 }}>
              {resultExpanded ? '▼' : '▶'} 执行结果
            </span>
          </div>
          {resultExpanded && (
            <div style={{ maxHeight: 250, overflow: 'auto' }}>
              {executing ? (
                <div style={{ textAlign: 'center', padding: 16 }}><Spin>执行中...</Spin></div>
              ) : (
                renderResult()
              )}
            </div>
          )}
        </div>
      )}

      {/* Settings */}
      {showSettings && (
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 280, background: '#fff', borderLeft: '1px solid #e8e8e8', padding: 16, zIndex: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>查询设置</div>
          <Checkbox checked={options.runOnPageLoad} onChange={(e) => setOptions({ ...options, runOnPageLoad: e.target.checked })}>页面加载时运行</Checkbox>
          <div style={{ marginTop: 16 }}>
            <div style={{ marginBottom: 4 }}>超时时间 (ms)</div>
            <Input.Search value={options.timeout || 30000} onChange={(val) => setOptions({ ...options, timeout: val })} style={{ width: '100%' }} />
          </div>
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => setShowSettings(false)}>完成</Button>
        </div>
      )}
    </div>
  );

  // Collapsed header
  const renderCollapsedHeader = () => (
    <div
      onClick={() => setPanelExpanded(true)}
      style={{
        height: 32,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 500 }}><DatabaseOutlined /> 查询面板</span>
      <CaretUpOutlined style={{ color: '#888' }} />
    </div>
  );

  // Expanded panel
  const renderExpandedPanel = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          height: 4,
          background: '#f5f5f5',
          cursor: 'ns-resize',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', width: 40, height: 12, background: '#f5f5f5', borderRadius: 6 }} />
      </div>
      {/* Header */}
      <div
        style={{
          height: 32,
          background: '#fff',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500 }}><DatabaseOutlined /> 查询面板</span>
        <CaretDownOutlined style={{ color: '#888', cursor: 'pointer' }} onClick={() => { setPanelExpanded(false); setShowResult(false); }} />
      </div>
      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: 160, borderRight: '1px solid #e8e8e8', overflow: 'hidden' }}>{renderQueryList()}</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>{selectedQuery || dataSourceId ? renderEditor() : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>选择或创建查询</div>}</div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width: '100%',
        height: panelExpanded ? panelHeight : 32,
        transition: 'height 0.2s ease',
        overflow: 'hidden',
        borderTop: '1px solid #e8e8e8',
      }}
    >
      {panelExpanded ? renderExpandedPanel() : renderCollapsedHeader()}

      {/* New Query Modal */}
      <Modal title="新建查询" open={newQueryModal} onOk={handleCreateQuery} onCancel={() => setNewQueryModal(false)} okText="创建">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>查询名称</div>
            <Input value={newQueryName} onChange={(e) => setNewQueryName(e.target.value)} placeholder="输入查询名称" />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>查询类型</div>
            <Select value={newQueryType} onChange={setNewQueryType} style={{ width: '100%' }} options={[
              { label: 'SQL', value: 'sql' },
              { label: 'JavaScript', value: 'javascript' },
              { label: '可视化', value: 'visual' },
              { label: 'REST API', value: 'rest' },
            ]} />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>数据源</div>
            <Select
              value={newQueryDataSourceId}
              onChange={setNewQueryDataSourceId}
              style={{ width: '100%' }}
              placeholder="选择数据源"
              options={dataSources.map(ds => ({
                label: (
                  <span>
                    {ds.type === 'novadb' && <span style={{ color: '#1677ff', marginRight: 4 }}>★</span>}
                    {ds.name}
                    {ds.type === 'novadb' && <span style={{ color: '#999', fontSize: 10, marginLeft: 4 }}>内置</span>}
                  </span>
                ),
                value: ds.id,
              }))}
            />
          </div>
        </div>
      </Modal>

      {/* Rename Modal */}
      <Modal
        title="重命名查询"
        open={renameModalOpen}
        onOk={handleRename}
        onCancel={() => {
          setRenameModalOpen(false);
          setRenameQueryId(null);
          setRenameQueryName('');
        }}
        okText="确定"
      >
        <Input
          placeholder="输入新名称"
          value={renameQueryName}
          onChange={(e) => setRenameQueryName(e.target.value)}
          onPressEnter={handleRename}
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default QueryPanelWrapper;
