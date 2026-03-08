import React from 'react';
import { Image } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Image component
const ImageComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    src = '',
    alt = '',
    objectFit = 'contain',
    fallback,
  } = props;

  const isEditMode = mode === 'edit';

  // In edit mode, show placeholder
  const imageSrc = isEditMode || !src
    ? 'https://via.placeholder.com/300x200?text=图片'
    : src;

  const handleClick = () => {
    if (isEditMode) return;
    triggerComponentEvent(componentId, 'onClick', {});
  };

  return (
    <div
      style={{ ...style, width: '100%', height: '100%', overflow: 'hidden', boxSizing: 'border-box' }}
      onClick={handleClick}
    >
      <Image
        src={imageSrc}
        alt={alt}
        style={{ width: '100%', height: '100%', objectFit }}
        fallback={fallback}
        preview={!isEditMode}
      />
    </div>
  );
};

// Image component definition
export const ImageDefinition: ComponentDefinition = {
  type: 'Image',
  name: '图片',
  category: 'media',
  icon: 'PictureOutlined',
  defaultProps: {
    src: '',
    alt: '',
    objectFit: 'contain',
    fallback: undefined,
  },
  defaultStyle: {
    width: 300,
    height: 200,
  },
  propertySchema: [
    { key: 'src', label: '图片地址', type: 'expression' },
    { key: 'alt', label: '替代文本', type: 'text' },
    { key: 'objectFit', label: '填充模式', type: 'select', options: [
      { label: '包含', value: 'contain' },
      { label: '覆盖', value: 'cover' },
      { label: '拉伸', value: 'fill' },
      { label: '无', value: 'none' },
    ]},
    { key: 'fallback', label: '失败时图片', type: 'text' },
  ],
  eventDefs: [
    { event: 'onClick', label: '点击' },
  ],
  render: ImageComponent,
};

export default ImageDefinition;
