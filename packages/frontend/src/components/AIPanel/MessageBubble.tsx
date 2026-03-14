import React from 'react';
import { Avatar } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import type { AiMessage } from '../../api/ai';
import { RequirementCard } from './RequirementCard';
import { PatchPreviewCard } from './PatchPreviewCard';

interface MessageBubbleProps {
  message: AiMessage;
  onConfirm?: () => void;
  onModify?: () => void;
  onConfirmPatch?: () => void;
  onRejectPatch?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onConfirm,
  onModify,
  onConfirmPatch,
  onRejectPatch,
}) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div
          style={{
            maxWidth: '80%',
            background: '#1677ff',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 12,
            borderTopRightRadius: 4,
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <Avatar
        size={32}
        icon={<RobotOutlined />}
        style={{ background: '#f0f0f0', color: '#666', marginRight: 8, flexShrink: 0 }}
      />
      <div style={{ maxWidth: '85%' }}>
        {message.metadata?.type === 'requirement' && message.metadata?.data ? (
          <RequirementCard
            requirement={message.metadata.data}
            onConfirm={onConfirm}
            onModify={onModify}
          />
        ) : message.metadata?.type === 'modification' && message.metadata?.data ? (
          <PatchPreviewCard
            patch={message.metadata.data}
            onConfirm={onConfirmPatch}
            onReject={onRejectPatch}
          />
        ) : (
          <div
            style={{
              background: '#f5f5f5',
              padding: '10px 14px',
              borderRadius: 12,
              borderTopLeftRadius: 4,
              whiteSpace: 'pre-wrap',
            }}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
};
