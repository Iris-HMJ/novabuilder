import React from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useAiStore } from '../../stores/aiStore';

const { TextArea } = Input;

interface ChatInputProps {
  appId: string;
  hasExistingApp?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ appId, hasExistingApp = false }) => {
  const [input, setInput] = React.useState('');
  const { status, sendMessage, sendModification } = useAiStore();

  const isDisabled = status === 'analyzing' || status === 'generating' || status === 'modifying' || status === 'applyingPatch';
  const isEmpty = !input.trim();

  const handleSend = async () => {
    if (isEmpty || isDisabled) return;
    const value = input.trim();
    setInput('');

    // 如果已有应用，使用增量修改；否则使用首次生成
    if (hasExistingApp) {
      await sendModification(value, appId);
    } else {
      await sendMessage(value, appId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 获取 placeholder 文本
  const getPlaceholder = () => {
    if (status === 'analyzing') return 'AI 正在分析需求...';
    if (status === 'modifying') return 'AI 正在分析修改方案...';
    if (status === 'generating') return 'AI 正在生成应用...';
    if (status === 'applyingPatch') return 'AI 正在应用修改...';

    if (hasExistingApp) {
      return '描述你想修改的内容，例如："把表格增加一列邮箱"';
    }
    return '描述你想创建的应用，例如：帮我做一个员工管理系统';
  };

  return (
    <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
      <TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        autoSize={{ minRows: 1, maxRows: 4 }}
        disabled={isDisabled}
        style={{ borderRadius: 8 }}
      />
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={isEmpty || isDisabled}
          size="small"
        >
          发送
        </Button>
      </div>
    </div>
  );
};
