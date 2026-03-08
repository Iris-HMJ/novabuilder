import React, { useState } from 'react';
import { Menu } from 'antd';
import {
  HomeOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Sidebar component
const SidebarComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    menuItems = [
      { key: '1', label: '首页', icon: 'HomeOutlined' },
      { key: '2', label: '用户管理', icon: 'TeamOutlined' },
      { key: '3', label: '设置', icon: 'SettingOutlined' },
    ],
    defaultSelectedKey = '1',
    collapsed = false,
    theme = 'light',
  } = props;

  const isEditMode = mode === 'edit';
  const [selectedKey, setSelectedKey] = useState(defaultSelectedKey);

  // Convert menu items to Menu format
  const getIcon = (iconName?: string) => {
    const icons: Record<string, any> = {
      HomeOutlined: <HomeOutlined />,
      UserOutlined: <UserOutlined />,
      SettingOutlined: <SettingOutlined />,
      TeamOutlined: <TeamOutlined />,
    };
    return icons[iconName || ''] || <UserOutlined />;
  };

  const items = menuItems.map((item: any) => ({
    key: item.key,
    label: item.label,
    icon: getIcon(item.icon),
  }));

  const handleClick = ({ key }: { key: string }) => {
    setSelectedKey(key);
    if (!isEditMode) {
      triggerComponentEvent(componentId, 'onMenuClick', { key });
    }
  };

  return (
    <div
      style={{
        ...style,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Menu
        id={componentId}
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultSelectedKeys={[defaultSelectedKey]}
        defaultOpenKeys={[]}
        inlineCollapsed={collapsed}
        theme={theme as any}
        items={items}
        onClick={handleClick}
      />
    </div>
  );
};

// Sidebar component definition
export const SidebarDefinition: ComponentDefinition = {
  type: 'Sidebar',
  name: '侧边栏',
  category: 'navigation',
  icon: 'MenuOutlined',
  defaultProps: {
    menuItems: [
      { key: '1', label: '首页', icon: 'HomeOutlined' },
      { key: '2', label: '用户管理', icon: 'TeamOutlined' },
      { key: '3', label: '设置', icon: 'SettingOutlined' },
    ],
    defaultSelectedKey: '1',
    collapsed: false,
    theme: 'light',
  },
  defaultStyle: {
    width: 200,
    height: 400,
  },
  propertySchema: [
    { key: 'menuItems', label: '菜单项', type: 'options', description: '[{key, label, icon}]' },
    { key: 'defaultSelectedKey', label: '默认选中', type: 'text', defaultValue: '1' },
    { key: 'collapsed', label: '默认收起', type: 'boolean', defaultValue: false },
    { key: 'theme', label: '主题', type: 'select', options: [
      { label: '浅色', value: 'light' },
      { label: '深色', value: 'dark' },
    ]},
  ],
  eventDefs: [
    { event: 'onMenuClick', label: '菜单点击' },
  ],
  render: SidebarComponent,
};

export default SidebarDefinition;
