import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { useAiStore } from '../../stores/aiStore';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  onConfirmGenerate: () => void;
  onModify: () => void;
  onConfirmPatch?: () => void;
  onRejectPatch?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  onConfirmGenerate,
  onModify,
  onConfirmPatch,
  onRejectPatch,
}) => {
  const { messages, status } = useAiStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
      {messages.length === 0 && status === 'idle' && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>你好！我是 NovaBuilder AI 助手</div>
          <div style={{ fontSize: 12 }}>
            告诉我你想创建什么应用，比如：<br />
            "帮我做一个员工管理系统"
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          onConfirm={msg.metadata?.type === 'requirement' ? onConfirmGenerate : undefined}
          onModify={msg.metadata?.type === 'requirement' ? onModify : undefined}
          onConfirmPatch={msg.metadata?.type === 'modification' ? onConfirmPatch : undefined}
          onRejectPatch={msg.metadata?.type === 'modification' ? onRejectPatch : undefined}
        />
      ))}

      {(status === 'analyzing' || status === 'modifying') && (
        <div style={{ textAlign: 'center', padding: 12 }}>
          <Spin size="small" />
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            {status === 'modifying' ? 'AI 正在分析修改方案...' : 'AI 正在分析需求...'}
          </div>
        </div>
      )}

      {status === 'generating' && (
        <div style={{ textAlign: 'center', padding: 12 }}>
          <Spin size="small" />
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>AI 正在生成应用...</div>
        </div>
      )}

      {status === 'applyingPatch' && (
        <div style={{ textAlign: 'center', padding: 12 }}>
          <Spin size="small" />
          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>AI 正在应用修改...</div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
