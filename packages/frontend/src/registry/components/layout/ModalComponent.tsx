import React, { useState } from 'react';
import { Modal as AntModal, Button } from 'antd';
import type { ComponentDefinition, ComponentRenderProps } from '../../types';
import { triggerComponentEvent } from '../../../engine/EventEngine';

// Modal component
const ModalComponent: React.FC<ComponentRenderProps> = ({ props, style, mode, componentId, children }) => {
  const {
    title = '弹窗标题',
    visible = false,
    width = 520,
    closable = true,
    maskClosable = true,
  } = props;

  const isEditMode = mode === 'edit';
  const [isVisible, setIsVisible] = useState(isEditMode ? false : visible);

  const showModal = () => setIsVisible(true);
  const handleCancel = () => {
    setIsVisible(false);
    if (!isEditMode) {
      triggerComponentEvent(componentId, 'onClose', {});
    }
  };

  // In edit mode, show a trigger button
  if (isEditMode) {
    return (
      <div style={{ ...style, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Button onClick={showModal}>打开弹窗</Button>
        <AntModal
          title={title}
          open={isVisible}
          width={width}
          closable={closable}
          maskClosable={maskClosable}
          onCancel={handleCancel}
          footer={null}
        >
          {children || (
            <div style={{ padding: 20, color: '#ccc', textAlign: 'center' }}>
              弹窗内容区域
            </div>
          )}
        </AntModal>
      </div>
    );
  }

  // In preview/production mode, just render the modal (controlled by visible prop)
  return (
    <AntModal
      title={title}
      open={visible}
      width={width}
      closable={closable}
      maskClosable={maskClosable}
      onCancel={handleCancel}
      footer={null}
    >
      {children || (
        <div style={{ padding: 20, color: '#ccc', textAlign: 'center' }}>
          弹窗内容区域
        </div>
      )}
    </AntModal>
  );
};

// Modal component definition
export const ModalDefinition: ComponentDefinition = {
  type: 'Modal',
  name: '弹窗',
  category: 'layout',
  icon: 'ModalOutlined',
  defaultProps: {
    title: '弹窗标题',
    visible: false,
    width: 520,
    closable: true,
    maskClosable: true,
  },
  defaultStyle: {
    width: 100,
    height: 36,
  },
  propertySchema: [
    { key: 'title', label: '标题', type: 'text', defaultValue: '弹窗标题' },
    { key: 'visible', label: '初始可见', type: 'expression', defaultValue: false },
    { key: 'width', label: '宽度', type: 'number', defaultValue: 520 },
    { key: 'closable', label: '显示关闭按钮', type: 'boolean', defaultValue: true },
    { key: 'maskClosable', label: '点击遮罩关闭', type: 'boolean', defaultValue: true },
  ],
  eventDefs: [
    { event: 'onClose', label: '关闭' },
  ],
  render: ModalComponent,
};

export default ModalDefinition;
