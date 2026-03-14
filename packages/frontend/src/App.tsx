import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppEditorPage from './pages/AppEditor/AppEditorPage';
import AppPreviewPage from './pages/AppPreview/AppPreviewPage';
import AppRunner from './pages/AppRunner';
import NovaDB from './pages/NovaDB';
import DataSources from './pages/DataSources';
import Users from './pages/Users';
import { Spin } from 'antd';

type UserRole = 'admin' | 'builder' | 'end_user';

// 路由守卫 - 未登录跳转登录页
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const location = useLocation();

  // Wait for store to rehydrate before checking auth
  if (!_hasHydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

// 角色守卫 - 检查用户角色
function RoleGuard({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { user, _hasHydrated } = useAuthStore();

  if (!_hasHydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // If no user, let ProtectedRoute handle redirect
  if (!user) {
    return <>{children}</>;
  }

  // Check if user role is allowed
  if (!allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to="/apps" replace />;
  }

  return <>{children}</>;
}

// 公开路由守卫 - 已登录用户访问跳转到 /apps
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // Wait for store to rehydrate before checking auth
  if (!_hasHydrated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/apps" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      {/* Public Routes - 已登录用户自动跳转 */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      {/* 编辑器页面 - 仅 admin 和 builder 可访问 */}
      <Route
        path="/apps/:appId/edit"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin', 'builder']}>
              <AppEditorPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      {/* 预览页面 - 仅 admin 和 builder 可访问 */}
      <Route
        path="/apps/:appId/preview"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['admin', 'builder']}>
              <AppPreviewPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      {/* 其他页面 - 使用 AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/apps" replace />} />
        <Route path="apps" element={<Dashboard />} />
        <Route path="apps/:appId" element={<AppRunner />} />
        {/* NovaDB - 仅 admin 和 builder 可访问 */}
        <Route
          path="database"
          element={
            <RoleGuard allowedRoles={['admin', 'builder']}>
              <NovaDB />
            </RoleGuard>
          }
        />
        {/* 数据源 - 仅 admin 和 builder 可访问 */}
        <Route
          path="datasources"
          element={
            <RoleGuard allowedRoles={['admin', 'builder']}>
              <DataSources />
            </RoleGuard>
          }
        />
        {/* 用户管理 - 仅 admin 可访问 */}
        <Route
          path="settings/users"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <Users />
            </RoleGuard>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/apps" replace />} />
    </Routes>
  );
}

export default App;
