import React, { useEffect, useRef } from 'react';
import { Button, Typography } from 'antd';
import { CloseOutlined, RobotOutlined } from '@ant-design/icons';
import { useAiStore } from '../../stores/aiStore';
import { useEditorStore } from '../../stores/editorStore';
import { saveToHistory } from '../../stores/historyStore';
import { MessageList } from './MessageList';
import { GeneratingProgress } from './GeneratingProgress';
import { ChatInput } from './ChatInput';

const { Text } = Typography;

interface AIPanelProps {
  appId: string;
}

export const AIPanel: React.FC<AIPanelProps> = ({ appId }) => {
  const {
    isOpen,
    closePanel,
    status,
    confirmGenerate,
    confirmPatch,
    rejectPatch,
    messages,
  } = useAiStore();
  const { loadApp } = useEditorStore();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 判断是否有已生成的应用（用于决定使用哪种对话模式）
  const hasExistingApp = messages.some(
    (msg) => msg.metadata?.type === 'generation' || msg.metadata?.type === 'patchApplied'
  );

  useEffect(() => {
    if (isOpen && appId) {
      useAiStore.getState().loadHistory(appId);
    }
  }, [isOpen, appId]);

  const handleConfirmGenerate = async () => {
    // 保存当前状态到历史记录（支持撤销）
    saveToHistory();

    const result = await confirmGenerate(appId);
    if (result?.appDefinition) {
      // 重新加载应用定义到编辑器
      loadApp(appId, useEditorStore.getState().appName, result.appDefinition);
    }
  };

  const handleModify = () => {
    // 聚焦输入框，让用户补充修改意见
    inputRef.current?.focus();
  };

  // Step 8: 确认应用 Patch
  const handleConfirmPatch = async () => {
    // 保存当前状态到历史记录（支持撤销）
    saveToHistory();

    await confirmPatch(appId, (appDefinition) => {
      // 回调：重新加载应用定义到编辑器
      loadApp(appId, useEditorStore.getState().appName, appDefinition);
    });
  };

  // Step 8: 拒绝 Patch
  const handleRejectPatch = () => {
    rejectPatch();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#fff',
        borderLeft: '1px solid #f0f0f0',
      }}
    >
      {/* 标题栏 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RobotOutlined style={{ fontSize: 18 }} />
          <Text strong>AI 助手</Text>
        </div>
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined />}
          onClick={closePanel}
        />
      </div>

      {/* 消息列表 */}
      <MessageList
        onConfirmGenerate={handleConfirmGenerate}
        onModify={handleModify}
        onConfirmPatch={handleConfirmPatch}
        onRejectPatch={handleRejectPatch}
      />

      {/* 生成进度条 */}
      {(status === 'generating' || status === 'applyingPatch') && <GeneratingProgress />}

      {/* 输入框 */}
      <ChatInput appId={appId} hasExistingApp={hasExistingApp} />

      {/* 错误提示 */}
      {status === 'error' && (
        <div style={{ padding: '8px 12px', background: '#fff2f0', color: '#ff4d4f', fontSize: 12 }}>
          {useAiStore.getState().error}
        </div>
      )}
    </div>
  );
};
