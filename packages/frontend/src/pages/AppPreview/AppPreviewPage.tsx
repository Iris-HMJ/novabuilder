import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message, Button } from 'antd';
import { ArrowLeftOutlined, CloseOutlined } from '@ant-design/icons';
import { appApi } from '../../api/app';
import { queryApi } from '../../api/query';
import { useEditorStore } from '../../stores/editorStore';
import { useQueryStore } from '../../stores/queryStore';
import PageRenderer from '../../engine/PageRenderer';
import { AppShell } from '../../components/AppShell';

const AppPreviewPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolbarTimeout, setToolbarTimeout] = useState<number | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string>('');

  const loadApp = useEditorStore((state) => state.loadApp);
  const appDefinition = useEditorStore((state) => state.appDefinition);
  const appName = useEditorStore((state) => state.appName);
  const queryResults = useQueryStore((state) => state.queryResults);
  const setQueries = useQueryStore((state) => state.setQueries);
  const setQueryResult = useQueryStore((state) => state.setQueryResult);

  // Load app data and initialize store
  useEffect(() => {
    const fetchApp = async () => {
      if (!appId) {
        message.error('无效的应用 ID');
        navigate('/apps');
        return;
      }

      try {
        const app = await appApi.get(appId);

        let definition = app.definitionDraft;
        // If no draft, try published
        if (!definition) {
          definition = app.definitionPublished;
        }

        if (!definition) {
          message.error('应用无内容');
          navigate('/apps');
          return;
        }

        // Initialize editor store with app data (so event handlers work)
        loadApp(appId, app.name, definition);

        // Load queries and their saved results
        try {
          const queries = await queryApi.list(appId);
          setQueries(queries as any);

          // Populate queryStore with saved results
          queries.forEach((query) => {
            if (query.lastResult) {
              setQueryResult(query.id, query.lastResult);
            }
          });
        } catch (error) {
          console.error('Failed to load queries:', error);
        }

        // Set current page to home page or first page
        const homePage = definition.pages.find(p => p.isHome) || definition.pages[0];
        if (homePage) {
          setCurrentPageId(homePage.id);
        }

        // Auto-hide toolbar after 3 seconds
        const timeout = window.setTimeout(() => {
          setShowToolbar(false);
        }, 3000);
        setToolbarTimeout(timeout);
      } catch (error: any) {
        message.error(error.response?.data?.message || '获取应用失败');
        navigate('/apps');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApp();

    return () => {
      if (toolbarTimeout) {
        clearTimeout(toolbarTimeout);
      }
    };
  }, [appId, navigate, loadApp]);

  const handleMouseMove = () => {
    if (!showToolbar) {
      setShowToolbar(true);
      const timeout = window.setTimeout(() => {
        setShowToolbar(false);
      }, 3000);
      setToolbarTimeout(timeout);
    }
  };

  const handleGoBack = () => {
    if (appId) {
      navigate(`/apps/${appId}/edit`);
    } else {
      navigate('/apps');
    }
  };

  const handleClose = () => {
    window.close();
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentPage = appDefinition?.pages.find(p => p.id === currentPageId) || appDefinition?.pages[0];

  // Handle page change
  const handlePageChange = (pageId: string) => {
    setCurrentPageId(pageId);
  };

  return (
    <div
      style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      {/* Floating toolbar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 40,
          background: showToolbar ? 'rgba(0, 0, 0, 0.6)' : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          transition: 'background 0.3s',
          zIndex: 9999,
        }}
      >
        <div style={{ color: '#fff', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>👁</span>
          <span>预览模式</span>
          {appName && <span>— {appName}</span>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={handleGoBack}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
          >
            返回编辑器
          </Button>
          <Button
            size="small"
            icon={<CloseOutlined />}
            onClick={handleClose}
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none' }}
          >
            关闭
          </Button>
        </div>
      </div>

      {/* App content with AppShell */}
      <div style={{ width: '100%', height: '100%', paddingTop: 40 }}>
        {appDefinition && currentPage ? (
          <AppShell
            appDefinition={appDefinition}
            appName={appName}
            currentPageId={currentPageId}
            onPageChange={handlePageChange}
            mode="preview"
          >
            <PageRenderer pageDef={currentPage} queryResults={queryResults} />
          </AppShell>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
            无页面内容
          </div>
        )}
      </div>
    </div>
  );
};

export default AppPreviewPage;
