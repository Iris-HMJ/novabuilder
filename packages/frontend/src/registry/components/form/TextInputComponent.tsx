import React, { useState, useCallback, useEffect } from 'react';
import { Input } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// TextInput component
const TextInputComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    // Static props (from property panel)
    label = '',
    placeholder = '请输入',
    defaultValue = '',
    disabled = false,
    required = false,
    maxLength,
    type = 'text',
    rows = 4,
    showCount = false,
    helpText,

    // Dynamic props (from query results - resolved by Canvas)
    value: externalValue,
    loading = false,
  } = props;

  // In edit mode, always enable input; in preview/production, respect disabled prop
  const isEditMode = mode === 'edit';
  const isDisabled = isEditMode ? false : disabled;

  // Controlled/uncontrolled mode
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = externalValue !== undefined ? externalValue : internalValue;

  useEffect(() => {
    if (defaultValue && !externalValue) {
      setInternalValue(defaultValue);
    }
  }, [defaultValue, externalValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (isEditMode) return;
      const val = e.target.value;
      setInternalValue(val);
      triggerComponentEvent(componentId, 'onChange', { value: val });
    },
    [isEditMode, componentId]
  );

  const handleBlur = useCallback(() => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onBlur', { value: currentValue });
  }, [isEditMode, currentValue, componentId]);

  const handleFocus = useCallback(() => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onFocus', { value: currentValue });
  }, [isEditMode, currentValue, componentId]);

  const handlePressEnter = useCallback(() => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onPressEnter', { value: currentValue });
  }, [isEditMode, currentValue, componentId]);

  // Common input props
  const inputProps = {
    value: currentValue,
    placeholder,
    disabled: isDisabled || loading,
    maxLength,
    showCount,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    style: { width: '100%' },
  };

  // Render different input types
  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return <Input.TextArea {...inputProps} rows={rows} autoSize={false} />;
      case 'password':
        return <Input.Password {...inputProps} onPressEnter={handlePressEnter} />;
      case 'email':
        return <Input {...inputProps} type="email" onPressEnter={handlePressEnter} />;
      default:
        return <Input {...inputProps} onPressEnter={handlePressEnter} />;
    }
  };

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
          {required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
        </label>
      )}
      {renderInput()}
      {helpText && (
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
          {helpText}
        </div>
      )}
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
