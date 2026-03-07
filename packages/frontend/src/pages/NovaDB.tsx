import { useState, useEffect, useCallback, useRef } from 'react';
import dayjs from 'dayjs';
import {
  Layout,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Switch,
  Space,
  Typography,
  message,
  Dropdown,
  InputNumber,
  Pagination,
  DatePicker,
  Alert,
  Checkbox,
  Tooltip,
  Popover,
  Upload,
  Tabs,
  Drawer,
} from 'antd';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  MoreOutlined,
  EditOutlined,
  DownloadOutlined,
  UploadOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { novadbApi, NovaTable, NovaColumn } from '../api/novadb';
import { useAuthStore } from '../stores/authStore';

const { Sider, Content } = Layout;
const { Text } = Typography;

const NovaDBPage = () => {
  const { user } = useAuthStore();
  const [tables, setTables] = useState<NovaTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<NovaTable | null>(null);
  const [columns, setColumns] = useState<NovaColumn[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterPopoverVisible, setFilterPopoverVisible] = useState(false);
  const [sortPopoverVisible, setSortPopoverVisible] = useState(false);

  // Sort state
  const [sorts, setSorts] = useState<Array<{
    id: string;
    column: string;
    order: 'asc' | 'desc';
  }>>([]);

  // Filter state
  const [filters, setFilters] = useState<Array<{
    id: string;
    column: string;
    operator: string;
    value: any;
  }>>([]);

  // Filter panel ref
  const filterContentRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [createTableModalOpen, setCreateTableModalOpen] = useState(false);
  const [createTableName, setCreateTableName] = useState('');
  const [addColumnModalOpen, setAddColumnModalOpen] = useState(false);
  const [createRowModalOpen, setCreateRowModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importParseResult, setImportParseResult] = useState<{ success: boolean; rowCount?: number; error?: string } | null>(null);
  const [editRowModalOpen, setEditRowModalOpen] = useState(false);
  const [editRowData, setEditRowData] = useState<any>(null);
  const [editTableModalOpen, setEditTableModalOpen] = useState(false);
  const [editTableName, setEditTableName] = useState('');
  const [editColumns, setEditColumns] = useState<any[]>([]);
  const [sqlContent, setSqlContent] = useState('');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlDrawerOpen, setSqlDrawerOpen] = useState(false);
  const [sqlEditorHeightRatio, setSqlEditorHeightRatio] = useState(50); // percentage
  const [sqlResultView, setSqlResultView] = useState<'table' | 'json'>('table');

  // Editing cell state
  const [editingKey, setEditingKey] = useState<string>('');
  const [editingField, setEditingField] = useState<string>('');
  const [editingValue, setEditingValue] = useState<any>(null);

  const [form] = Form.useForm();

  // Load tables
  const loadTables = useCallback(async () => {
    try {
      const res = await novadbApi.getTables();
      setTables(res.data);
    } catch (error) {
      message.error('加载表列表失败');
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Load table data when selected table changes
  useEffect(() => {
    if (selectedTable) {
      loadColumns();
      loadRows();
    } else {
      setColumns([]);
      setRows([]);
    }
  }, [selectedTable]);

  // Load rows when pagination/search/sort/filter changes
  useEffect(() => {
    if (selectedTable) {
      loadRows();
    }
  }, [page, pageSize, search, sortBy, sortOrder, filters, sorts]);

  // Load columns
  const loadColumns = async () => {
    if (!selectedTable) return;
    try {
      const res = await novadbApi.getColumns(selectedTable.id);
      setColumns(res.data);
    } catch (error) {
      message.error('加载列失败');
    }
  };

  // Load rows
  const loadRows = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      // Convert filters to JSON string
      const filtersParam = filters.length > 0 ? JSON.stringify(filters) : undefined;
      // Convert sorts to JSON string
      const sortsParam = sorts.length > 0 ? JSON.stringify(sorts) : undefined;
      const res = await novadbApi.queryRows(selectedTable.id, {
        search,
        sortBy,
        sortOrder,
        page,
        pageSize,
        filters: filtersParam,
        sorts: sortsParam,
      });
      setRows(res.data.rows);
      setTotal(res.data.total);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // Get operators based on column type
  const getOperatorsByType = (type: string, columnName?: string) => {
    // id column is a number type
    if (columnName === 'id' || type === 'number') {
      return [
        { value: 'eq', label: '等于' },
        { value: 'neq', label: '不等于' },
        { value: 'gt', label: '大于' },
        { value: 'lt', label: '小于' },
        { value: 'gte', label: '大于等于' },
        { value: 'lte', label: '小于等于' },
        { value: 'is_empty', label: '为空' },
        { value: 'is_not_empty', label: '不为空' },
      ];
    }
    switch (type) {
      case 'text':
        return [
          { value: 'eq', label: '等于' },
          { value: 'neq', label: '不等于' },
          { value: 'contains', label: '包含' },
          { value: 'not_contains', label: '不包含' },
          { value: 'is_empty', label: '为空' },
          { value: 'is_not_empty', label: '不为空' },
        ];
      case 'boolean':
        return [
          { value: 'eq', label: '等于 true' },
        ];
      case 'datetime':
        return [
          { value: 'eq', label: '等于' },
          { value: 'before', label: '早于' },
          { value: 'after', label: '晚于' },
          { value: 'is_empty', label: '为空' },
          { value: 'is_not_empty', label: '不为空' },
        ];
      default:
        return [{ value: 'eq', label: '等于' }];
    }
  };

  // Add new filter
  const handleAddFilter = () => {
    const newFilter = {
      id: Date.now().toString(),
      column: columns[0]?.name || '',
      operator: 'eq',
      value: '',
    };
    setFilters([...filters, newFilter]);
  };

  // Remove filter
  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  // Update filter
  const handleFilterChange = (id: string, field: string, value: any) => {
    setFilters(filters.map(f => {
      if (f.id === id) {
        // Reset operator and value when column changes
        if (field === 'column') {
          const col = columns.find(c => c.name === value);
          const operators = getOperatorsByType(col?.type || 'text', value);
          return { ...f, [field]: value, operator: operators[0].value, value: '' };
        }
        return { ...f, [field]: value };
      }
      return f;
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPage(1);
    loadRows();
    setFilterPopoverVisible(false);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters([]);
    setPage(1);
    loadRows();
  };

  // Add new sort
  const handleAddSort = () => {
    const newSort = {
      id: Date.now().toString(),
      column: columns[0]?.name || '',
      order: 'asc' as const,
    };
    setSorts([...sorts, newSort]);
  };

  // Remove sort
  const handleRemoveSort = (id: string) => {
    setSorts(sorts.filter(s => s.id !== id));
  };

  // Update sort
  const handleSortChange = (id: string, field: string, value: any) => {
    setSorts(sorts.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // Apply sorts
  const handleApplySorts = () => {
    setPage(1);
    loadRows();
    setSortPopoverVisible(false);
  };

  // Clear all sorts
  const handleClearSorts = () => {
    setSorts([]);
    setPage(1);
    loadRows();
  };

  // Create table
  const handleCreateTable = async () => {
    if (!createTableName.trim()) {
      message.error('请输入表名');
      return;
    }
    try {
      await novadbApi.createTable(createTableName.trim(), user?.id || '');
      message.success('表创建成功');
      setCreateTableModalOpen(false);
      setCreateTableName('');
      loadTables();
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.error('表名已存在，请使用其他名称');
      } else {
        message.error('创建表失败');
      }
    }
  };

  // Delete table
  const handleDeleteTable = async (tableId: string) => {
    try {
      await novadbApi.deleteTable(tableId);
      message.success('表删除成功');
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
      loadTables();
    } catch (error) {
      message.error('删除表失败');
    }
  };

  // Export schema as JSON
  const handleExportSchema = (table: NovaTable) => {
    const tableColumns = columns.filter(c => c.tableId === table.id);
    const schema = {
      tableName: table.name,
      columns: tableColumns.map(col => ({
        name: col.name,
        type: col.type,
        defaultValue: col.defaultValue,
        isNullable: col.isNullable,
        columnOrder: col.columnOrder,
      })),
    };
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Schema 导出成功');
  };

  // Open edit table modal
  const handleOpenEditTableModal = () => {
    if (!selectedTable) return;
    setEditTableName(selectedTable.name);
    setEditColumns(columns.map(col => ({ ...col, key: col.id })));
    setEditTableModalOpen(true);
  };

  // Add column in edit modal
  const handleAddColumnInEdit = () => {
    setEditColumns([
      ...editColumns,
      {
        key: `new_${Date.now()}`,
        id: undefined,
        name: '',
        type: 'text' as const,
        isNullable: true,
        defaultValue: null,
        columnOrder: editColumns.length,
      },
    ]);
  };

  // Remove column in edit modal
  const handleRemoveColumnInEdit = (key: string) => {
    setEditColumns(editColumns.filter(col => col.key !== key));
  };

  // Save table edits
  const handleSaveTableEdits = async () => {
    if (!selectedTable) return;
    try {
      // Update table name if changed
      if (editTableName !== selectedTable.name) {
        await novadbApi.updateTable(selectedTable.id, editTableName);
      }

      // Update columns
      for (const col of editColumns) {
        if (col.id) {
          // Update existing column
          await novadbApi.updateColumn(selectedTable.id, col.id, {
            name: col.name,
            type: col.type,
            isNullable: col.isNullable,
            defaultValue: col.defaultValue,
          });
        } else {
          // Add new column
          await novadbApi.addColumn(selectedTable.id, {
            name: col.name,
            type: col.type,
            isNullable: col.isNullable,
            defaultValue: col.defaultValue,
          });
        }
      }
      message.success('表结构更新成功');
      setEditTableModalOpen(false);
      loadTables();
      loadColumns();
    } catch (error: any) {
      if (error.response?.status === 409) {
        message.error('表名已存在，请使用其他名称');
      } else {
        message.error('保存失败');
      }
    }
  };

  // Add column
  const handleAddColumn = async () => {
    if (!selectedTable) return;
    try {
      const values = await form.validateFields();
      await novadbApi.addColumn(selectedTable.id, {
        name: values.name,
        type: values.type,
        isNullable: values.isNullable,
        defaultValue: values.defaultValue,
      });
      message.success('列添加成功');
      setAddColumnModalOpen(false);
      form.resetFields();
      loadColumns();
    } catch (error) {
      message.error('添加列失败');
    }
  };

  // Create row
  const handleOpenCreateRowModal = () => {
    if (!selectedTable) return;
    form.resetFields();
    const initialValues: Record<string, any> = {};
    columns.forEach((col) => {
      if (col.defaultValue) {
        initialValues[col.name] = col.defaultValue;
      } else if (col.type === 'boolean') {
        initialValues[col.name] = false;
      } else if (col.type === 'number') {
        initialValues[col.name] = undefined;
      } else {
        initialValues[col.name] = undefined;
      }
    });
    form.setFieldsValue(initialValues);
    setCreateRowModalOpen(true);
  };

  // Submit create row
  const handleSubmitCreateRow = async () => {
    if (!selectedTable) return;
    try {
      const values = await form.validateFields();
      await novadbApi.createRow(selectedTable.id, values);
      message.success('数据添加成功');
      setCreateRowModalOpen(false);
      loadRows();
    } catch (error) {
      message.error('添加失败');
    }
  };

  // Delete selected rows
  const handleDeleteRows = async () => {
    if (!selectedTable || selectedRowKeys.length === 0) return;
    try {
      await novadbApi.deleteRows(selectedTable.id, selectedRowKeys);
      message.success('删除成功');
      setSelectedRowKeys([]);
      loadRows();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // Update cell
  const handleCellSave = async (row: any, field: string) => {
    if (!selectedTable) return;
    try {
      await novadbApi.updateRow(selectedTable.id, row.id, { [field]: editingValue });
      message.success('保存成功');
      setEditingKey('');
      setEditingField('');
      loadRows();
    } catch (error) {
      message.error('保存失败');
    }
  };

  // Execute SQL
  const handleExecuteSql = async () => {
    if (!sqlContent.trim()) return;
    setSqlLoading(true);
    try {
      const res = await novadbApi.executeSql(sqlContent);
      const data = res.data;

      // Check if there's an error in the response
      if (data.error) {
        setSqlResult({ ...data, rows: [], columns: [] });
        message.error(data.error);
      } else {
        setSqlResult(data);
        message.success('SQL 执行成功');
        if (selectedTable && sqlContent.toLowerCase().includes('select')) {
          loadRows();
        }
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'SQL 执行失败');
      setSqlResult(null);
    } finally {
      setSqlLoading(false);
    }
  };

  // Table context menu
  const getTableMenuItems = (table: NovaTable): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑表',
      onClick: () => {
        setSelectedTable(table);
        handleOpenEditTableModal();
      },
    },
    {
      key: 'addCol',
      icon: <PlusOutlined />,
      label: '添加列',
      onClick: () => {
        setSelectedTable(table);
        setAddColumnModalOpen(true);
      },
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: '导出 Schema',
      onClick: () => handleExportSchema(table),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: <span style={{ color: '#ff4d4f' }}>删除表</span>,
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: '确认删除',
          content: `确定删除表 "${table.name}" 吗？删除后无法恢复。`,
          okText: '确定删除',
          okButtonProps: { danger: true },
          onOk: () => handleDeleteTable(table.id),
        });
      },
    },
  ];

  // Column context menu for edit modal
  const getEditColumnMenuItems = (key: string): MenuProps['items'] => [
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: <span style={{ color: '#ff4d4f' }}>删除</span>,
      danger: true,
      onClick: () => handleRemoveColumnInEdit(key),
    },
  ];

  // Render editable cell
  const renderEditableCell = (record: any, column: NovaColumn) => {
    const editable = editingKey === record.id && editingField === column.name;
    const value = record[column.name];

    if (editable) {
      if (column.type === 'number') {
        return (
          <InputNumber
            value={editingValue}
            onChange={(v) => setEditingValue(v)}
            onPressEnter={() => handleCellSave(record, column.name)}
            onBlur={() => handleCellSave(record, column.name)}
            autoFocus
            size="small"
            style={{ width: '100%' }}
          />
        );
      } else if (column.type === 'boolean') {
        return (
          <Switch
            checked={editingValue}
            onChange={(v) => {
              setEditingValue(v);
              handleCellSave(record, column.name);
            }}
            size="small"
          />
        );
      } else {
        return (
          <Input
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onPressEnter={() => handleCellSave(record, column.name)}
            onBlur={() => handleCellSave(record, column.name)}
            autoFocus
            size="small"
          />
        );
      }
    }

    if (column.type === 'boolean') {
      return <Switch checked={value} disabled size="small" />;
    }
    return <span>{value ?? '-'}</span>;
  };

  // Get columns for Table
  const tableColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      ellipsis: true,
    },
    ...columns.map((col) => ({
      title: col.name,
      dataIndex: col.name,
      key: col.name,
      width: 150,
      ellipsis: true,
      sorter: true,
      render: (value: any, record: any) => (
        <Tooltip title={value !== null && value !== undefined ? String(value) : ''}>
          <div
            onDoubleClick={() => {
              setEditingKey(record.id);
              setEditingField(col.name);
              setEditingValue(record[col.name]);
            }}
            style={{ cursor: 'text', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {renderEditableCell(record, col)}
          </div>
        </Tooltip>
      ),
    })),
  ];

  return (
    <Layout style={{ minHeight: 'calc(100vh - 112px)', background: '#fff' }}>
      {/* Left sidebar - Table list */}
      <Sider
        width={220}
        style={{
          background: '#fafafa',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong>数据表</Text>
          </div>
          <Input
            placeholder="搜索表..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            style={{ borderRadius: 6 }}
            allowClear
          />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {tables.map((table) => (
            <div
              key={table.id}
              onClick={() => setSelectedTable(table)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: selectedTable?.id === table.id ? '#e6f4ff' : 'transparent',
                borderLeft: selectedTable?.id === table.id ? '3px solid #1677ff' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {table.name}
              </span>
              <Dropdown
                menu={{ items: getTableMenuItems(table) }}
                trigger={['click']}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreOutlined />}
                  onClick={(e) => e.stopPropagation()}
                  style={{ padding: '4px 8px' }}
                />
              </Dropdown>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => setCreateTableModalOpen(true)}
          >
            新建表
          </Button>
        </div>
      </Sider>

      {/* Main content */}
      <Content style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {selectedTable ? (
          <>
            {/* Header with table name and toolbar */}
            <div
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: filters.length > 0 ? 12 : 0 }}>
                {/* Dynamic toolbar based on selection */}
                {selectedRowKeys.length === 0 && (
                  <Space>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: 'add-row',
                            icon: <PlusOutlined />,
                            label: '添加一行',
                            onClick: handleOpenCreateRowModal,
                          },
                          {
                            key: 'import',
                            icon: <UploadOutlined />,
                            label: '批量导入',
                            onClick: () => {
                              if (!selectedTable) return;
                              setImportModalOpen(true);
                            },
                          },
                        ],
                      }}
                      trigger={['click']}
                    >
                      <Button type="primary" icon={<PlusOutlined />}>
                        添加数据
                      </Button>
                    </Dropdown>
                    <Popover
                      content={
                        <div style={{ width: 560 }} ref={filterContentRef}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontWeight: 600 }}>筛选条件</span>
                            {filters.length > 0 && (
                              <a onClick={handleClearFilters} style={{ fontSize: 12 }}>清除所有条件</a>
                            )}
                          </div>
                          {filters.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
                              暂无筛选条件，点击下方按钮添加
                            </div>
                          ) : (
                            filters.map((filter) => {
                              const col = columns.find(c => c.name === filter.column);
                              const operators = getOperatorsByType(col?.type || 'text', filter.column);
                              const isEmptyOperator = filter.operator === 'is_empty' || filter.operator === 'is_not_empty';

                              return (
                                <div key={filter.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                  <Select
                                    style={{ width: 160 }}
                                    value={filter.column}
                                    onChange={(value) => handleFilterChange(filter.id, 'column', value)}
                                    placeholder="选择列..."
                                    options={[{ value: 'id', label: 'id' }, ...columns.map(c => ({ value: c.name, label: c.name }))]}
                                  />
                                  <Select
                                    style={{ width: 120 }}
                                    value={filter.operator}
                                    onChange={(value) => handleFilterChange(filter.id, 'operator', value)}
                                    options={operators}
                                  />
                                  {!isEmptyOperator && (
                                    col?.type === 'datetime' ? (
                                      <DatePicker
                                        style={{ flex: 1 }}
                                        value={filter.value ? dayjs(filter.value) : null}
                                        onChange={(date) => handleFilterChange(filter.id, 'value', date ? date.format('YYYY-MM-DD HH:mm:ss') : '')}
                                        placeholder="选择日期..."
                                        showTime
                                      />
                                    ) : col?.type === 'boolean' ? (
                                      <Switch
                                        checked={filter.value}
                                        onChange={(checked) => handleFilterChange(filter.id, 'value', checked)}
                                      />
                                    ) : (
                                      <Input
                                        style={{ flex: 1 }}
                                        value={filter.value}
                                        onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value)}
                                        placeholder="输入值"
                                      />
                                    )
                                  )}
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleRemoveFilter(filter.id)}
                                  />
                                </div>
                              );
                            })
                          )}
                          <div style={{ marginTop: 12 }}>
                            <Button type="link" icon={<PlusOutlined />} onClick={handleAddFilter} style={{ padding: 0 }}>
                              添加筛选条件
                            </Button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                            <Button onClick={() => { setFilterPopoverVisible(false); setFilters([]); }}>取消</Button>
                            <Button type="primary" onClick={handleApplyFilters}>应用</Button>
                          </div>
                        </div>
                      }
                      title={null}
                      trigger="click"
                      open={filterPopoverVisible}
                      onOpenChange={setFilterPopoverVisible}
                      placement="bottomLeft"
                      overlayStyle={{ padding: 0 }}
                    >
                      {filters.length > 0 || filterPopoverVisible ? (
                        <Button
                          style={{
                            background: '#e6f4ff',
                            color: '#1677ff',
                            borderColor: '#1677ff',
                          }}
                        >
                          <FilterOutlined />
                          <span>{filters.length > 0 ? `${filters.length}个筛选` : '筛选'}</span>
                          {filters.length > 0 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearFilters();
                              }}
                              style={{
                                marginLeft: 8,
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: 10,
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#bae0ff')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              ✕
                            </span>
                          )}
                        </Button>
                      ) : (
                        <Button icon={<FilterOutlined />}>
                          筛选
                        </Button>
                      )}
                    </Popover>
                    <Popover
                      content={
                        <div style={{ width: 480 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ fontWeight: 600 }}>排序条件</span>
                            {sorts.length > 0 && (
                              <a onClick={handleClearSorts} style={{ fontSize: 12 }}>清除所有排序</a>
                            )}
                          </div>
                          {sorts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
                              暂无排序条件，点击下方按钮添加
                            </div>
                          ) : (
                            sorts.map((sort, idx) => (
                              <div key={sort.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ width: 70, color: '#8c8c8c', fontSize: 12 }}>
                                  {idx === 0 ? '排序依据' : '然后按'}
                                </span>
                                <Select
                                  style={{ width: 180 }}
                                  value={sort.column}
                                  onChange={(value) => handleSortChange(sort.id, 'column', value)}
                                  placeholder="选择列..."
                                  options={[{ value: 'id', label: 'id' }, ...columns.map(c => ({ value: c.name, label: c.name }))]}
                                />
                                <Select
                                  style={{ width: 120 }}
                                  value={sort.order}
                                  onChange={(value) => handleSortChange(sort.id, 'order', value)}
                                  options={[
                                    { value: 'asc', label: '升序' },
                                    { value: 'desc', label: '降序' },
                                  ]}
                                />
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleRemoveSort(sort.id)}
                                />
                              </div>
                            ))
                          )}
                          <div style={{ marginTop: 12 }}>
                            <Button type="link" icon={<PlusOutlined />} onClick={handleAddSort} style={{ padding: 0 }}>
                              添加排序条件
                            </Button>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                            <Button onClick={() => { setSortPopoverVisible(false); setSorts([]); }}>取消</Button>
                            <Button type="primary" onClick={handleApplySorts}>应用</Button>
                          </div>
                        </div>
                      }
                      title={null}
                      trigger="click"
                      open={sortPopoverVisible}
                      onOpenChange={setSortPopoverVisible}
                      placement="bottomLeft"
                      overlayStyle={{ padding: 0 }}
                    >
                      {sorts.length > 0 || sortPopoverVisible ? (
                        <Button
                          style={{
                            background: '#f6ffed',
                            color: '#52c41a',
                            borderColor: '#52c41a',
                          }}
                        >
                          <SortAscendingOutlined />
                          <span>{sorts.length > 0 ? `${sorts.length}个排序` : '排序'}</span>
                          {sorts.length > 0 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearSorts();
                              }}
                              style={{
                                marginLeft: 8,
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: 10,
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = '#d9f7be')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              ✕
                            </span>
                          )}
                        </Button>
                      ) : (
                        <Button icon={<SortAscendingOutlined />}>
                          排序
                        </Button>
                      )}
                    </Popover>
                    <Button
                      icon={<CodeOutlined />}
                      style={sqlDrawerOpen ? {
                        background: '#e6f4ff',
                        borderColor: '#1890ff',
                        color: '#1890ff',
                      } : undefined}
                      onClick={() => setSqlDrawerOpen(!sqlDrawerOpen)}
                    >
                      SQL 编辑器
                    </Button>
                  </Space>
                )}
                {selectedRowKeys.length === 1 && (
                  <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                      const row = rows.find(r => r.id === selectedRowKeys[0]);
                      if (row) {
                        setEditRowData(row);
                        form.setFieldsValue(row);
                        setEditRowModalOpen(true);
                      }
                    }}>
                      编辑
                    </Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => {
                      Modal.confirm({
                        title: '确认删除',
                        content: `确定要删除选中的 ${selectedRowKeys.length} 行吗？`,
                        onOk: handleDeleteRows,
                      });
                    }}>
                      删除选中 ({selectedRowKeys.length})
                    </Button>
                  </Space>
                )}
                {selectedRowKeys.length > 1 && (
                  <Space>
                    <Button danger icon={<DeleteOutlined />} onClick={() => {
                      Modal.confirm({
                        title: '确认删除',
                        content: `确定要删除选中的 ${selectedRowKeys.length} 行吗？`,
                        onOk: handleDeleteRows,
                      });
                    }}>
                      删除选中 ({selectedRowKeys.length})
                    </Button>
                  </Space>
                )}
                <Text type="secondary">
                  {selectedRowKeys.length > 0 ? `已选中 ${selectedRowKeys.length} 条` : `共 ${total} 条记录`}
                </Text>
              </div>
              {/* Search bar - always visible */}
              <div style={{ marginTop: 12 }}>
                <Input.Search
                  placeholder="搜索数据..."
                  allowClear
                  style={{ width: 300 }}
                  onSearch={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Table */}
            <div style={{ flex: 1, padding: '16px 24px', overflow: 'auto' }}>
              <Table
                dataSource={rows}
                columns={tableColumns}
                loading={loading}
                rowKey="id"
                bordered
                pagination={false}
                rowSelection={{
                  selectedRowKeys,
                  onChange: (keys) => setSelectedRowKeys(keys as string[]),
                }}
                onChange={(_pagination, _filters, sorter: any) => {
                  if (sorter.field) {
                    setSortBy(sorter.field);
                    setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
                  }
                }}
              />
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '12px 24px',
                borderTop: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                onChange={(p, ps) => {
                  setPage(p);
                  setPageSize(ps);
                }}
                showSizeChanger
                showTotal={(t) => `共 ${t} 条`}
              />
            </div>

            {/* SQL Editor Drawer */}
            <Drawer
              title="SQL 编辑器"
              placement="right"
              width={520}
              open={sqlDrawerOpen}
              onClose={() => setSqlDrawerOpen(false)}
              closable={true}
            >
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Editor Section */}
                <div style={{ height: `${sqlEditorHeightRatio}%`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1, overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: 4 }}>
                    <CodeMirror
                      value={sqlContent}
                      height="100%"
                      extensions={[sql()]}
                      onChange={(value) => setSqlContent(value)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.ctrlKey && e.key === 'Enter') {
                          handleExecuteSql();
                        }
                      }}
                      style={{ height: '100%' }}
                      placeholder={`SELECT * FROM novadb.ud_${selectedTable?.name?.toLowerCase() || 'xxx'}`}
                    />
                  </div>
                  <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Button type="primary" loading={sqlLoading} onClick={handleExecuteSql}>
                        ▶ 运行
                      </Button>
                      <Button onClick={() => setSqlContent('')}>清空</Button>
                    </Space>
                  </div>
                </div>

                {/* Resize Handle */}
                <div
                  style={{
                    height: 8,
                    cursor: 'row-resize',
                    background: '#f0f0f0',
                    borderRadius: 4,
                    margin: '4px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const startY = e.clientY;
                    const startRatio = sqlEditorHeightRatio;
                    const containerHeight = window.innerHeight * 0.8; // approximate drawer height
                    const handleMouseMove = (moveEvent: MouseEvent) => {
                      const deltaY = startY - moveEvent.clientY;
                      const deltaRatio = (deltaY / containerHeight) * 100;
                      const newRatio = Math.min(80, Math.max(20, startRatio + deltaRatio));
                      setSqlEditorHeightRatio(newRatio);
                    };
                    const handleMouseUp = () => {
                      document.removeEventListener('mousemove', handleMouseMove);
                      document.removeEventListener('mouseup', handleMouseUp);
                    };
                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                  }}
                >
                  <div style={{ width: 40, height: 4, background: '#ccc', borderRadius: 2 }} />
                </div>

                {/* Results Section */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div style={{ paddingBottom: 8, fontWeight: 600 }}>执行结果</div>
                  {!sqlResult ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c', border: '1px dashed #d9d9d9', borderRadius: 4 }}>
                      运行 SQL 查询后在此查看结果
                    </div>
                  ) : sqlResult.error ? (
                    <Alert
                      type="error"
                      message={sqlResult.error}
                      showIcon
                    />
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Tabs
                          activeKey={sqlResultView}
                          onChange={(key) => setSqlResultView(key as 'table' | 'json')}
                          items={[
                            { key: 'table', label: '表格' },
                            { key: 'json', label: 'JSON' },
                          ]}
                          size="small"
                        />
                        <span style={{ color: '#8c8c8c', fontSize: 12 }}>
                          耗时: {sqlResult.executionTime}ms | 行数: {sqlResult.rowCount}
                        </span>
                      </div>
                      <div style={{ flex: 1, overflow: 'auto' }}>
                        {sqlResultView === 'table' ? (
                          sqlResult.rows.length > 0 ? (
                            <Table
                              dataSource={sqlResult.rows}
                              columns={sqlResult.columns.map((col: string) => ({
                                title: col,
                                dataIndex: col,
                                key: col,
                                ellipsis: true,
                                render: (val: any) => val === null ? <span style={{ color: '#ccc' }}>NULL</span> : String(val),
                              }))}
                              size="small"
                              pagination={{ pageSize: 10 }}
                              scroll={{ x: true }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center', padding: 24, color: '#8c8c8c' }}>查询返回 0 行</div>
                          )
                        ) : (
                          <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(sqlResult.rows, null, 2)}
                          </pre>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Drawer>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
            }}
          >
            请选择或创建一个表
          </div>
        )}
      </Content>

      {/* Create Table Modal */}
      <Modal
        title="新建表"
        open={createTableModalOpen}
        onOk={handleCreateTable}
        onCancel={() => {
          setCreateTableModalOpen(false);
          setCreateTableName('');
        }}
      >
        <Input
          placeholder="请输入表名"
          value={createTableName}
          onChange={(e) => setCreateTableName(e.target.value)}
          onPressEnter={handleCreateTable}
        />
      </Modal>

      {/* Edit Table Modal */}
      <Modal
        title="编辑表"
        open={editTableModalOpen}
        onCancel={() => setEditTableModalOpen(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setEditTableModalOpen(false)}>
            取消
          </Button>,
          <Button key="save" type="primary" onClick={handleSaveTableEdits}>
            保存修改
          </Button>,
        ]}
      >
        <Alert
          message="修改表名或列结构可能影响已关联的查询和应用"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form layout="vertical">
          <Form.Item label="表名">
            <Input value={editTableName} onChange={(e) => setEditTableName(e.target.value)} placeholder="请输入表名" />
          </Form.Item>
          <Form.Item label="表结构">
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
              {/* Table header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: '#fafafa',
                  borderBottom: '1px solid #d9d9d9',
                  fontWeight: 500,
                  color: '#666',
                }}
              >
                <span style={{ flex: 2 }}>列名</span>
                <span style={{ flex: 1.5 }}>类型</span>
                <span style={{ flex: 1.5 }}>默认值</span>
                <span style={{ flex: 1, textAlign: 'center' }}>必填</span>
                <span style={{ width: 40, textAlign: 'center' }}></span>
              </div>
              {/* Table body */}
              <div style={{ maxHeight: 360, overflow: 'auto' }}>
                {editColumns.map((col, idx) => (
                  <div
                    key={col.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: idx < editColumns.length - 1 ? '1px solid #f0f0f0' : 'none',
                    }}
                  >
                    <Input
                      placeholder="列名"
                      value={col.name}
                      onChange={(e) => {
                        const newCols = [...editColumns];
                        newCols[idx].name = e.target.value;
                        setEditColumns(newCols);
                      }}
                      style={{ flex: 2 }}
                    />
                    <Select
                      value={col.type}
                      onChange={(value) => {
                        const newCols = [...editColumns];
                        newCols[idx].type = value;
                        setEditColumns(newCols);
                      }}
                      style={{ flex: 1.5, marginLeft: 8 }}
                      options={[
                        { label: '文本', value: 'text' },
                        { label: '数字', value: 'number' },
                        { label: '布尔', value: 'boolean' },
                        { label: '日期时间', value: 'datetime' },
                      ]}
                    />
                    <Input
                      placeholder="默认值"
                      value={col.defaultValue || ''}
                      onChange={(e) => {
                        const newCols = [...editColumns];
                        newCols[idx].defaultValue = e.target.value || null;
                        setEditColumns(newCols);
                      }}
                      style={{ flex: 1.5, marginLeft: 8 }}
                    />
                    <div style={{ flex: 1, textAlign: 'center', marginLeft: 8 }}>
                      <Checkbox
                        checked={!col.isNullable}
                        onChange={(e) => {
                          const newCols = [...editColumns];
                          newCols[idx].isNullable = !e.target.checked;
                          setEditColumns(newCols);
                        }}
                      />
                    </div>
                    <div style={{ width: 40, textAlign: 'center' }}>
                      <Dropdown menu={{ items: getEditColumnMenuItems(col.key) }} trigger={['click']}>
                        <Button type="text" icon={<MoreOutlined />} danger={!col.id} />
                      </Dropdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddColumnInEdit} style={{ marginTop: 12 }}>
              添加列
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Column Modal */}
      <Modal
        title="添加列"
        open={addColumnModalOpen}
        onOk={handleAddColumn}
        onCancel={() => {
          setAddColumnModalOpen(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="列名" rules={[{ required: true, message: '请输入列名' }]}>
            <Input placeholder="请输入列名" />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]} initialValue="text">
            <Select
              options={[
                { label: '文本 (text)', value: 'text' },
                { label: '数字 (number)', value: 'number' },
                { label: '布尔 (boolean)', value: 'boolean' },
                { label: '日期时间 (datetime)', value: 'datetime' },
              ]}
            />
          </Form.Item>
          <Form.Item name="isNullable" label="允许为空" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="defaultValue" label="默认值">
            <Input placeholder="默认值（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Row Modal */}
      <Modal
        title="添加数据"
        open={createRowModalOpen}
        onOk={handleSubmitCreateRow}
        onCancel={() => {
          setCreateRowModalOpen(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          {columns.map((col) => (
            <Form.Item
              key={col.id}
              name={col.name}
              label={col.name}
              rules={col.isNullable ? [] : [{ required: true, message: `请输入${col.name}` }]}
            >
              {col.type === 'text' && <Input placeholder={col.defaultValue || `请输入${col.name}`} />}
              {col.type === 'number' && <InputNumber placeholder={col.defaultValue || `请输入${col.name}`} style={{ width: '100%' }} />}
              {col.type === 'boolean' && <Switch checkedChildren="是" unCheckedChildren="否" />}
              {col.type === 'datetime' && <DatePicker placeholder={col.defaultValue || `请选择${col.name}`} style={{ width: '100%' }} showTime />}
            </Form.Item>
          ))}
        </Form>
      </Modal>

      {/* Import Modal */}
      <Modal
        title="批量导入数据"
        open={importModalOpen}
        onCancel={() => { setImportModalOpen(false); setImportFile(null); setImportParseResult(null); }}
        footer={null}
        width={560}
      >
        <div style={{ padding: '16px 0' }}>
          <Alert
            message="请先下载模板，按照模板格式整理数据后上传 CSV 文件。仅支持 CSV 格式。"
            type="info"
            style={{ marginBottom: 16, background: '#fff7e6', borderColor: '#ffd591' }}
            showIcon
          />
          <div style={{ marginBottom: 16 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={async () => {
                if (!selectedTable) return;
                try {
                  const response = await novadbApi.getTemplate(selectedTable.id);
                  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${selectedTable.name}_template.csv`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  message.success('模板下载成功');
                } catch (error) {
                  message.error('模板下载失败');
                }
              }}
            >
              下载模板
            </Button>
          </div>

          {!importFile ? (
            <Upload.Dragger
              name="file"
              accept=".csv"
              multiple={false}
              maxCount={1}
              beforeUpload={(file) => {
                // Check file size (5MB max)
                if (file.size > 5 * 1024 * 1024) {
                  message.error('文件大小不能超过 5MB');
                  return false;
                }
                setImportFile(file);
                // Parse CSV to validate
                const reader = new FileReader();
                reader.onload = (e) => {
                  const text = e.target?.result as string;
                  const lines = text.split('\n').filter(line => line.trim());
                  if (lines.length < 2) {
                    setImportParseResult({ success: false, error: '文件为空或只有表头' });
                    return;
                  }

                  // Parse header to get column names
                  const csvHeaders = lines[0].split(',').map(h => h.trim());
                  const tableColumnNames = columns.map(c => c.name);
                  const tableColumnCount = tableColumnNames.length;

                  // Check column count
                  if (csvHeaders.length !== tableColumnCount) {
                    setImportParseResult({
                      success: false,
                      error: `CSV 文件有 ${csvHeaders.length} 列，当前表有 ${tableColumnCount} 列，请检查模板是否正确`
                    });
                    return;
                  }

                  // Check column names
                  const missingCols: string[] = [];
                  const extraCols: string[] = [];
                  csvHeaders.forEach(header => {
                    if (!tableColumnNames.includes(header)) {
                      extraCols.push(header);
                    }
                  });
                  tableColumnNames.forEach(col => {
                    if (!csvHeaders.includes(col)) {
                      missingCols.push(col);
                    }
                  });

                  if (missingCols.length > 0 || extraCols.length > 0) {
                    let errorMsg = '列名不匹配：';
                    if (missingCols.length > 0) {
                      errorMsg += `缺少列「${missingCols.join('、')}」`;
                    }
                    if (extraCols.length > 0) {
                      if (missingCols.length > 0) errorMsg += '；';
                      errorMsg += `多余列「${extraCols.join('、')}」`;
                    }
                    setImportParseResult({ success: false, error: errorMsg });
                    return;
                  }

                  // Check row column count
                  const headerCount = csvHeaders.length;
                  const dataLines = lines.slice(1);
                  for (let i = 0; i < dataLines.length; i++) {
                    const cellCount = dataLines[i].split(',').length;
                    if (cellCount !== headerCount) {
                      setImportParseResult({ success: false, error: `第 ${i + 2} 行列数不匹配（期望 ${headerCount} 列，实际 ${cellCount} 列）` });
                      return;
                    }
                  }
                  setImportParseResult({ success: true, rowCount: dataLines.length });
                };
                reader.onerror = () => {
                  setImportParseResult({ success: false, error: '文件读取失败' });
                };
                reader.readAsText(file);
                return false;
              }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击选择 CSV 文件上传</p>
              <p className="ant-upload-hint">或将文件拖拽到此处</p>
            </Upload.Dragger>
          ) : (
            <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UploadOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div>
                    <div style={{ fontWeight: 500 }}>{importFile.name}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{(importFile.size / 1024).toFixed(2)} KB</div>
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => { setImportFile(null); setImportParseResult(null); }}
                />
              </div>
              {importParseResult && (
                importParseResult.success ? (
                  <Alert type="success" message={`解析成功，共 ${importParseResult.rowCount} 行数据`} showIcon />
                ) : (
                  <Alert type="error" message={importParseResult.error} showIcon />
                )
              )}
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={() => { setImportModalOpen(false); setImportFile(null); setImportParseResult(null); }}>取消</Button>
            <Button
              type="primary"
              icon={<UploadOutlined />}
              disabled={!importParseResult?.success}
              onClick={async () => {
                if (!importFile || !selectedTable) return;
                try {
                  message.loading({ content: '导入中...', key: 'import' });
                  const result = await novadbApi.importData(selectedTable.id, importFile);
                  if (result.data.success) {
                    message.success({ content: `导入成功，共 ${result.data.imported} 条数据`, key: 'import' });
                    setImportModalOpen(false);
                    setImportFile(null);
                    setImportParseResult(null);
                    loadRows();
                  } else {
                    message.error({ content: result.data.errors?.[0] || '导入失败', key: 'import' });
                  }
                } catch (error: any) {
                  message.error({ content: error.message || '导入失败', key: 'import' });
                }
              }}
            >
              上传数据
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Row Modal */}
      <Modal
        title="编辑数据"
        open={editRowModalOpen}
        onOk={async () => {
          if (!selectedTable || !editRowData) return;
          try {
            const values = form.getFieldsValue();
            await novadbApi.updateRow(selectedTable.id, editRowData.id, values);
            message.success('保存成功');
            setEditRowModalOpen(false);
            setEditRowData(null);
            loadRows();
          } catch (error) {
            message.error('保存失败');
          }
        }}
        onCancel={() => {
          setEditRowModalOpen(false);
          setEditRowData(null);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          {columns.map((col) => (
            <Form.Item
              key={col.id}
              name={col.name}
              label={col.name}
              rules={col.isNullable ? [] : [{ required: true, message: `请输入${col.name}` }]}
            >
              {col.type === 'text' && <Input />}
              {col.type === 'number' && <InputNumber style={{ width: '100%' }} />}
              {col.type === 'boolean' && <Switch checkedChildren="是" unCheckedChildren="否" />}
              {col.type === 'datetime' && <DatePicker style={{ width: '100%' }} showTime />}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </Layout>
  );
};

export default NovaDBPage;
