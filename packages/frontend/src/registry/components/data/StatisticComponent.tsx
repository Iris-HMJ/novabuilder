import React from 'react';
import { Statistic } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';

// Statistic component
const StatisticComponent: React.FC<ComponentRenderProps> = ({ props, style, mode }) => {
  const {
    title = '统计',
    value = 0,
    prefix = '',
    suffix = '',
    precision = 0,
    valueStyle = '#1677ff',
  } = props;

  const isEditMode = mode === 'edit';

  // In edit mode, show sample value
  const displayValue = isEditMode ? 1234 : (value || 0);

  return (
    <div
      style={{
        ...style,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <Statistic
        title={title}
        value={displayValue}
        precision={precision}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color: valueStyle }}
      />
    </div>
  );
};

// Statistic component definition
export const StatisticDefinition: ComponentDefinition = {
  type: 'Statistic',
  name: '统计',
  category: 'data',
  icon: 'NumberOutlined',
  defaultProps: {
    title: '统计',
    value: 0,
    prefix: '',
    suffix: '',
    precision: 0,
    valueStyle: '#1677ff',
  },
  defaultStyle: {
    width: 200,
    height: 100,
  },
  propertySchema: [
    { key: 'title', label: '标题', type: 'text' },
    { key: 'value', label: '值', type: 'expression', description: '数值或表达式' },
    { key: 'prefix', label: '前缀', type: 'text' },
    { key: 'suffix', label: '后缀', type: 'text' },
    { key: 'precision', label: '小数位数', type: 'number', defaultValue: 0 },
    { key: 'valueStyle', label: '值颜色', type: 'color', defaultValue: '#1677ff' },
  ],
  eventDefs: [],
  render: StatisticComponent,
};

export default StatisticDefinition;
