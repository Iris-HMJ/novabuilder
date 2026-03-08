import React from 'react';
import { DatePicker } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// DatePicker component
const DatePickerComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    label = '',
    placeholder = '选择日期',
    defaultValue,
    format = 'YYYY-MM-DD',
    showTime = false,
    disabled = false,
  } = props;

  // In edit mode, always enable
  const isDisabled = mode === 'edit' ? false : disabled;

  const handleChange = (date: any, dateString: string | string[]) => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onChange', { value: date, dateString });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: 4, boxSizing: 'border-box' }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>{label}</label>
      )}
      <DatePicker
        id={componentId}
        placeholder={placeholder}
        defaultValue={defaultValue}
        format={format}
        showTime={showTime}
        disabled={isDisabled}
        onChange={handleChange}
        style={{ width: '100%', flex: 1 }}
      />
    </div>
  );
};

// DatePicker component definition
export const DatePickerDefinition: ComponentDefinition = {
  type: 'DatePicker',
  name: '日期选择',
  category: 'form',
  icon: 'CalendarOutlined',
  defaultProps: {
    label: '',
    placeholder: '选择日期',
    defaultValue: undefined,
    format: 'YYYY-MM-DD',
    showTime: false,
    disabled: false,
  },
  defaultStyle: {
    width: 240,
    height: 64,
  },
  propertySchema: [
    { key: 'label', label: '标签', type: 'text' },
    { key: 'placeholder', label: '占位符', type: 'text' },
    { key: 'defaultValue', label: '默认值', type: 'expression' },
    { key: 'format', label: '格式', type: 'text', defaultValue: 'YYYY-MM-DD' },
    { key: 'showTime', label: '显示时间', type: 'boolean', defaultValue: false },
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
  ],
  eventDefs: [
    { event: 'onChange', label: '值变化' },
  ],
  render: DatePickerComponent,
};

export default DatePickerDefinition;
