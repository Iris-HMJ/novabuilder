import React from 'react';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Chart component - placeholder since we don't have a charting library
const ChartComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    chartType = 'line',
    xField = '',
    yField = '',
    title = '',
  } = props;

  const isEditMode = mode === 'edit';

  const chartTypes: Record<string, string> = {
    line: '📈 折线图',
    bar: '📊 柱状图',
    pie: '🥧 饼图',
    area: '📉 面积图',
  };

  const handleClick = () => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onClick', {});
  };

  return (
    <div
      style={{
        ...style,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        border: '1px solid #f0f0f0',
        borderRadius: 4,
        padding: 16,
        boxSizing: 'border-box',
        cursor: isEditMode ? 'default' : 'pointer',
      }}
      onClick={handleClick}
    >
      {title && (
        <div style={{ marginBottom: 12, fontWeight: 500 }}>{title}</div>
      )}
      <div style={{ fontSize: 48, marginBottom: 8 }}>
        {chartTypes[chartType] || '📊'}
      </div>
      <div style={{ color: '#999', fontSize: 12 }}>
        {isEditMode ? '图表预览 (编辑模式)' : '图表数据'}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: '#ccc' }}>
        x: {xField || '-'} / y: {yField || '-'}
      </div>
    </div>
  );
};

// Chart component definition
export const ChartDefinition: ComponentDefinition = {
  type: 'Chart',
  name: '图表',
  category: 'data',
  icon: 'LineChartOutlined',
  defaultProps: {
    chartType: 'line',
    data: '',
    xField: '',
    yField: '',
    title: '',
  },
  defaultStyle: {
    width: 400,
    height: 300,
  },
  propertySchema: [
    { key: 'chartType', label: '图表类型', type: 'select', options: [
      { label: '折线图', value: 'line' },
      { label: '柱状图', value: 'bar' },
      { label: '饼图', value: 'pie' },
      { label: '面积图', value: 'area' },
    ]},
    { key: 'data', label: '数据源', type: 'expression' },
    { key: 'xField', label: 'X轴字段', type: 'text' },
    { key: 'yField', label: 'Y轴字段', type: 'text' },
    { key: 'title', label: '标题', type: 'text' },
  ],
  eventDefs: [
    { event: 'onClick', label: '点击' },
  ],
  render: ChartComponent,
};

export default ChartDefinition;
