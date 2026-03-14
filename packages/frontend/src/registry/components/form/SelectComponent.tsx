import React, { useState, useCallback, useMemo } from 'react';
import { Select as AntSelect, Spin } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Select component
const SelectComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    // Static props (from property panel)
    label = '',
    placeholder = '请选择',
    options: staticOptions = [],
    defaultValue,
    mode: selectMode = 'default',
    disabled = false,
    allowClear = true,
    showSearch = true,
    helpText,
    maxCount,

    // Dynamic props (from query results - resolved by Canvas)
    value: externalValue,
    loading = false,
    dynamicOptions,
  } = props;

  // In edit mode, always enable select
  const isEditMode = mode === 'edit';
  const isDisabled = isEditMode ? false : disabled;

  // Controlled/uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = externalValue !== undefined ? externalValue : internalValue;

  // Merge static options and dynamic options (dynamic takes priority)
  const mergedOptions = useMemo(() => {
    // If dynamic options exist and have data, use them
    if (dynamicOptions && Array.isArray(dynamicOptions) && dynamicOptions.length > 0) {
      return dynamicOptions.map((opt: any) => ({
        label: opt.label ?? opt.name ?? String(opt.value ?? opt),
        value: opt.value ?? opt.id ?? opt,
        disabled: opt.disabled,
      }));
    }
    // Otherwise use static options
    return staticOptions.map((opt: any) => ({
      label: opt.label || opt.value,
      value: opt.value,
      disabled: opt.disabled,
    }));
  }, [staticOptions, dynamicOptions]);

  // Default options if no options configured
  const selectOptions = mergedOptions.length > 0 ? mergedOptions : [
    { label: '选项1', value: '1' },
    { label: '选项2', value: '2' },
    { label: '选项3', value: '3' },
  ];

  // Convert mode to antd mode
  const antMode = selectMode === 'single' ? undefined : selectMode === 'tags' ? 'tags' : selectMode === 'multiple' ? 'multiple' : undefined;

  const handleChange = useCallback(
    (value: any, option: any) => {
      if (isEditMode) return;
      setInternalValue(value);
      triggerComponentEvent(componentId, 'onChange', { value, option });
    },
    [isEditMode, componentId]
  );

  return (
    <div
      style={{
        ...style,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: 4,
        boxSizing: 'border-box',
      }}
    >
      {label && (
        <label
          style={{
            fontSize: 12,
            color: '#1F2937',
            flexShrink: 0,
            fontWeight: 500,
          }}
        >
          {label}
        </label>
      )}
      <AntSelect
        id={componentId}
        value={currentValue}
        placeholder={placeholder}
        options={selectOptions}
        mode={antMode}
        disabled={isDisabled}
        loading={loading}
        allowClear={allowClear}
        showSearch={showSearch}
        maxCount={maxCount}
        onChange={handleChange}
        filterOption={(input, option) =>
          String(option?.label ?? '')
            .toLowerCase()
            .includes(input.toLowerCase())
        }
        style={{ width: '100%', flex: 1 }}
        notFoundContent={loading ? <Spin size="small" /> : '无匹配选项'}
      />
      {helpText && (
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
          {helpText}
        </div>
      )}
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
