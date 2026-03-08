import React from 'react';
import { Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// FileUpload component
const FileUploadComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId }) => {
  const {
    label = '',
    accept = '*',
    maxCount = 1,
    maxSize,
    buttonText = '点击上传',
    disabled = false,
  } = props;

  // In edit mode, always disable
  const isDisabled = mode === 'edit' ? false : disabled;

  const handleChange = (info: any) => {
    if (mode === 'edit') return;
    triggerComponentEvent(componentId, 'onChange', { fileList: info.fileList });
  };

  return (
    <div style={{ ...style, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 4, padding: 4, boxSizing: 'border-box' }}>
      {label && (
        <label style={{ fontSize: 12, color: '#666', flexShrink: 0 }}>{label}</label>
      )}
      <Upload
        id={componentId}
        accept={accept}
        maxCount={maxCount}
        disabled={isDisabled}
        beforeUpload={(file) => {
          if (maxSize && file.size > maxSize * 1024 * 1024) {
            return false;
          }
          return false; // Prevent upload in editor
        }}
        onChange={handleChange}
      >
        <Button icon={<UploadOutlined />} disabled={isDisabled}>
          {buttonText}
        </Button>
      </Upload>
      {maxSize && (
        <span style={{ fontSize: 11, color: '#999' }}>最大 {maxSize} MB</span>
      )}
    </div>
  );
};

// FileUpload component definition
export const FileUploadDefinition: ComponentDefinition = {
  type: 'FileUpload',
  name: '文件上传',
  category: 'form',
  icon: 'UploadOutlined',
  defaultProps: {
    label: '',
    accept: '*',
    maxCount: 1,
    maxSize: undefined,
    buttonText: '点击上传',
    disabled: false,
  },
  defaultStyle: {
    width: 240,
    height: 100,
  },
  propertySchema: [
    { key: 'label', label: '标签', type: 'text' },
    { key: 'accept', label: '接受类型', type: 'text', defaultValue: '*', description: '如 .pdf,.doc 或 image/*' },
    { key: 'maxCount', label: '最大数量', type: 'number', defaultValue: 1 },
    { key: 'maxSize', label: '最大大小(MB)', type: 'number' },
    { key: 'buttonText', label: '按钮文字', type: 'text', defaultValue: '点击上传' },
    { key: 'disabled', label: '禁用', type: 'boolean', defaultValue: false },
  ],
  eventDefs: [
    { event: 'onChange', label: '文件变化' },
  ],
  render: FileUploadComponent,
};

export default FileUploadDefinition;
