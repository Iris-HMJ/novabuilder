import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Tag } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { navigationConfig } from '../config/navigation';
import type { UserRole } from '@novabuilder/shared';

const { Header, Sider, Content } = Layout;

const roleColors: Record<UserRole, string> = {
  admin: 'red',
  builder: 'blue',
  end_user: 'green',
};

const roleLabels: Record<UserRole, string> = {
  admin: '管理员',
  builder: '开发者',
  end_user: '终端用户',
};

// 模式 A 标准布局：顶部导航 56px + 页面主体居中
const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // 根据用户角色过滤导航项
  const filteredNavItems = navigationConfig.filter((item) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role as UserRole);
  });

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航 56px 深色 */}
      <Header
        style={{
          background: '#001529',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          lineHeight: '56px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="32" height="32" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="48" rx="10" fill="url(#logoGradient)"/>
            <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 30L20 24L26 30L32 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <defs>
              <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1677ff"/>
                <stop offset="1" stopColor="#4096ff"/>
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>NovaBuilder</span>
        </div>
        <Dropdown
          menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer', color: '#fff' }}>
            <Avatar icon={<UserOutlined />} size="small" />
            <span>{user?.name || user?.email}</span>
            {user?.role && (
              <Tag color={roleColors[user.role as UserRole]} style={{ marginLeft: 8 }}>
                {roleLabels[user.role as UserRole]}
              </Tag>
            )}
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        {/* 左侧导航面板 */}
        <Sider
          width={200}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            transition: 'all 0.2s',
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={filteredNavItems.map((item) => ({
              key: item.path,
              icon: item.icon,
              label: item.label,
            }))}
            onClick={({ key }) => navigate(key)}
            style={{ borderRight: 0 }}
          />
          {/* 底部展开/收起按钮 */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '16px',
              borderTop: '1px solid #f0f0f0',
              background: '#fff',
              textAlign: 'center',
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: 16 }}
            >
              {collapsed ? '' : '收起'}
            </Button>
          </div>
        </Sider>
        {/* 页面主体 */}
        <Content style={{ padding: '24px', background: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
