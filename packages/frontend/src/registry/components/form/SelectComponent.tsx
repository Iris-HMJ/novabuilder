import React from 'react';
import { Select } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Select component
const SelectComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    label = '',
    placeholder = '请选择',
    options = [],
    defaultValue,
    mode: selectMode = 'default',
    disabled = false,
    allowClear = false,
  } = props;

  // In edit mode, always enable select
  const isDisabled = mode === 'edit' ? false : disabled;

  // Convert options to Select options format
  const selectOptions = Array.isArray(options) && options.length > 0
    ? options.map((opt: any) => ({
        label: opt.label || opt.value,
        value: opt.value,
      }))
    : [
        { label: '选项1', value: '1' },
        { label: '选项2', value: '2' },
        { label: '选项3', value: '3' },
      ];

  const handleChange = (value: any) => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onChange', { value });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: 4, boxSizing: 'border-box' }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>{label}</label>
      )}
      <Select
        id={componentId}
        placeholder={placeholder}
        defaultValue={defaultValue}
        options={selectOptions}
        mode={selectMode === 'multiple' ? 'multiple' : selectMode === 'tags' ? 'tags' : undefined}
        disabled={isDisabled}
        allowClear={allowClear}
        onChange={handleChange}
        style={{ width: '100%', flex: 1 }}
      />
    </div>
  );
};

// Select component definition
export const SelectDefinition: ComponentDefinition = {
  type: 'Select',
  name: '选择器',
  category: 'form',
  icon: 'SelectOutlined',
  defaultProps: {
    label: '',
    placeholder: '请选择',
    options: [],
    defaultValue: undefined,
    mode: 'default',
    disabled: false,
    allowClear: false,
  },
  defaultStyle: {
    width: 240,
    height: 64,
  },
  propertySchema: [
    { key: 'label', label: '标签', type: 'text' },
    { key: 'placeholder', label: '占位符', type: 'text' },
    { key: 'options', label: '选项', type: 'options' },
    { key: 'defaultValue', label: '默认值', type: 'expression' },
    { key: 'mode', label: '模式', type: 'select', options: [
      { label: '单选', value: 'default' },
      { label: '多选', value: 'multiple' },
      { label: '标签', value: 'tags' },
    ]},
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
    { key: 'allowClear', label: '可清除', type: 'boolean', defaultValue: false },
  ],
  eventDefs: [
    { event: 'onChange', label: '值变化' },
  ],
  render: SelectComponent,
};

export default SelectDefinition;
