import React, { useState } from 'react';
import { Tabs as AntTabs } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Tabs component
const TabsComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    tabs = [
      { label: '标签1', key: '1' },
      { label: '标签2', key: '2' },
    ],
    defaultActiveKey = '1',
    tabPosition = 'top',
  } = props;

  const isEditMode = mode === 'edit';
  const [activeKey, setActiveKey] = useState(defaultActiveKey);

  const tabItems = tabs.map((tab: any) => ({
    key: tab.key,
    label: tab.label,
    children: isEditMode ? (
      <div style={{ padding: 16, color: '#ccc', textAlign: 'center', border: '1px dashed #e8e8e8' }}>
        {tab.label} 内容区域
      </div>
    ) : null,
  }));

  const handleChange = (key: string) => {
    setActiveKey(key);
    if (!isEditMode) {
      triggerComponentEvent(componentId, 'onTabChange', { key });
    }
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <AntTabs
        id={componentId}
        activeKey={activeKey}
        defaultActiveKey={defaultActiveKey}
        items={tabItems}
        tabPosition={tabPosition}
        onChange={handleChange}
        size="small"
      />
    </div>
  );
};

// Tabs component definition
export const TabsDefinition: ComponentDefinition = {
  type: 'Tabs',
  name: '标签页',
  category: 'layout',
  icon: 'TabsOutlined',
  defaultProps: {
    tabs: [
      { label: '标签1', key: '1' },
      { label: '标签2', key: '2' },
    ],
    defaultActiveKey: '1',
    tabPosition: 'top',
  },
  defaultStyle: {
    width: 400,
    height: 200,
  },
  propertySchema: [
    { key: 'tabs', label: '标签配置', type: 'options', description: '[{label, key}]' },
    { key: 'defaultActiveKey', label: '默认激活', type: 'text', defaultValue: '1' },
    { key: 'tabPosition', label: '位置', type: 'select', options: [
      { label: '顶部', value: 'top' },
      { label: '底部', value: 'bottom' },
      { label: '左侧', value: 'left' },
      { label: '右侧', value: 'right' },
    ]},
  ],
  eventDefs: [
    { event: 'onTabChange', label: '切换标签' },
  ],
  render: TabsComponent,
};

export default TabsDefinition;
