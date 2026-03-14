import React from 'react';
import { Card, Button, Tag, List, Typography, Space } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import type { AiRequirement } from '../../api/ai';

const { Text } = Typography;

interface RequirementCardProps {
  requirement: AiRequirement;
  onConfirm?: () => void;
  onModify?: () => void;
}

export const RequirementCard: React.FC<RequirementCardProps> = ({
  requirement,
  onConfirm,
  onModify,
}) => {
  return (
    <Card
      size="small"
      style={{ background: '#fafafa', border: '1px solid #e8e8e8' }}
      styles={{ body: { padding: 12 } }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>{requirement.appName}</Text>
        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
          {requirement.summary}
        </Text>
      </div>

      {requirement.pages && requirement.pages.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>页面 ({requirement.pages.length})</Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
            {requirement.pages.map((page: any, idx: number) => (
              <Tag key={idx} color="blue">{page.name}</Tag>
            ))}
          </div>
        </div>
      )}

      {requirement.dataModel && requirement.dataModel.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>数据表 ({requirement.dataModel.length})</Text>
          <List
            size="small"
            dataSource={requirement.dataModel}
            renderItem={(table: any) => (
              <List.Item style={{ padding: '4px 0', border: 'none' }}>
                <Text code style={{ fontSize: 12 }}>{table.tableName}</Text>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {table.columns?.map((c: any) => c.name).join(', ')}
                </Text>
              </List.Item>
            )}
          />
        </div>
      )}

      <Space>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          onClick={onConfirm}
          size="small"
        >
          确认生成
        </Button>
        <Button
          icon={<EditOutlined />}
          onClick={onModify}
          size="small"
        >
          我要修改
        </Button>
      </Space>
    </Card>
  );
};
