import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Spin, Result } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { appApi } from '../api/app';
import { AppShell } from '../components/AppShell';
import PageRenderer from '../engine/PageRenderer';
import type { AppDefinition } from '@novabuilder/shared';

const { Title, Text } = Typography;

const AppRunner = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [app, setApp] = useState<{ id: string; name: string; definition: AppDefinition } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>('');

  useEffect(() => {
    const fetchPublishedApp = async () => {
      if (!appId) return;
      try {
        const data = await appApi.getPublished(appId);
        setApp(data);
        // Set current page to home page or first page
        const definition = data.definition;
        const homePage = definition?.pages?.find((p: any) => p.isHome) || definition?.pages?.[0];
        if (homePage) {
          setCurrentPageId(homePage.id);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || '获取应用失败');
      } finally {
        setLoading(false);
      }
    };
    fetchPublishedApp();
  }, [appId]);

  // Handle page change
  const handlePageChange = (pageId: string) => {
    setCurrentPageId(pageId);
  };

  // Get current page
  const currentPage = app?.definition?.pages?.find((p: any) => p.id === currentPageId) || app?.definition?.pages?.[0];

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header - minimal for run mode */}
      <div style={{
        background: '#fff',
        padding: '8px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexShrink: 0,
      }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/apps')}>
          返回应用列表
        </Button>
        <Title level={5} style={{ margin: 0 }}>
          {app?.name}
        </Title>
        <Text type="secondary" style={{ fontSize: 12 }}>(已发布)</Text>
      </div>

      {/* App content with AppShell - full screen */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {app?.definition && currentPage ? (
          <AppShell
            appDefinition={app.definition}
            appName={app?.name || ''}
            currentPageId={currentPageId}
            onPageChange={handlePageChange}
            mode="run"
          >
            <PageRenderer pageDef={currentPage} />
          </AppShell>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#999',
          }}>
            无页面内容
          </div>
        )}
      </div>
    </div>
  );
};

export default AppRunner;
