import React from 'react';
import { Button as AntButton } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Button component
const ButtonComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    text = '按钮',
    buttonType = 'default',
    danger = false,
    disabled = false,
    loading = false,
  } = props;

  const isEditMode = mode === 'edit';
  // In edit mode, always enable button for testing; in preview/production, respect disabled prop
  const isDisabled = isEditMode ? false : disabled;
  const isLoading = isEditMode ? false : loading;

  const handleClick = () => {
    if (isEditMode) {
      // In edit mode, don't trigger events - just for visual testing
      return;
    }
    // Trigger onClick event
    triggerComponentEvent(componentId, 'onClick', { value: text });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AntButton
        id={componentId}
        type={buttonType as any}
        danger={danger}
        disabled={isDisabled}
        loading={isLoading}
        onClick={handleClick}
        style={{ width: '100%', height: '100%' }}
      >
        {text}
      </AntButton>
    </div>
  );
};

// Button component definition
export const ButtonDefinition: ComponentDefinition = {
  type: 'Button',
  name: '按钮',
  category: 'action',
  icon: 'ButtonOutlined',
  defaultProps: {
    text: '按钮',
    buttonType: 'default',
    danger: false,
    icon: '',
    disabled: false,
    loading: false,
  },
  defaultStyle: {
    width: 100,
    height: 36,
  },
  propertySchema: [
    { key: 'text', label: '文本', type: 'text', defaultValue: '按钮' },
    { key: 'buttonType', label: '类型', type: 'select', options: [
      { label: '默认', value: 'default' },
      { label: '主要', value: 'primary' },
      { label: '虚线', value: 'dashed' },
      { label: '文本', value: 'text' },
      { label: '链接', value: 'link' },
    ]},
    { key: 'danger', label: '危险', type: 'boolean', defaultValue: false },
    { key: 'icon', label: '图标', type: 'text' },
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
    { key: 'loading', label: '加载中', type: 'boolean', defaultValue: false },
  ],
  eventDefs: [
    { event: 'onClick', label: '点击' },
  ],
  render: ButtonComponent,
};

export default ButtonDefinition;
