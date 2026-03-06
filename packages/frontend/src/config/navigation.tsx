import { AppstoreOutlined, DatabaseOutlined, ApiOutlined, SettingOutlined } from '@ant-design/icons';
import type { UserRole } from '@novabuilder/shared';

export interface NavItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  roles?: UserRole[]; // 如果指定，只有这些角色可见
}

export const navigationConfig: NavItem[] = [
  {
    key: 'apps',
    icon: <AppstoreOutlined />,
    label: '应用',
    path: '/apps',
  },
  {
    key: 'database',
    icon: <DatabaseOutlined />,
    label: 'NovaDB',
    path: '/database',
  },
  {
    key: 'datasources',
    icon: <ApiOutlined />,
    label: '数据源',
    path: '/datasources',
  },
  {
    key: 'users',
    icon: <SettingOutlined />,
    label: '用户管理',
    path: '/settings/users',
    roles: ['admin'], // 只有 admin 可见
  },
];
