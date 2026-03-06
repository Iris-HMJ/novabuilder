import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await authApi.login(values);
      login(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      message.success('登录成功');
      navigate('/apps');
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-form-wrapper">
        <div className="form-header">
          <h1 className="form-title">欢迎回来</h1>
          <p className="form-subtitle">登录你的账号</p>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
          className="login-form"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="邮箱"
              className="custom-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              className="custom-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="login-btn"
            >
              登录
            </Button>
          </Form.Item>

          <div className="form-footer">
            还没有账号？ <Link to="/register">立即注册</Link>
          </div>
        </Form>
      </div>

      <style>{`
        .login-form-wrapper {
          width: 100%;
          max-width: 360px;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 8px;
        }

        .form-subtitle {
          font-size: 14px;
          color: #8c8c8c;
        }

        .login-form .custom-input {
          height: 48px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .login-form .custom-input:hover {
          border-color: #91d5ff;
        }

        .login-form .custom-input:focus,
        .login-form .custom-input-focused {
          border-color: #1677ff;
          box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
        }

        .login-btn {
          height: 48px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
          border: none;
          transition: all 0.3s ease;
        }

        .login-btn:hover {
          background: linear-gradient(135deg, #4096ff 0%, #69b1ff 100%);
          box-shadow: 0 4px 12px rgba(22, 119, 255, 0.3);
          transform: translateY(-1px);
        }

        .form-footer {
          text-align: center;
          font-size: 14px;
          color: #8c8c8c;
        }

        .form-footer a {
          color: #1677ff;
          font-weight: 500;
          transition: color 0.2s;
        }

        .form-footer a:hover {
          color: #4096ff;
        }
      `}</style>
    </AuthLayout>
  );
};

export default Login;
