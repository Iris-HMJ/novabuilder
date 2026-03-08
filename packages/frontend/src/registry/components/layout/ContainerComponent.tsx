import React from 'react';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';

// Container component - wrapper for grouping components
const ContainerComponent: React.FC<ComponentRenderProps> = ({ props, style, children, mode }) => {
  const {
    padding = 16,
    showBorder = true,
    borderColor = '#e8e8e8',
    backgroundColor = '#fff',
  } = props;

  const isEditMode = mode === 'edit';

  return (
    <div
      style={{
        ...style,
        width: '100%',
        height: '100%',
        padding,
        backgroundColor,
        border: showBorder ? `1px solid ${borderColor}` : 'none',
        borderRadius: 4,
        boxSizing: 'border-box',
        minHeight: 100,
      }}
    >
      {isEditMode && !children && (
        <div style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ccc',
          border: '2px dashed #e8e8e8',
          borderRadius: 4,
        }}>
          容器区域
        </div>
      )}
      {children}
    </div>
  );
};

// Container component definition
export const ContainerDefinition: ComponentDefinition = {
  type: 'Container',
  name: '容器',
  category: 'layout',
  icon: 'BorderOutlined',
  defaultProps: {
    padding: 16,
    showBorder: true,
    borderColor: '#e8e8e8',
    backgroundColor: '#fff',
  },
  defaultStyle: {
    width: 400,
    height: 300,
  },
  propertySchema: [
    { key: 'padding', label: '内边距', type: 'number', defaultValue: 16 },
    { key: 'showBorder', label: '显示边框', type: 'boolean', defaultValue: true },
    { key: 'borderColor', label: '边框颜色', type: 'color', defaultValue: '#e8e8e8' },
    { key: 'backgroundColor', label: '背景色', type: 'color', defaultValue: '#ffffff' },
  ],
  eventDefs: [],
  render: ContainerComponent,
};

export default ContainerDefinition;
