import React from 'react';
import { Card, Button, Tag, List, Typography, Space } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { AppPatch } from '../../api/ai';

const { Text } = Typography;

interface PatchPreviewCardProps {
  patch: AppPatch;
  onConfirm?: () => void;
  onReject?: () => void;
}

// Action type to Chinese mapping
const actionTypeLabels: Record<string, { label: string; color: string }> = {
  updateComponent: { label: '更新组件', color: 'blue' },
  addComponent: { label: '添加组件', color: 'green' },
  removeComponent: { label: '删除组件', color: 'red' },
  addQuery: { label: '添加查询', color: 'cyan' },
  updateQuery: { label: '更新查询', color: 'blue' },
  removeQuery: { label: '删除查询', color: 'orange' },
  addColumn: { label: '添加列', color: 'purple' },
  addTable: { label: '添加表', color: 'geekblue' },
};

// Generate description for each action
const getActionDescription = (action: any): string => {
  switch (action.type) {
    case 'updateComponent':
      return `更新组件 ${action.componentId}，修改 ${Object.keys(action.changes).join(', ')}`;
    case 'addComponent':
      return `添加 ${action.component.type} 组件：${action.component.name}`;
    case 'removeComponent':
      return `删除组件 ${action.componentId}`;
    case 'addQuery':
      return `添加查询：${action.query.name}`;
    case 'updateQuery':
      return `更新查询 ${action.queryId}，修改 ${Object.keys(action.changes).join(', ')}`;
    case 'removeQuery':
      return `删除查询 ${action.queryId}`;
    case 'addColumn':
      return `在表 ${action.tableName} 添加列 ${action.column.name} (${action.column.type})`;
    case 'addTable':
      return `创建表 ${action.table.tableName}，包含 ${action.table.columns?.length || 0} 列`;
    default:
      return JSON.stringify(action);
  }
};

export const PatchPreviewCard: React.FC<PatchPreviewCardProps> = ({
  patch,
  onConfirm,
  onReject,
}) => {
  return (
    <Card
      size="small"
      style={{ background: '#fafafa', border: '1px solid #e8e8e8' }}
      styles={{ body: { padding: 12 } }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong style={{ fontSize: 14 }}>修改方案</Text>
        <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
          {patch.summary}
        </Text>
      </div>

      {patch.actions && patch.actions.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            修改操作 ({patch.actions.length})
          </Text>
          <List
            size="small"
            dataSource={patch.actions}
            renderItem={(action: any) => {
              const typeInfo = actionTypeLabels[action.type] || { label: action.type, color: 'default' };
              return (
                <List.Item style={{ padding: '4px 0', border: 'none' }}>
                  <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    {getActionDescription(action)}
                  </Text>
                </List.Item>
              );
            }}
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
          确认应用
        </Button>
        <Button
          danger
          icon={<CloseOutlined />}
          onClick={onReject}
          size="small"
        >
          取消
        </Button>
      </Space>
    </Card>
  );
};
