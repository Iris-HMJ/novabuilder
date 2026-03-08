import React from 'react';
import { Checkbox } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Checkbox component
const CheckboxComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    label = '选项',
    defaultChecked = false,
    disabled = false,
  } = props;

  // In edit mode, always enable
  const isDisabled = mode === 'edit' ? false : disabled;

  const handleChange = (e: any) => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onChange', { checked: e.target.checked });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', padding: 4, boxSizing: 'border-box' }}>
      <Checkbox
        id={componentId}
        defaultChecked={defaultChecked}
        disabled={isDisabled}
        onChange={handleChange}
      >
        {label}
      </Checkbox>
    </div>
  );
};

// Checkbox component definition
export const CheckboxDefinition: ComponentDefinition = {
  type: 'Checkbox',
  name: '复选框',
  category: 'action',
  icon: 'CheckSquareOutlined',
  defaultProps: {
    label: '选项',
    defaultChecked: false,
    disabled: false,
  },
  defaultStyle: {
    width: 120,
    height: 32,
  },
  propertySchema: [
    { key: 'label', label: '标签', type: 'text', defaultValue: '选项' },
    { key: 'defaultChecked', label: '默认勾选', type: 'expression', defaultValue: false },
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
  ],
  eventDefs: [
    { event: 'onChange', label: '状态变化' },
  ],
  render: CheckboxComponent,
};

export default CheckboxDefinition;
