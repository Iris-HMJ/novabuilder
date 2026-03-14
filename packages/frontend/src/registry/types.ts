import React from 'react';

// Component category type
export type ComponentCategory = 'data' | 'form' | 'layout' | 'action' | 'media' | 'navigation';

// Category definition
export interface CategoryDef {
  key: ComponentCategory;
  label: string;
  icon: string;
}

// Property field type
export type PropertyFieldType = 'text' | 'number' | 'boolean' | 'select' | 'color' | 'expression' | 'columns' | 'options' | 'datasource' | 'textarea';

// Property field definition
export interface PropertyField {
  key: string;
  label: string;
  type: PropertyFieldType;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  description?: string;
}

// Dynamic binding property
export interface DynamicBinding {
  [propName: string]: string; // e.g., { data: "queries.nova.data" }
}

// Event definition
export interface EventDef {
  event: string;
  label: string;
}

// Component render props
export interface ComponentRenderProps {
  props: Record<string, any>;
  style: Record<string, any>;
  mode: 'edit' | 'preview' | 'production';
  componentId: string;
  // Child components (for containers)
  children?: React.ReactNode;
  // For runtime evaluation
  context?: Record<string, any>;
  queries?: Record<string, any>;
}

// Component definition
export interface ComponentDefinition {
  type: string;
  name: string;
  category: ComponentCategory;
  icon: string;
  defaultProps: Record<string, any>;
  defaultStyle: { width: number; height: number; borderRadius?: number; backgroundColor?: string };
  propertySchema: PropertyField[];
  eventDefs: EventDef[];
  render: React.FC<ComponentRenderProps>;
}

// Categories configuration
export const categories: CategoryDef[] = [
  { key: 'data', label: '数据展示', icon: 'BarChartOutlined' },
  { key: 'form', label: '表单输入', icon: 'FormOutlined' },
  { key: 'layout', label: '布局容器', icon: 'LayoutOutlined' },
  { key: 'action', label: '操作反馈', icon: 'ThunderboltOutlined' },
  { key: 'media', label: '媒体展示', icon: 'PictureOutlined' },
  { key: 'navigation', label: '导航', icon: 'MenuOutlined' },
];
