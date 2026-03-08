import React from 'react';
import { Button, Space, Typography, Input, Tooltip, Select, Divider } from 'antd';
import {
  ArrowLeftOutlined,
  UndoOutlined,
  RedoOutlined,
  EyeOutlined,
  SendOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../stores/editorStore';
import { useHistoryStore } from '../../stores/historyStore';
import { appApi } from '../../api/app';
import { message } from 'antd';

const { Text } = Typography;

interface EditorTopBarProps {
  appId: string | null;
  onPublish: () => void;
  onAI: () => void;
}

const EditorTopBar: React.FC<EditorTopBarProps> = ({ appId, onPublish, onAI }) => {
  const navigate = useNavigate();
  const {
    appName,
    setAppName,
    saveStatus,
    appDefinition,
    currentPageId,
    setCurrentPage,
  } = useEditorStore();

  const { canUndo, canRedo, undo, redo } = useHistoryStore();

  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editedName, setEditedName] = React.useState(appName);

  const handleGoBack = () => {
    navigate('/apps');
  };

  const handlePreview = () => {
    if (appId) {
      window.open(`/apps/${appId}/preview`, '_blank');
    }
  };

  const handleNameClick = () => {
    setEditedName(appName);
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (editedName.trim() && editedName.trim() !== appName) {
      setAppName(editedName.trim());
      // Call API to update app name
      if (appId) {
        try {
          await appApi.update(appId, { name: editedName.trim() });
        } catch (error: any) {
          message.error('保存应用名称失败');
        }
      }
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditedName(appName);
      setIsEditingName(false);
    }
  };

  const handlePageChange = (pageId: string) => {
    setCurrentPage(pageId);
  };

  const handleUndo = () => {
    const prevState = undo();
    if (prevState) {
      useEditorStore.setState({ appDefinition: prevState });
    }
  };

  const handleRedo = () => {
    const nextState = redo();
    if (nextState) {
      useEditorStore.setState({ appDefinition: nextState });
    }
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saved':
        return (
          <Text type="success" style={{ fontSize: 12 }}>
            <CheckCircleOutlined /> 已保存
          </Text>
        );
      case 'saving':
        return (
          <Text type="warning" style={{ fontSize: 12 }}>
            <LoadingOutlined spin /> 保存中...
          </Text>
        );
      case 'error':
        return (
          <Text type="danger" style={{ fontSize: 12 }}>
            <CloseCircleOutlined /> 保存失败
          </Text>
        );
      default:
        return null;
    }
  };

  return (
    <header
      style={{
        height: 48,
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      {/* Left section */}
      <Space>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleGoBack}
        >
          返回
        </Button>

        {isEditingName ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameSave}
            onPressEnter={handleNameSave}
            onKeyDown={handleNameKeyDown}
            autoFocus
            size="small"
            style={{ width: 200 }}
          />
        ) : (
          <span
            style={{
              fontWeight: 500,
              fontSize: 15,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
            onClick={handleNameClick}
            className="app-name-editable"
          >
            {appName || '未命名应用'}
            <EditOutlined className="edit-icon" style={{ fontSize: 12, opacity: 0, transition: 'opacity 0.2s' }} />
          </span>
        )}

        {renderSaveStatus()}
      </Space>

      {/* Center section - Undo/Redo and Page Select */}
      <Space>
        <Tooltip title="撤销 (Ctrl+Z)">
          <Button
            type="text"
            icon={<UndoOutlined />}
            onClick={handleUndo}
            disabled={!canUndo()}
          >
            撤销
          </Button>
        </Tooltip>
        <Tooltip title="重做 (Ctrl+Shift+Z)">
          <Button
            type="text"
            icon={<RedoOutlined />}
            onClick={handleRedo}
            disabled={!canRedo()}
          >
            重做
          </Button>
        </Tooltip>

        <Divider type="vertical" style={{ margin: '0 8px' }} />

        <Select
          value={currentPageId}
          onChange={handlePageChange}
          size="small"
          style={{ width: 140 }}
          options={appDefinition.pages.map((page) => ({
            value: page.id,
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {page.isHome && <span style={{ color: '#52c41a', fontSize: 10 }}>🏠</span>}
                {page.name}
              </span>
            ),
          }))}
        />
      </Space>

      {/* Right section */}
      <Space>
        <Button icon={<EyeOutlined />} onClick={handlePreview}>
          预览
        </Button>
        <Button type="primary" icon={<SendOutlined />} onClick={onPublish}>
          发布
        </Button>
        <Divider type="vertical" style={{ margin: '0 8px' }} />
        <Button icon={<RobotOutlined />} onClick={onAI}>
          AI
        </Button>
      </Space>
    </header>
  );
};

export default EditorTopBar;
