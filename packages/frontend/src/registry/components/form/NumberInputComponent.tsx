import React from 'react';
import { InputNumber } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// NumberInput component
const NumberInputComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    label = '',
    placeholder = '请输入数字',
    defaultValue,
    min,
    max,
    step = 1,
    disabled = false,
  } = props;

  // In edit mode, always enable input
  const isDisabled = mode === 'edit' ? false : disabled;

  const handleChange = (value: number | null) => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onChange', { value });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: 4, boxSizing: 'border-box' }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>{label}</label>
      )}
      <InputNumber
        id={componentId}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        disabled={isDisabled}
        onChange={handleChange}
        style={{ width: '100%', flex: 1 }}
      />
    </div>
  );
};

// NumberInput component definition
export const NumberInputDefinition: ComponentDefinition = {
  type: 'NumberInput',
  name: '数字输入',
  category: 'form',
  icon: 'MinusSquareOutlined',
  defaultProps: {
    label: '',
    placeholder: '请输入数字',
    defaultValue: undefined,
    min: undefined,
    max: undefined,
    step: 1,
    disabled: false,
  },
  defaultStyle: {
    width: 240,
    height: 64,
  },
  propertySchema: [
    { key: 'label', label: '标签', type: 'text' },
    { key: 'placeholder', label: '占位符', type: 'text' },
    { key: 'defaultValue', label: '默认值', type: 'number' },
    { key: 'min', label: '最小值', type: 'number' },
    { key: 'max', label: '最大值', type: 'number' },
    { key: 'step', label: '步进', type: 'number', defaultValue: 1 },
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
  ],
  eventDefs: [
    { event: 'onChange', label: '值变化' },
  ],
  render: NumberInputComponent,
};

export default NumberInputDefinition;
