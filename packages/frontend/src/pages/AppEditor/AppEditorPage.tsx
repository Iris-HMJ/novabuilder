import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message, Modal, Layout } from 'antd';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';
import { appApi } from '../../api/app';
import type { AppDefinition } from '@novabuilder/shared';
import EditorTopBar from './EditorTopBar';
import LeftPanel from './LeftPanel';
import Canvas from './Canvas';
import RightPanel from './RightPanel';
import QueryPanelWrapper, { QueryPanelRef } from './QueryPanelWrapper';
import { AppShell } from '../../components/AppShell';

// Create empty app definition
const createEmptyAppDefinition = (): AppDefinition => ({
  version: '1.0.0',
  pages: [
    {
      id: Math.random().toString(36).substring(2, 11),
      name: '首页',
      isHome: true,
      components: [],
    },
  ],
});

const AppEditorPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isDraggingFromPanel, setIsDraggingFromPanel] = useState(false);
  const queryPanelRef = useRef<QueryPanelRef>(null);

  const {
    loadApp,
    setSaveStatus,
    setDirty,
    appDefinition,
    appName,
    currentPageId,
    setCurrentPage,
    isDirty,
  } = useEditorStore();

  const { undo, redo, clear } = useHistoryStore();

  // Load app data on mount
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
        // If no draft, try published, otherwise create empty
        if (!definition) {
          definition = app.definitionPublished;
        }
        if (!definition) {
          definition = createEmptyAppDefinition();
        }

        loadApp(appId, app.name, definition);
        clear(); // Clear history on load
      } catch (error: any) {
        message.error(error.response?.data?.message || '获取应用失败');
        navigate('/apps');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApp();
  }, [appId, navigate, loadApp, clear]);

  // Auto-save with debounce
  useEffect(() => {
    if (!appId || !isDirty) return;

    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await appApi.update(appId, {
          definitionDraft: appDefinition,
        });
        setSaveStatus('saved');
        setDirty(false);
      } catch (error: any) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
      }
    }, 3000); // 3 second debounce

    return () => clearTimeout(timer);
  }, [appId, appDefinition, isDirty, setSaveStatus, setDirty]);

  // Handle publish
  const handlePublish = useCallback(() => {
    Modal.confirm({
      title: '发布应用',
      content: '确认将当前草稿发布为正式版本？发布后 End User 将看到最新版本。',
      okText: '确认发布',
      cancelText: '取消',
      onOk: async () => {
        if (!appId) return;
        try {
          await appApi.publish(appId);
          message.success('应用发布成功');
        } catch (error: any) {
          message.error(error.response?.data?.message || '发布失败');
        }
      },
    });
  }, [appId]);

  // Handle AI button (placeholder)
  const handleAI = useCallback(() => {
    message.info('AI 功能正在开发中');
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get active element to check if we're in an input
      const activeElement = document.activeElement;
      const isInInput = activeElement?.tagName === 'INPUT' ||
                        activeElement?.tagName === 'TEXTAREA' ||
                        activeElement?.closest('.cm-editor') ||
                        (activeElement instanceof HTMLElement && activeElement.isContentEditable);

      // Ctrl/Cmd + A - Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !isInInput) {
        e.preventDefault();
        useEditorStore.getState().selectAll();
        return;
      }

      // Escape - Clear selection
      if (e.key === 'Escape' && !isInInput) {
        e.preventDefault();
        useEditorStore.getState().clearSelection();
        return;
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && !isInInput) {
        e.preventDefault();
        const prevState = undo();
        if (prevState) {
          // Apply undo - this would update the editor store
          useEditorStore.setState({ appDefinition: prevState });
        }
      }

      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey && !isInInput) {
        e.preventDefault();
        const nextState = redo();
        if (nextState) {
          useEditorStore.setState({ appDefinition: nextState });
        }
      }

      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger save
        if (appId && isDirty) {
          setSaveStatus('saving');
          appApi.update(appId, { definitionDraft: appDefinition })
            .then(() => {
              setSaveStatus('saved');
              setDirty(false);
              message.success('保存成功');
            })
            .catch(() => {
              setSaveStatus('error');
              message.error('保存失败');
            });
        }
      }

      // Delete for delete selected component
      if ((e.key === 'Delete' || e.key === 'Backspace') && !isInInput) {
        const store = useEditorStore.getState();
        if (store.selectedComponentIds.length > 0) {
          store.deleteComponent(store.selectedComponentIds[0]);
        }
      }

      // Arrow keys for moving selected components
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && !isInInput) {
        const store = useEditorStore.getState();
        if (store.selectedComponentIds.length > 0) {
          e.preventDefault();
          const moveStep = e.shiftKey ? 8 : 1;
          const componentId = store.selectedComponentIds[0];
          const component = store.getComponent(componentId);
          if (component) {
            const { x, y } = component.style;
            let newX = x;
            let newY = y;

            switch (e.key) {
              case 'ArrowUp':
                newY = y - moveStep;
                break;
              case 'ArrowDown':
                newY = y + moveStep;
                break;
              case 'ArrowLeft':
                newX = x - moveStep;
                break;
              case 'ArrowRight':
                newX = x + moveStep;
                break;
            }

            store.moveComponent(componentId, newX, newY);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appId, appDefinition, isDirty, undo, redo, setSaveStatus, setDirty]);

  // Track drag state from panel
  useEffect(() => {
    const handleDragEnter = () => setIsDraggingFromPanel(true);
    const handleDragLeave = () => setIsDraggingFromPanel(false);
    const handleDragEnd = () => setIsDraggingFromPanel(false);

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragend', handleDragEnd);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Before unload warning for unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires this
        return ''; // Firefox
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (isLoading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f5f5f5',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ height: '100vh', background: '#f5f5f5' }}>
      {/* Top Bar */}
      <EditorTopBar
        appId={appId || null}
        onPublish={handlePublish}
        onAI={handleAI}
      />

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Canvas Area with AppShell */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingLeft: 48, paddingRight: 48, overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: 4, overflow: 'hidden' }}>
            {appDefinition && (
              <AppShell
                appDefinition={appDefinition}
                appName={appName}
                currentPageId={currentPageId || ''}
                onPageChange={setCurrentPage}
                mode="edit"
              >
                <Canvas isDraggingFromPanel={isDraggingFromPanel} />
              </AppShell>
            )}
          </div>

          {/* Bottom Query Panel */}
          {appId && <QueryPanelWrapper queryPanelRef={queryPanelRef} appId={appId} />}
        </div>

        {/* Left Panel - floating overlay */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          <LeftPanel
            onQuerySelect={(queryId) => queryPanelRef.current?.selectQuery(queryId)}
            onNewQuery={() => queryPanelRef.current?.openNewQueryModal()}
          />
        </div>

        {/* Right Panel - floating overlay */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
          }}
        >
          <RightPanel />
        </div>
      </div>
    </Layout>
  );
};

export default AppEditorPage;
