import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { appApi } from '../api/app';

const { Title, Text } = Typography;

interface PublishedApp {
  id: string;
  name: string;
  definition: any;
}

const AppRunner = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<PublishedApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublishedApp = async () => {
      if (!appId) return;
      try {
        const data = await appApi.getPublished(appId);
        setApp(data);
      } catch (err: any) {
        setError(err.response?.data?.message || '获取应用失败');
      } finally {
        setLoading(false);
      }
    };
    fetchPublishedApp();
  }, [appId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="403"
        title="无法访问"
        subTitle={error}
        extra={
          <Button type="primary" onClick={() => navigate('/apps')}>
            返回应用列表
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div style={{
        background: '#fff',
        padding: '12px 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/apps')}>
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {app?.name}
        </Title>
        <Text type="secondary">(已发布)</Text>
      </div>

      <div style={{
        padding: 24,
        minHeight: 'calc(100vh - 150px)',
        background: '#f5f5f5',
      }}>
        {/* Step 6: 这里会渲染已发布应用的组件 */}
        <div style={{
          background: '#fff',
          borderRadius: 8,
          padding: 48,
          textAlign: 'center',
          minHeight: 400,
        }}>
          <Title level={3}>{app?.name}</Title>
          <div style={{ color: '#888', marginTop: 16 }}>
            (Step 6 预览与运行正在开发中)
          </div>
          <div style={{ marginTop: 24, color: '#ccc', fontSize: 12 }}>
            definition: {JSON.stringify(app?.definition)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppRunner;
