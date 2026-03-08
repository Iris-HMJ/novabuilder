import React from 'react';
import { List } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// List component
const ListComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    data,
    showBorder = true,
  } = props;

  const isEditMode = mode === 'edit';

  // Mock data for edit mode
  const mockData = ['列表项 1', '列表项 2', '列表项 3', '列表项 4', '列表项 5'];
  const listData = isEditMode ? mockData : (data || mockData);

  const handleItemClick = (item: any) => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onItemClick', { item });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', overflow: 'auto', background: '#fff', boxSizing: 'border-box' }}>
      <List
        bordered={showBorder}
        dataSource={listData}
        renderItem={(item: any) => (
          <List.Item onClick={() => handleItemClick(item)} style={{ cursor: isEditMode ? 'default' : 'pointer' }}>
            {typeof item === 'object' ? JSON.stringify(item) : item}
          </List.Item>
        )}
      />
    </div>
  );
};

// List component definition
export const ListDefinition: ComponentDefinition = {
  type: 'List',
  name: '列表',
  category: 'data',
  icon: 'UnorderedListOutlined',
  defaultProps: {
    data: '',
    itemTemplate: '{{item}}',
    showBorder: true,
  },
  defaultStyle: {
    width: 400,
    height: 300,
  },
  propertySchema: [
    { key: 'data', label: '数据源', type: 'expression', description: '查询结果数组' },
    { key: 'itemTemplate', label: '项模板', type: 'text', description: '每项的显示模板' },
    { key: 'showBorder', label: '显示边框', type: 'boolean', defaultValue: true },
  ],
  eventDefs: [
    { event: 'onItemClick', label: '项点击' },
  ],
  render: ListComponent,
};

export default ListDefinition;
