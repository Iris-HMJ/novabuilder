import React from 'react';
import { Spin } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';

// Spinner component
const SpinnerComponent: React.FC<ComponentRenderProps> = ({ props, style, mode }) => {
  const {
    spinning = true,
    size = 'default',
    tip = '加载中...',
  } = props;

  const isEditMode = mode === 'edit';

  return (
    <div style={{
      ...style,
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      boxSizing: 'border-box',
    }}>
      <Spin spinning={isEditMode ? true : spinning} size={size} tip={tip} />
    </div>
  );
};

// Spinner component definition
export const SpinnerDefinition: ComponentDefinition = {
  type: 'Spinner',
  name: '加载中',
  category: 'action',
  icon: 'LoadingOutlined',
  defaultProps: {
    spinning: true,
    size: 'default',
    tip: '加载中...',
  },
  defaultStyle: {
    width: 100,
    height: 100,
  },
  propertySchema: [
    { key: 'spinning', label: '显示加载', type: 'expression', defaultValue: true },
    { key: 'size', label: '大小', type: 'select', options: [
      { label: '小', value: 'small' },
      { label: '默认', value: 'default' },
      { label: '大', value: 'large' },
    ]},
    { key: 'tip', label: '提示文字', type: 'text' },
  ],
  eventDefs: [],
  render: SpinnerComponent,
};

export default SpinnerDefinition;
