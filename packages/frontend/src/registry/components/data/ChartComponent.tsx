import React, { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Dynamic import @ant-design/charts to avoid bundling issues
let Column: any, Line: any, Pie: any, Area: any;
try {
  const charts = require('@ant-design/charts');
  Column = charts.Column;
  Line = charts.Line;
  Pie = charts.Pie;
  Area = charts.Area;
} catch {
  // Charts library not available, will show fallback
}

// Chart component
const ChartComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    // Static props (from property panel)
    chartType = 'bar',
    xField = 'x',
    yField = 'y',
    colorField,
    title = '',
    showLegend = true,
    showLabel = false,
    height: propHeight,

    // Dynamic props (from query results - resolved by Canvas)
    data: rawData,
    loading = false,
  } = props;

  const isEditMode = mode === 'edit';

  // Container height
  const containerHeight = propHeight || style?.height || 300;

  // Process data
  const data = useMemo(() => {
    if (!Array.isArray(rawData) || rawData.length === 0) {
      return isEditMode ? getMockData(chartType) : [];
    }
    return rawData;
  }, [rawData, isEditMode, chartType]);

  // Get mock data for edit mode
  function getMockData(type: string) {
    switch (type) {
      case 'bar':
        return [
          { category: '1月', value: 120 },
          { category: '2月', value: 200 },
          { category: '3月', value: 150 },
          { category: '4月', value: 240 },
          { category: '5月', value: 180 },
        ];
      case 'line':
      case 'area':
        return [
          { month: '1月', sales: 120 },
          { month: '2月', sales: 200 },
          { month: '3月', sales: 150 },
          { month: '4月', sales: 240 },
          { month: '5月', sales: 180 },
        ];
      case 'pie':
        return [
          { type: '分类A', value: 400 },
          { type: '分类B', value: 300 },
          { type: '分类C', value: 300 },
          { type: '分类D', value: 200 },
        ];
      default:
        return [];
    }
  }

  // Determine x/y field names based on data
  const actualXField = useMemo(() => {
    if (data.length > 0) {
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      // Use first string field as xField if not specified
      if (!xField || !keys.includes(xField)) {
        return keys.find(k => typeof firstRow[k] === 'string') || keys[0];
      }
    }
    return xField || 'x';
  }, [data, xField]);

  const actualYField = useMemo(() => {
    if (data.length > 0) {
      const firstRow = data[0];
      const keys = Object.keys(firstRow);
      // Use first number field as yField if not specified
      if (!yField || !keys.includes(yField)) {
        return keys.find(k => typeof firstRow[k] === 'number') || keys[1] || keys[0];
      }
    }
    return yField || 'y';
  }, [data, yField]);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          ...style,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          borderRadius: style?.borderRadius || 8,
          boxSizing: 'border-box',
        }}
      >
        <Spin tip="加载中..." />
      </div>
    );
  }

  // No data state
  if (data.length === 0) {
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
          border: '1px dashed #E5E7EB',
          borderRadius: style?.borderRadius || 8,
          padding: 16,
          boxSizing: 'border-box',
        }}
      >
        {title && (
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1F2937', marginBottom: 16 }}>
            {title}
          </div>
        )}
        <Empty description={isEditMode ? '图表预览' : '暂无图表数据'} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        <div style={{ marginTop: 8, fontSize: 12, color: '#9CA3AF' }}>
          {isEditMode ? '绑定查询数据后将显示图表' : '请绑定查询数据'}
        </div>
      </div>
    );
  }

  // Charts library not installed
  if (!Column || !Line || !Pie) {
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
          border: '1px dashed #E5E7EB',
          borderRadius: style?.borderRadius || 8,
          padding: 16,
          boxSizing: 'border-box',
        }}
      >
        {title && (
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>图表组件</div>
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>请安装 @ant-design/charts</div>
      </div>
    );
  }

  // Common chart config
  const chartHeight = title ? containerHeight - 40 : containerHeight;
  const commonConfig = {
    data,
    height: chartHeight,
    legend: showLegend ? { position: 'top-left' as const } : false,
    label: showLabel ? { position: 'inside' as const } : false,
    animation: { appear: { duration: 300 } },
    theme: {
      color10: [
        '#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
      ],
    },
  };

  // Handle click
  const handleClick = () => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onClick', {});
  };

  // Render chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <Column
            {...commonConfig}
            xField={actualXField}
            yField={actualYField}
            colorField={colorField || actualXField}
          />
        );
      case 'line':
        return (
          <Line
            {...commonConfig}
            xField={actualXField}
            yField={actualYField}
            colorField={colorField}
            point={{ size: 3 }}
            smooth={true}
          />
        );
      case 'area':
        return (
          <Area
            {...commonConfig}
            xField={actualXField}
            yField={actualYField}
            colorField={colorField}
            smooth={true}
          />
        );
      case 'pie':
        return (
          <Pie
            {...commonConfig}
            angleField={actualYField}
            colorField={actualXField}
            label={{
              text: actualXField,
              position: 'outside',
            }}
          />
        );
      case 'doughnut':
        return (
          <Pie
            {...commonConfig}
            angleField={actualYField}
            colorField={actualXField}
            innerRadius={0.6}
            label={{
              text: actualXField,
              position: 'outside',
            }}
          />
        );
      default:
        return (
          <Column
            {...commonConfig}
            xField={actualXField}
            yField={actualYField}
          />
        );
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
        background: '#fff',
        borderRadius: style?.borderRadius || 8,
        padding: 16,
        boxSizing: 'border-box',
        cursor: isEditMode ? 'default' : 'pointer',
      }}
      onClick={handleClick}
    >
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#1F2937',
            marginBottom: 8,
            paddingLeft: 4,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        {renderChart()}
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
