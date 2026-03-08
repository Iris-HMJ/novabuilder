import React from 'react';
import { Input } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// TextInput component
const TextInputComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    label = '',
    placeholder = '请输入...',
    defaultValue = '',
    disabled = false,
    required = false,
    maxLength,
  } = props;

  // In edit mode, always enable input; in preview/production, respect disabled prop
  const isDisabled = mode === 'edit' ? false : disabled;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onChange', { value: e.target.value });
  };

  const handleBlur = () => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onBlur', {});
  };

  const handleFocus = () => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onFocus', {});
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: 4, boxSizing: 'border-box' }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>
          {label}
          {required && <span style={{ color: '#ff4d4f' }}> *</span>}
        </label>
      )}
      <Input
        id={componentId}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={isDisabled}
        maxLength={maxLength}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        style={{ width: '100%', flex: 1 }}
      />
    </div>
  );
};

// TextInput component definition
export const TextInputDefinition: ComponentDefinition = {
  type: 'TextInput',
  name: '文本输入',
  category: 'form',
  icon: 'InputOutlined',
  defaultProps: {
    label: '',
    placeholder: '请输入...',
    defaultValue: '',
    disabled: false,
    required: false,
    maxLength: undefined,
  },
  defaultStyle: {
    width: 240,
    height: 64,
  },
  propertySchema: [
    { key: 'label', label: '标签', type: 'text' },
    { key: 'placeholder', label: '占位符', type: 'text' },
    { key: 'defaultValue', label: '默认值', type: 'expression' },
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
    { key: 'required', label: '必填', type: 'boolean', defaultValue: false },
    { key: 'maxLength', label: '最大长度', type: 'number' },
  ],
  eventDefs: [
    { event: 'onChange', label: '值变化' },
    { event: 'onBlur', label: '失去焦点' },
    { event: 'onFocus', label: '获得焦点' },
  ],
  render: TextInputComponent,
};

export default TextInputDefinition;
