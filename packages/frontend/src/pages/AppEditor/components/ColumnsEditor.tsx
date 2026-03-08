import React, { useState, useCallback } from 'react';
import { Table, Input, Select, Button, Space, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Column {
  key: string;
  title: string;
  dataIndex: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'tag' | 'link' | 'action';
}

interface ColumnsEditorProps {
  value?: Column[];
  onChange?: (columns: Column[]) => void;
}

const columnTypes = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '日期', value: 'date' },
  { label: '布尔', value: 'boolean' },
  { label: '标签', value: 'tag' },
  { label: '链接', value: 'link' },
  { label: '操作', value: 'action' },
];

const ColumnsEditor: React.FC<ColumnsEditorProps> = ({ value = [], onChange }) => {
  const [columns, setColumns] = useState<Column[]>(value);

  const handleAdd = useCallback(() => {
    const newColumn: Column = {
      key: `col_${Date.now()}`,
      title: `列${columns.length + 1}`,
      dataIndex: `field${columns.length + 1}`,
      type: 'text',
    };
    const newColumns = [...columns, newColumn];
    setColumns(newColumns);
    onChange?.(newColumns);
  }, [columns, onChange]);

  const handleDelete = useCallback((key: string) => {
    const newColumns = columns.filter((col) => col.key !== key);
    setColumns(newColumns);
    onChange?.(newColumns);
  }, [columns, onChange]);

  const handleUpdate = useCallback((key: string, field: keyof Column, fieldValue: string) => {
    const newColumns = columns.map((col) =>
      col.key === key ? { ...col, [field]: fieldValue } : col
    );
    setColumns(newColumns);
    onChange?.(newColumns);
  }, [columns, onChange]);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const newColumns = [...columns];
    [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
    setColumns(newColumns);
    onChange?.(newColumns);
  }, [columns, onChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= columns.length - 1) return;
    const newColumns = [...columns];
    [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
    setColumns(newColumns);
    onChange?.(newColumns);
  }, [columns, onChange]);

  const columnsConfig: ColumnsType<Column> = [
    {
      title: '',
      dataIndex: 'drag',
      width: 30,
      render: (_: any, __: Column, index: number) => (
        <Space size={2}>
          <Button
            type="text"
            size="small"
            icon={<DragOutlined />}
            disabled={index === 0}
            onClick={() => handleMoveUp(index)}
          />
          <Button
            type="text"
            size="small"
            icon={<DragOutlined style={{ transform: 'rotate(180deg)' }} />}
            disabled={index === columns.length - 1}
            onClick={() => handleMoveDown(index)}
          />
        </Space>
      ),
    },
    {
      title: '列标题',
      dataIndex: 'title',
      width: '35%',
      render: (title: string, record: Column) => (
        <Input
          size="small"
          value={title}
          onChange={(e) => handleUpdate(record.key, 'title', e.target.value)}
          placeholder="列标题"
        />
      ),
    },
    {
      title: '字段名',
      dataIndex: 'dataIndex',
      width: '30%',
      render: (dataIndex: string, record: Column) => (
        <Input
          size="small"
          value={dataIndex}
          onChange={(e) => handleUpdate(record.key, 'dataIndex', e.target.value)}
          placeholder="字段名"
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: '20%',
      render: (type: string, record: Column) => (
        <Select
          size="small"
          value={type}
          onChange={(val) => handleUpdate(record.key, 'type', val)}
          options={columnTypes}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '',
      dataIndex: 'action',
      width: 40,
      render: (_: any, record: Column) => (
        <Popconfirm
          title="确定删除此列？"
          onConfirm={() => handleDelete(record.key)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="text" size="small" icon={<DeleteOutlined />} danger />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Table
        size="small"
        dataSource={columns}
        columns={columnsConfig}
        pagination={false}
        bordered
        rowKey="key"
      />
      <Button
        type="dashed"
        size="small"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginTop: 8, width: '100%' }}
      >
        添加列
      </Button>
    </div>
  );
};

export default ColumnsEditor;
