import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Table as AntTable, Input, Empty, Tag, Tooltip, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Table component
const TableComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    // Static props (from property panel)
    columns: columnDefs = [],
    pagination = true,
    pageSize = 10,
    showSearch = false,
    rowSelection = 'none',
    bordered = false,
    compact = false,
    showHeader = true,
    headerBg = '#fafafa',
    rowHover = true,
    scrollable = true,
    striped = true,
    emptyText = '暂无数据',

    // Dynamic props (from query results - resolved by Canvas)
    data: rawData,
    loading = false,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const isEditMode = mode === 'edit';

  // Mock data for edit mode
  const mockData = useMemo(() => [
    { id: 1, key: '1', name: '张三', email: 'zhangsan@example.com', status: 'active' },
    { id: 2, key: '2', name: '李四', email: 'lisi@example.com', status: 'inactive' },
    { id: 3, key: '3', name: '王五', email: 'wangwu@example.com', status: 'active' },
  ], []);

  // Get table data - priority: rawData (dynamic) > mockData (edit mode) > empty
  const getTableData = (): any[] => {
    // If data is provided (from dynamic binding), use it
    if (Array.isArray(rawData) && rawData.length > 0) {
      return rawData;
    }

    // In edit mode with no real data, show mock data
    if (isEditMode) {
      return mockData;
    }

    return [];
  };

  // Apply search filter
  const dataSource = useMemo(() => {
    let list = getTableData();

    // Search filter
    if (searchText.trim() && list.length > 0) {
      const keyword = searchText.toLowerCase();
      list = list.filter((item) =>
        Object.values(item).some((val) =>
          String(val ?? '').toLowerCase().includes(keyword)
        )
      );
    }

    // Ensure each row has a key
    return list.map((item, idx) => ({
      ...item,
      key: item.key ?? item.id ?? idx,
    }));
  }, [rawData, mockData, isEditMode, searchText]);

  // Calculate scrollY based on container height
  useEffect(() => {
    if (!scrollable) {
      setScrollY(undefined);
      return;
    }

    const calculateScrollY = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const headerHeight = showHeader ? 48 : 0;
        const paginationHeight = pagination ? 56 : 0;
        const availableHeight = containerHeight - headerHeight - paginationHeight;
        setScrollY(availableHeight > 0 ? availableHeight : undefined);
      }
    };

    calculateScrollY();
    const resizeObserver = new ResizeObserver(calculateScrollY);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [scrollable, showHeader, pagination, style?.height]);

  // Build antd columns
  const antdColumns = useMemo(() => {
    // Use column definitions from props, or generate default columns from data
    const cols = columnDefs.length > 0 ? columnDefs : [];

    if (cols.length === 0 && dataSource.length > 0) {
      // Auto-generate columns from first row data
      const firstRow = dataSource[0];
      const keys = Object.keys(firstRow).filter(k => k !== 'key');
      return keys.map((key) => ({
        title: key,
        dataIndex: key,
        key: key,
        ellipsis: { showTitle: false },
      }));
    }

    return cols.map((col: any) => {
      const antdCol: any = {
        title: col.title || col.dataIndex,
        dataIndex: col.dataIndex,
        key: col.key || col.dataIndex,
        width: col.width,
        align: col.align,
        ellipsis: col.ellipsis !== false ? { showTitle: false } : false,
        sorter: col.sortable !== false
          ? (a: any, b: any) => {
              const aVal = a[col.dataIndex];
              const bVal = b[col.dataIndex];
              if (typeof aVal === 'number' && typeof bVal === 'number') return aVal - bVal;
              return String(aVal ?? '').localeCompare(String(bVal ?? ''));
            }
          : undefined,
      };

      // Format based on type
      switch (col.type) {
        case 'boolean':
          antdCol.render = (val: any) => (
            <Tag color={val ? 'green' : 'default'}>{val ? '是' : '否'}</Tag>
          );
          antdCol.align = antdCol.align || 'center';
          antdCol.width = antdCol.width || 80;
          break;
        case 'datetime':
          antdCol.render = (val: any) => {
            if (!val) return '-';
            try {
              return new Date(val).toLocaleString('zh-CN');
            } catch {
              return String(val);
            }
          };
          antdCol.width = antdCol.width || 180;
          break;
        case 'number':
          antdCol.align = antdCol.align || 'right';
          antdCol.render = (val: any) => {
            if (val === null || val === undefined) return '-';
            return typeof val === 'number' ? val.toLocaleString() : val;
          };
          break;
        case 'tag':
          antdCol.render = (val: any) => (val ? <Tag>{val}</Tag> : '-');
          break;
        default:
          // text type with tooltip
          antdCol.render = (val: any) => (
            <Tooltip title={val}>
              <span>{val ?? '-'}</span>
            </Tooltip>
          );
      }

      return antdCol;
    });
  }, [columnDefs, dataSource]);

  // Row selection config
  const rowSelectionConfig = useMemo(() => {
    if (rowSelection === 'none') return undefined;
    return {
      type: rowSelection === 'single' ? ('radio' as const) : ('checkbox' as const),
      selectedRowKeys,
      onChange: (keys: React.Key[], rows: any[]) => {
        setSelectedRowKeys(keys);
        triggerComponentEvent(componentId, 'onSelectionChange', { selectedRows: rows, selectedKeys: keys });
      },
    };
  }, [rowSelection, selectedRowKeys, componentId]);

  // Pagination config
  const paginationConfig: false | TableProps['pagination'] = pagination
    ? {
        pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total: number, range: [number, number]) =>
          `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
        pageSizeOptions: ['5', '10', '20', '50', '100'],
      }
    : false;

  const tableSize = compact ? 'small' : 'middle';

  // Handle row click
  const handleRowClick = (record: any) => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onRowClick', { row: record });
  };

  // Container style
  const containerStyle: React.CSSProperties = {
    ...style,
    width: '100%',
    height: '100%',
    overflow: isEditMode ? 'auto' : 'hidden',
    background: '#fff',
    boxSizing: 'border-box',
    borderRadius: style?.borderRadius || 8,
    boxShadow: style?.boxShadow || '0 1px 2px rgba(0, 0, 0, 0.03)',
    cursor: 'default',
  };

  // Prevent drag in edit mode
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.stopPropagation();
    }
  };

  return (
    <div ref={containerRef} style={containerStyle} onMouseDown={handleMouseDown}>
      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <Input
            prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
            placeholder="搜索..."
            allowClear
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 240 }}
          />
        </div>
      )}

      {/* Loading state */}
      {loading && dataSource.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Spin tip="加载中..." />
        </div>
      ) : (
        <AntTable
          columns={antdColumns}
          dataSource={dataSource}
          pagination={paginationConfig}
          rowSelection={rowSelectionConfig}
          loading={loading}
          size={tableSize}
          scroll={{ x: 'max-content', y: scrollable ? scrollY : undefined }}
          bordered={bordered}
          showHeader={showHeader}
          onRow={(record, index) => ({
            onClick: () => handleRowClick(record),
            style: {
              cursor: isEditMode ? 'default' : 'pointer',
              background: !isEditMode && striped && index !== undefined && index % 2 === 1 ? '#fafafa' : undefined,
            },
          })}
          locale={{
            emptyText: (
              <Empty
                description={isEditMode ? '拖拽列配置来定义表格列' : emptyText}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
          style={{
            '--ant-table-header-bg': headerBg,
          } as any}
        />
      )}

      {/* Custom styles */}
      <style>{`
        .ant-table-wrapper .ant-table {
          border-radius: ${style?.borderRadius || 8}px;
        }
        .ant-table-wrapper .ant-table-thead > tr > th {
          background: ${headerBg} !important;
          font-weight: 600;
          font-size: 13px;
        }
        .ant-table-wrapper .ant-table-tbody > tr:hover > td {
          ${rowHover ? 'background: #f5f7fa !important;' : ''}
        }
        .ant-table-wrapper .ant-table-tbody > tr > td {
          font-size: 13px;
        }
        .ant-table-wrapper .ant-table-tbody > tr {
          cursor: pointer !important;
        }
        .ant-table-wrapper .ant-table-content,
        .ant-table-wrapper .ant-table-body,
        .ant-table-wrapper .ant-table-scroll {
          cursor: auto !important;
        }
        .ant-pagination {
          margin: 12px 16px !important;
        }
        ${bordered ? `
          .ant-table-wrapper .ant-table-tbody > tr > td {
            border-bottom: 1px solid #f0f0f0;
          }
          .ant-table-wrapper .ant-table-thead > tr > th {
            border-bottom: 2px solid #e8e8e8;
          }
        ` : ''}
      `}</style>
    </div>
  );
};

// Table component definition
export const TableDefinition: ComponentDefinition = {
  type: 'Table',
  name: '表格',
  category: 'data',
  icon: 'TableOutlined',
  defaultProps: {
    dataSource: '', // 查询ID 或 'raw' 表示 raw json
    rawData: '[{"id":1,"name":"张三","email":"zhangsan@example.com"},{"id":2,"name":"李四","email":"lisi@example.com"},{"id":3,"name":"王五","email":"wangwu@example.com"}]', // 原始JSON数据
    columns: [],
    pagination: true,
    pageSize: 10,
    showSearch: false,
    rowSelection: 'none',
    loading: false,
    // New style defaults
    bordered: false,
    striped: true,
    compact: false,
    showHeader: true,
    headerBg: '#f8f9fa',
    rowHover: true,
    scrollable: true,
  },
  defaultStyle: {
    width: 600,
    height: 400,
    borderRadius: 8,
  },
  propertySchema: [
    { key: 'dataSource', label: '数据源', type: 'datasource', description: '选择查询或示例数据' },
    { key: 'rawData', label: '示例数据', type: 'textarea', description: '输入JSON数组数据' },
    { key: 'columns', label: '列配置', type: 'columns' },
    { key: 'pagination', label: '分页', type: 'boolean', defaultValue: true },
    { key: 'pageSize', label: '每页条数', type: 'number', defaultValue: 10 },
    { key: 'showSearch', label: '显示搜索', type: 'boolean', defaultValue: false },
    { key: 'rowSelection', label: '行选择', type: 'select', options: [
      { label: '无', value: 'none' },
      { label: '单选', value: 'single' },
      { label: '多选', value: 'multiple' },
    ]},
    // Style properties
    { key: 'bordered', label: '显示边框', type: 'boolean', defaultValue: false, description: '显示表格边框' },
    { key: 'striped', label: '斑马纹', type: 'boolean', defaultValue: true, description: '交替显示行背景色' },
    { key: 'compact', label: '紧凑模式', type: 'boolean', defaultValue: false, description: '使用更紧凑的间距' },
    { key: 'showHeader', label: '显示表头', type: 'boolean', defaultValue: true },
    { key: 'headerBg', label: '表头背景', type: 'select', options: [
      { label: '浅灰', value: '#f8f9fa' },
      { label: '白色', value: '#ffffff' },
      { label: '蓝色', value: '#e6f7ff' },
      { label: '绿色', value: '#f6ffed' },
    ]},
    { key: 'rowHover', label: '悬停高亮', type: 'boolean', defaultValue: true, description: '鼠标悬停时高亮行' },
    { key: 'scrollable', label: '滚动条', type: 'boolean', defaultValue: true, description: '数据超出时显示垂直滚动条' },
  ],
  eventDefs: [
    { event: 'onRowClick', label: '行点击' },
    { event: 'onPageChange', label: '分页变化' },
    { event: 'onSelectionChange', label: '选择变化' },
  ],
  render: TableComponent,
};

export default TableDefinition;
