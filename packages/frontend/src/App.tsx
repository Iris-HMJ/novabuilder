import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import AppLayout from './components/AppLayout';
import AppEditorLayout from './components/AppEditorLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AppEditor from './pages/AppEditor';
import AppRunner from './pages/AppRunner';
import NovaDB from './pages/NovaDB';
import DataSources from './pages/DataSources';
import Users from './pages/Users';

// 路由守卫 - 未登录跳转登录页
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

// 公开路由守卫 - 已登录用户访问跳转到 /apps
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

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
      {/* 编辑器页面 - 独立全屏布局 */}
      <Route
        path="/apps/:appId/edit"
        element={
          <ProtectedRoute>
            <AppEditorLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppEditor />} />
      </Route>
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
        <Route path="database" element={<NovaDB />} />
        <Route path="datasources" element={<DataSources />} />
        <Route path="settings/users" element={<Users />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/apps" replace />} />
    </Routes>
  );
}

export default App;
