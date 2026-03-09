import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  FileOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import type { AppDefinition, NavigationConfig, PageDef } from '@novabuilder/shared';

const { Sider, Content } = Layout;

export interface AppShellProps {
  appDefinition: AppDefinition;
  appName: string;
  currentPageId: string;
  onPageChange: (pageId: string) => void;
  mode: 'edit' | 'preview' | 'run';
  children?: React.ReactNode;
}

// Default navigation config
const defaultNavigationConfig: NavigationConfig = {
  type: 'sidebar',
  position: 'left',
  theme: 'light',
  collapsed: false,
  collapsible: true,
  showAppName: true,
  width: 200,
  collapsedWidth: 48,
};

// Icon mapping
const iconMap: Record<string, React.ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  FileOutlined: <FileOutlined />,
  UserOutlined: <UserOutlined />,
  SettingOutlined: <SettingOutlined />,
  TeamOutlined: <TeamOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
};

const getIcon = (iconName?: string): React.ReactNode => {
  if (!iconName) return <FileOutlined />;
  return iconMap[iconName] || <FileOutlined />;
};

const AppShell: React.FC<AppShellProps> = ({
  appDefinition,
  appName,
  currentPageId,
  onPageChange,
  mode,
  children,
}) => {
  const navConfig = appDefinition.navigation || defaultNavigationConfig;
  const [collapsed, setCollapsed] = useState(navConfig.collapsed);

  const isEditMode = mode === 'edit';

  // Build container style based on mode
  const containerStyle: React.CSSProperties = isEditMode
    ? {
        padding: 8,
        height: '100%',
        boxSizing: 'border-box',
      }
    : {
        height: '100%',
        width: '100%',
      };

  const layoutStyle: React.CSSProperties = isEditMode
    ? {
        height: '100%',
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        border: '1px solid #e8e8e8',
      }
    : {
        height: '100%',
        width: '100%',
      };

  // Build menu items from pages
  const menuItems = appDefinition.pages.map((page: PageDef) => ({
    key: page.id,
    icon: getIcon(page.icon),
    label: page.name,
  }));

  const handleMenuClick = ({ key }: { key: string }) => {
    onPageChange(key);
  };

  const handleCollapsedChange = (value: boolean) => {
    setCollapsed(value);
  };

  return (
    <div style={containerStyle}>
      <Layout style={layoutStyle}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={handleCollapsedChange}
        width={navConfig.width}
        collapsedWidth={navConfig.collapsedWidth}
        theme={navConfig.theme}
        trigger={null}
        style={{
          overflow: 'auto',
          height: '100%',
        }}
      >
        {/* App Name Header */}
        {navConfig.showAppName && (
          <div
            style={{
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? 0 : '0 16px',
              color: navConfig.theme === 'dark' ? '#fff' : 'rgba(0,0,0,0.88)',
              background: navConfig.theme === 'dark' ? '#001529' : '#fff',
              fontWeight: 500,
              fontSize: 14,
              borderBottom: navConfig.theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              overflow: 'hidden',
            }}
          >
            {collapsed ? '📱' : `📱 ${appName}`}
          </div>
        )}

        {/* Navigation Menu */}
        <Menu
          theme={navConfig.theme}
          mode="inline"
          selectedKeys={[currentPageId]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />

        {/* Collapse Trigger */}
        {navConfig.collapsible && (
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 0',
              textAlign: 'center',
              cursor: 'pointer',
              background: navConfig.theme === 'dark' ? '#001529' : '#fff',
              color: navConfig.theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
              borderTop: navConfig.theme === 'dark' ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.08)',
              transition: 'color 0.3s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = navConfig.theme === 'dark' ? '#fff' : '#000')}
            onMouseLeave={(e) => (e.currentTarget.style.color = navConfig.theme === 'dark' ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)')}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        )}
      </Sider>

      <Content
        style={{
          flex: 1,
          background: '#f5f5f5',
          position: 'relative',
          overflow: 'auto',
          minHeight: 0,
        }}
      >
        {children}
      </Content>
    </Layout>
    </div>
  );
};

export default AppShell;
