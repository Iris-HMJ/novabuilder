import React from 'react';
import { Input } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

const { TextArea } = Input;

// RichText component - simple textarea for now
const RichTextComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    content = '',
    editable = true,
    placeholder = '请输入内容...',
  } = props;

  const isEditMode = mode === 'edit';
  const isEditable = isEditMode || editable;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onChange', { value: e.target.value });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', boxSizing: 'border-box' }}>
      <TextArea
        id={componentId}
        defaultValue={content}
        placeholder={placeholder}
        disabled={!isEditable}
        onChange={handleChange}
        autoSize={{ minRows: 3, maxRows: 10 }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

// RichText component definition
export const RichTextDefinition: ComponentDefinition = {
  type: 'RichText',
  name: '富文本',
  category: 'form',
  icon: 'EditOutlined',
  defaultProps: {
    content: '',
    editable: true,
    placeholder: '请输入内容...',
  },
  defaultStyle: {
    width: 400,
    height: 200,
  },
  propertySchema: [
    { key: 'content', label: '内容', type: 'expression' },
    { key: 'editable', label: '可编辑', type: 'boolean', defaultValue: true },
    { key: 'placeholder', label: '占位符', type: 'text' },
  ],
  eventDefs: [
    { event: 'onChange', label: '内容变化' },
  ],
  render: RichTextComponent,
};

export default RichTextDefinition;
