import React, { useState, useCallback } from 'react';
import { Table, Input, Button, Space, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined, DragOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface Option {
  key: string;
  label: string;
  value: string;
}

interface OptionsEditorProps {
  value?: Option[];
  onChange?: (options: Option[]) => void;
}

const OptionsEditor: React.FC<OptionsEditorProps> = ({ value = [], onChange }) => {
  const [options, setOptions] = useState<Option[]>(value);

  const handleAdd = useCallback(() => {
    const newOption: Option = {
      key: `opt_${Date.now()}`,
      label: `选项${options.length + 1}`,
      value: `value${options.length + 1}`,
    };
    const newOptions = [...options, newOption];
    setOptions(newOptions);
    onChange?.(newOptions);
  }, [options, onChange]);

  const handleDelete = useCallback((key: string) => {
    const newOptions = options.filter((opt) => opt.key !== key);
    setOptions(newOptions);
    onChange?.(newOptions);
  }, [options, onChange]);

  const handleUpdate = useCallback((key: string, field: keyof Option, fieldValue: string) => {
    const newOptions = options.map((opt) =>
      opt.key === key ? { ...opt, [field]: fieldValue } : opt
    );
    setOptions(newOptions);
    onChange?.(newOptions);
  }, [options, onChange]);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    setOptions(newOptions);
    onChange?.(newOptions);
  }, [options, onChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    setOptions(newOptions);
    onChange?.(newOptions);
  }, [options, onChange]);

  const columnsConfig: ColumnsType<Option> = [
    {
      title: '',
      dataIndex: 'drag',
      width: 30,
      render: (_: any, __: Option, index: number) => (
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
            disabled={index === options.length - 1}
            onClick={() => handleMoveDown(index)}
          />
        </Space>
      ),
    },
    {
      title: '标签',
      dataIndex: 'label',
      width: '40%',
      render: (label: string, record: Option) => (
        <Input
          size="small"
          value={label}
          onChange={(e) => handleUpdate(record.key, 'label', e.target.value)}
          placeholder="显示标签"
        />
      ),
    },
    {
      title: '值',
      dataIndex: 'value',
      width: '40%',
      render: (value: string, record: Option) => (
        <Input
          size="small"
          value={value}
          onChange={(e) => handleUpdate(record.key, 'value', e.target.value)}
          placeholder="选项值"
        />
      ),
    },
    {
      title: '',
      dataIndex: 'action',
      width: 40,
      render: (_: any, record: Option) => (
        <Popconfirm
          title="确定删除此选项？"
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
        dataSource={options}
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
        添加选项
      </Button>
    </div>
  );
};

export default OptionsEditor;
