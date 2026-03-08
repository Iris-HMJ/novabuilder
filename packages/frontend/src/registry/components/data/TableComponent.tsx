import React from 'react';
import { Table as AntTable, TableProps } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Table component
const TableComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    data,
    columns = [],
    pagination = true,
    pageSize = 10,
    rowSelection = 'none',
    loading = false,
  } = props;

  // In edit mode, show placeholder data
  const isEditMode = mode === 'edit';

  // Mock data for edit mode
  const mockData = [
    { id: 1, key: '1', column1: '示例数据1', column2: '示例数据2', column3: '示例数据3' },
    { id: 2, key: '2', column1: '示例数据4', column2: '示例数据5', column3: '示例数据6' },
    { id: 3, key: '3', column1: '示例数据7', column2: '示例数据8', column3: '示例数据9' },
  ];

  const tableColumns = columns.length > 0
    ? columns.map((col: any) => ({
        title: col.title || col.dataIndex,
        dataIndex: col.dataIndex,
        key: col.key || col.dataIndex,
        width: col.width,
        type: col.type,
      }))
    : [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: '列1', dataIndex: 'column1', key: 'column1' },
        { title: '列2', dataIndex: 'column2', key: 'column2' },
        { title: '列3', dataIndex: 'column3', key: 'column3' },
      ];

  const handleRowClick = (record: any) => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onRowClick', { row: record });
  };

  const tableProps: TableProps<any> = {
    columns: tableColumns,
    dataSource: isEditMode ? mockData : (data || mockData),
    pagination: pagination ? { pageSize, showSizeChanger: true, showQuickJumper: true } : false,
    rowSelection: rowSelection !== 'none' ? { type: rowSelection === 'multiple' ? 'checkbox' : 'radio', onChange: () => {} } : undefined,
    loading: loading || false,
    size: 'small',
    scroll: { x: 'max-content' },
    rowKey: 'id',
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', overflow: 'hidden', background: '#fff', boxSizing: 'border-box' }}>
      <AntTable
        {...tableProps}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: isEditMode ? 'default' : 'pointer' },
        })}
      />
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
    data: '',
    columns: [],
    pagination: true,
    pageSize: 10,
    showSearch: false,
    rowSelection: 'none',
    loading: false,
  },
  defaultStyle: {
    width: 600,
    height: 400,
  },
  propertySchema: [
    { key: 'data', label: '数据源', type: 'expression', description: '查询结果，如 queries.getAll.data' },
    { key: 'columns', label: '列配置', type: 'columns' },
    { key: 'pagination', label: '分页', type: 'boolean', defaultValue: true },
    { key: 'pageSize', label: '每页条数', type: 'number', defaultValue: 10 },
    { key: 'showSearch', label: '显示搜索', type: 'boolean', defaultValue: false },
    { key: 'rowSelection', label: '行选择', type: 'select', options: [
      { label: '无', value: 'none' },
      { label: '单选', value: 'single' },
      { label: '多选', value: 'multiple' },
    ]},
  ],
  eventDefs: [
    { event: 'onRowClick', label: '行点击' },
    { event: 'onPageChange', label: '分页变化' },
    { event: 'onSelectionChange', label: '选择变化' },
  ],
  render: TableComponent,
};

export default TableDefinition;
