import React from 'react';
import { Switch } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Toggle component
const ToggleComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    defaultChecked = false,
    disabled = false,
    checkedText = '开',
    uncheckedText = '关',
  } = props;

  // In edit mode, always enable
  const isDisabled = mode === 'edit' ? false : disabled;

  const handleChange = (checked: boolean) => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onChange', { checked });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4, boxSizing: 'border-box' }}>
      <Switch
        id={componentId}
        defaultChecked={defaultChecked}
        disabled={isDisabled}
        checkedChildren={checkedText}
        unCheckedChildren={uncheckedText}
        onChange={handleChange}
      />
    </div>
  );
};

// Toggle component definition
export const ToggleDefinition: ComponentDefinition = {
  type: 'Toggle',
  name: '开关',
  category: 'action',
  icon: 'SwapOutlined',
  defaultProps: {
    defaultChecked: false,
    disabled: false,
    checkedText: '开',
    uncheckedText: '关',
  },
  defaultStyle: {
    width: 60,
    height: 32,
  },
  propertySchema: [
    { key: 'defaultChecked', label: '默认状态', type: 'expression', defaultValue: false },
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
    { key: 'checkedText', label: '开启文字', type: 'text' },
    { key: 'uncheckedText', label: '关闭文字', type: 'text' },
  ],
  eventDefs: [
    { event: 'onChange', label: '状态变化' },
  ],
  render: ToggleComponent,
};

export default ToggleDefinition;
