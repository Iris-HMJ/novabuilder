import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Layout, Button, Space, Typography, Spin, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EyeOutlined, RocketOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import { appApi } from '../api/app';

const { Header, Content } = Layout;
const { Title } = Typography;

const AppEditorLayout: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      if (!appId) return;
      try {
        const app = await appApi.get(appId);
        setAppName(app.name);
      } catch (error: any) {
        message.error(error.response?.data?.message || '获取应用失败');
      } finally {
        setLoading(false);
      }
    };
    fetchApp();
  }, [appId]);

  const handleGoBack = () => {
    navigate('/apps');
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 48,
            borderBottom: '1px solid #e8e8e8',
          }}
        >
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleGoBack}>返回</Button>
        </Header>
        <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 48 }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* 编辑器顶栏 */}
      <Header
        style={{
          background: '#fff',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 48,
          lineHeight: '48px',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          borderBottom: '1px solid #e8e8e8',
        }}
      >
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleGoBack}>返回</Button>
          <Title level={5} style={{ margin: 0 }}>{appName || '未命名应用'}</Title>
        </Space>
        <Space>
          <Button icon={<UndoOutlined />} disabled>撤销</Button>
          <Button icon={<RedoOutlined />} disabled>重做</Button>
          <Button icon={<SaveOutlined />}>保存</Button>
          <Button icon={<EyeOutlined />}>预览</Button>
          <Button type="primary" icon={<RocketOutlined />}>发布</Button>
        </Space>
      </Header>

      {/* 页面主体 */}
      <Content style={{ marginTop: 48, height: 'calc(100vh - 48px)', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default AppEditorLayout;
