import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, message, Progress } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import AuthLayout from '../components/AuthLayout';

const getPasswordStrength = (password: string): { level: number; color: string } => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 1) return { level: strength, color: '#ff4d4f' };
  if (strength === 2) return { level: strength, color: '#faad14' };
  return { level: strength, color: '#52c41a' };
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');

  const onFinish = async (values: { email: string; password: string; name: string }) => {
    setLoading(true);
    try {
      const response = await authApi.register(values);
      login(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      message.success('注册成功');
      navigate('/apps');
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

  return (
    <AuthLayout>
      <div className="register-form-wrapper">
        <div className="form-header">
          <h1 className="form-title">创建你的账号</h1>
          <p className="form-subtitle">开始构建你的第一个应用</p>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
          className="register-form"
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              className="custom-input"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入正确的邮箱格式' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="邮箱"
              className="custom-input"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 8, message: '密码至少 8 位' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: '密码需包含大小写字母和数字',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码（至少 8 位，包含大小写字母和数字）"
              className="custom-input"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>

          {password && (
            <div className="password-strength">
              <Progress
                percent={(strength.level / 4) * 100}
                showInfo={false}
                strokeColor={strength.color}
                trailColor="#f0f0f0"
                size="small"
              />
              <div className="strength-text" style={{ color: strength.color }}>
                {strength.level <= 1 && '弱'}
                {strength.level === 2 && '中'}
                {strength.level >= 3 && '强'}
              </div>
            </div>
          )}

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认密码"
              className="custom-input"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="register-btn"
            >
              注册
            </Button>
          </Form.Item>

          <div className="form-footer">
            已有账号？ <Link to="/login">立即登录</Link>
          </div>
        </Form>
      </div>

      <style>{`
        .register-form-wrapper {
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

        .register-form .custom-input {
          height: 48px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .register-form .custom-input:hover {
          border-color: #91d5ff;
        }

        .register-form .custom-input:focus,
        .register-form .custom-input-focused {
          border-color: #1677ff;
          box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.1);
        }

        .password-strength {
          margin-top: -8px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .password-strength .ant-progress {
          flex: 1;
        }

        .strength-text {
          font-size: 12px;
          font-weight: 500;
        }

        .register-btn {
          height: 48px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
          border: none;
          transition: all 0.3s ease;
        }

        .register-btn:hover {
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

export default Register;
