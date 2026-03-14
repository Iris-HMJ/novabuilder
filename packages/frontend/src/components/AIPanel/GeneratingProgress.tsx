import React from 'react';
import { Progress, Typography } from 'antd';
import { useAiStore } from '../../stores/aiStore';

const { Text } = Typography;

export const GeneratingProgress: React.FC = () => {
  const { generateProgress } = useAiStore();

  return (
    <div style={{ padding: '12px 16px', background: '#f6ffed', borderRadius: 8, marginBottom: 12 }}>
      <Progress
        percent={generateProgress}
        status="active"
        strokeColor={{ from: '#108ee9', to: '#87d068' }}
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        正在生成应用，这可能需要几秒钟...
      </Text>
    </div>
  );
};
