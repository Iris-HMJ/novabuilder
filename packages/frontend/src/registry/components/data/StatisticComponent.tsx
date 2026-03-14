import React, { useMemo } from 'react';
import { Spin, Card } from 'antd';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';

// Statistic component
const StatisticComponent: React.FC<ComponentRenderProps> = ({ props, style, mode }) => {
  const {
    // Static props (from property panel)
    title = '统计',
    prefix = '',
    suffix = '',
    precision = 0,
    valueStyle = '#1677ff',
    showTrend = false,
    trendThreshold = 0,
    backgroundColor,

    // Dynamic props (from query results - resolved by Canvas)
    value: externalValue,
    previousValue,
    loading = false,
  } = props;

  const isEditMode = mode === 'edit';

  // In edit mode, show sample value
  const displayValue = isEditMode ? 1234 : (externalValue ?? 0);

  // Calculate trend
  const trend = useMemo(() => {
    if (!showTrend || typeof displayValue !== 'number' || typeof previousValue !== 'number') {
      return null;
    }
    const diff = displayValue - previousValue;
    if (diff > trendThreshold) return 'up';
    if (diff < -trendThreshold) return 'down';
    return 'flat';
  }, [displayValue, previousValue, showTrend, trendThreshold]);

  // Calculate change percentage
  const changePercent = useMemo(() => {
    if (!showTrend || typeof displayValue !== 'number' || typeof previousValue !== 'number' || previousValue === 0) {
      return null;
    }
    return ((displayValue - previousValue) / Math.abs(previousValue) * 100).toFixed(1);
  }, [displayValue, previousValue, showTrend]);

  // Loading state
  if (loading) {
    return (
      <Card
        size="small"
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: backgroundColor || '#FFFFFF',
          borderRadius: style?.borderRadius || 8,
          ...style,
        }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Spin size="small" />
      </Card>
    );
  }

  // Trend icon
  const trendIcon = trend === 'up'
    ? <TrendingUp size={14} style={{ color: '#10B981' }} />
    : trend === 'down'
      ? <TrendingDown size={14} style={{ color: '#EF4444' }} />
      : trend === 'flat'
        ? <Minus size={14} style={{ color: '#9CA3AF' }} />
        : null;

  // Format value
  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === '-') return '-';
    if (typeof val === 'number') {
      return val.toLocaleString(undefined, {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      });
    }
    return String(val);
  };

  return (
    <Card
      size="small"
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: backgroundColor || '#FFFFFF',
        borderRadius: style?.borderRadius || 8,
        border: '1px solid #E5E7EB',
        ...style,
      }}
      bodyStyle={{
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      {/* Title */}
      <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8, fontWeight: 500 }}>
        {title}
      </div>

      {/* Value row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {prefix && <span style={{ fontSize: 14, color: '#4B5563' }}>{prefix}</span>}
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: valueStyle || '#1F2937',
            lineHeight: 1.2,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatValue(displayValue)}
        </span>
        {suffix && <span style={{ fontSize: 14, color: '#4B5563', marginLeft: 2 }}>{suffix}</span>}
      </div>

      {/* Trend row */}
      {trend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 8,
            fontSize: 12,
            color: trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#9CA3AF',
          }}
        >
          {trendIcon}
          {changePercent && (
            <span>
              {trend === 'up' ? '+' : ''}{changePercent}%
            </span>
          )}
          <span style={{ color: '#9CA3AF', marginLeft: 4 }}>vs 上期</span>
        </div>
      )}
    </Card>
  );
};

// Statistic component definition
export const StatisticDefinition: ComponentDefinition = {
  type: 'Statistic',
  name: '统计',
  category: 'data',
  icon: 'NumberOutlined',
  defaultProps: {
    title: '统计',
    value: 0,
    prefix: '',
    suffix: '',
    precision: 0,
    valueStyle: '#1677ff',
  },
  defaultStyle: {
    width: 200,
    height: 100,
  },
  propertySchema: [
    { key: 'title', label: '标题', type: 'text' },
    { key: 'value', label: '值', type: 'expression', description: '数值或表达式' },
    { key: 'prefix', label: '前缀', type: 'text' },
    { key: 'suffix', label: '后缀', type: 'text' },
    { key: 'precision', label: '小数位数', type: 'number', defaultValue: 0 },
    { key: 'valueStyle', label: '值颜色', type: 'color', defaultValue: '#1677ff' },
  ],
  eventDefs: [],
  render: StatisticComponent,
};

export default StatisticDefinition;
