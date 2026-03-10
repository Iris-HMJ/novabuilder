import React, { useState, useCallback } from 'react';
import { Tabs, Empty, Form, Input, InputNumber, Select, Switch, Button, Space, Typography, Tooltip, Modal, ColorPicker } from 'antd';
import {
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/editorStore';
import { registry, PropertyField } from '../../registry';
import { ExpressionInput, ColumnsEditor, OptionsEditor } from './components';
import type { EventAction, ActionType } from '@novabuilder/shared';

const { Text } = Typography;

type RightPanelTab = 'properties' | 'styles' | 'events';

// Action types mapping for display
const actionTypeLabels: Record<ActionType, string> = {
  runQuery: '执行查询',
  setComponentValue: '设置组件值',
  navigateTo: '导航页面',
  showNotification: '显示通知',
  openModal: '打开弹窗',
  closeModal: '关闭弹窗',
  copyToClipboard: '复制到剪贴板',
  openUrl: '打开链接',
};

const RightPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('properties');
  const [panelExpanded, setPanelExpanded] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [actionForm] = Form.useForm();

  const {
    updateComponent,
    updateComponentStyle,
    appDefinition,
    selectedComponentIds,
    currentPageId,
  } = useEditorStore();

  // Get selected components with proper reactivity
  const selectedComponents = React.useMemo(() => {
    if (!currentPageId) return [];
    const page = appDefinition.pages.find(p => p.id === currentPageId);
    if (!page) return [];
    return page.components.filter(c => selectedComponentIds.includes(c.id));
  }, [appDefinition, currentPageId, selectedComponentIds]);

  const selectedComponent = selectedComponents.length === 1 ? selectedComponents[0] : null;

  // Get component definition from registry
  const componentDef = selectedComponent ? registry.get(selectedComponent.type) : null;

  // Auto-expand panel when component is selected
  React.useEffect(() => {
    if (selectedComponent && !panelExpanded) {
      setPanelExpanded(true);
    }
  }, [selectedComponent, panelExpanded]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPanelExpanded(!panelExpanded);
  };

  // Render property field based on type
  const renderPropertyField = useCallback((field: PropertyField) => {
    const value = selectedComponent?.props[field.key] ?? field.defaultValue;

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: e.target.value }
            })}
            placeholder={field.description}
          />
        );

      case 'number':
        return (
          <InputNumber
            value={value}
            onChange={(val) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: val }
            })}
            style={{ width: '100%' }}
          />
        );

      case 'boolean':
        return (
          <Switch
            checked={value}
            onChange={(checked) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: checked }
            })}
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onChange={(val) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: val }
            })}
            options={field.options}
            style={{ width: '100%' }}
          />
        );

      case 'color':
        return (
          <ColorPicker
            value={value || '#ffffff'}
            onChange={(color) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: color.toHexString() }
            })}
          />
        );

      case 'expression':
        return (
          <ExpressionInput
            value={value}
            onChange={(val) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: val }
            })}
            placeholder={field.description || '输入文本或 {{ expression }}'}
          />
        );

      case 'columns':
        return (
          <ColumnsEditor
            value={value}
            onChange={(columns) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: columns }
            })}
          />
        );

      case 'options':
        return (
          <OptionsEditor
            value={value}
            onChange={(options) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: options }
            })}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => updateComponent(selectedComponent!.id, {
              props: { ...selectedComponent!.props, [field.key]: e.target.value }
            })}
          />
        );
    }
  }, [selectedComponent, updateComponent]);

  // Render when no component selected
  const renderEmpty = () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <SettingOutlined style={{ fontSize: 32, color: '#d9d9d9', marginBottom: 12 }} />
      <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>选择组件以编辑属性</Text>
    </div>
  );

  // Render properties tab
  const renderPropertiesTab = () => {
    if (!selectedComponent || !componentDef) return renderEmpty();

    const propertyFields = componentDef.propertySchema || [];

    return (
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Text strong>{componentDef.name}</Text>
          </Space>
        </div>
        <Form layout="vertical" size="small">
          <Form.Item label="组件名称">
            <Input
              value={selectedComponent.name}
              onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
            />
          </Form.Item>

          {propertyFields.map((field) => (
            <Form.Item key={field.key} label={field.label}>
              {renderPropertyField(field)}
            </Form.Item>
          ))}

          {propertyFields.length === 0 && (
            <Text type="secondary">该组件暂无属性配置</Text>
          )}
        </Form>
      </div>
    );
  };

  // Render styles tab
  const renderStylesTab = () => {
    if (!selectedComponent) return renderEmpty();

    const { style } = selectedComponent;

    const handleStyleChange = (key: string, value: any) => {
      updateComponentStyle(selectedComponent.id, { [key]: value });
    };

    return (
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>样式</Text>
        </div>
        <Form layout="vertical" size="small">
          <Text type="secondary" style={{ fontSize: 11 }}>布局</Text>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Form.Item label="X" style={{ flex: 1 }}>
              <InputNumber
                value={style.x}
                onChange={(val) => handleStyleChange('x', val)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="Y" style={{ flex: 1 }}>
              <InputNumber
                value={style.y}
                onChange={(val) => handleStyleChange('y', val)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <Form.Item label="宽度" style={{ flex: 1 }}>
              <InputNumber
                value={style.width}
                onChange={(val) => handleStyleChange('width', val)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="高度" style={{ flex: 1 }}>
              <InputNumber
                value={style.height}
                onChange={(val) => handleStyleChange('height', val)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>

          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 12 }}>外观</Text>
          <Form.Item label="背景色">
            <ColorPicker
              value={style.backgroundColor || '#ffffff'}
              onChange={(color) => handleStyleChange('backgroundColor', color.toHexString())}
            />
          </Form.Item>
          <div style={{ display: 'flex', gap: 8 }}>
            <Form.Item label="圆角" style={{ flex: 1 }}>
              <InputNumber
                value={style.borderRadius || 0}
                onChange={(val) => handleStyleChange('borderRadius', val)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="边框宽" style={{ flex: 1 }}>
              <InputNumber
                value={style.borderWidth || 0}
                onChange={(val) => handleStyleChange('borderWidth', val)}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </div>
          <Form.Item label="边框样式">
            <Select
              value={style.borderStyle || 'solid'}
              onChange={(val) => handleStyleChange('borderStyle', val)}
              options={[
                { label: '实线', value: 'solid' },
                { label: '虚线', value: 'dashed' },
                { label: '点线', value: 'dotted' },
                { label: '无', value: 'none' },
              ]}
            />
          </Form.Item>
          <Form.Item label="边框颜色">
            <ColorPicker
              value={style.borderColor || '#d9d9d9'}
              onChange={(color) => handleStyleChange('borderColor', color.toHexString())}
            />
          </Form.Item>

          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 12 }}>可见性</Text>
          <Form.Item label="条件表达式">
            <ExpressionInput
              value={style.visible || ''}
              onChange={(val) => handleStyleChange('visible', val)}
              placeholder="currentUser.role === 'admin'"
            />
          </Form.Item>
        </Form>
      </div>
    );
  };

  // Render events tab
  const renderEventsTab = () => {
    if (!selectedComponent || !componentDef) return renderEmpty();

    const eventDefs = componentDef.eventDefs || [];
    const events = selectedComponent.events || [];

    const handleAddEvent = (eventName: string) => {
      setSelectedEvent(eventName);
      setActionModalVisible(true);
    };

    const handleSaveAction = (values: any) => {
      const action: EventAction = {
        id: `action_${Date.now()}`,
        type: values.type as ActionType,
        config: { ...values },
      };

      const newEvents = [...events];
      const existingEvent = newEvents.find(e => e.event === selectedEvent);
      if (existingEvent) {
        existingEvent.actions.push(action);
      } else {
        newEvents.push({
          event: selectedEvent,
          actions: [action],
        });
      }
      updateComponent(selectedComponent.id, { events: newEvents });
      setActionModalVisible(false);
      actionForm.resetFields();
    };

    const handleDeleteAction = (eventName: string, actionId: string) => {
      const newEvents = events.map(e => {
        if (e.event === eventName) {
          return { ...e, actions: e.actions.filter(a => a.id !== actionId) };
        }
        return e;
      }).filter(e => e.actions.length > 0);
      updateComponent(selectedComponent.id, { events: newEvents });
    };

    return (
      <div style={{ padding: 12 }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>事件</Text>
        </div>

        {eventDefs.length === 0 ? (
          <Empty description="该组件暂无事件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          eventDefs.map((eventDef) => {
            const eventConfig = events.find(e => e.event === eventDef.event);
            const actions = eventConfig?.actions || [];

            return (
              <div key={eventDef.event} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text strong>{eventDef.label}</Text>
                  <Button
                    type="primary"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddEvent(eventDef.event)}
                  >
                    添加动作
                  </Button>
                </div>

                {actions.length === 0 ? (
                  <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4, fontSize: 12, color: '#999' }}>
                    暂无动作配置
                  </div>
                ) : (
                  actions.map((action) => (
                    <div
                      key={action.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 8,
                        background: '#f5f5f5',
                        borderRadius: 4,
                        marginBottom: 4,
                        fontSize: 12,
                      }}
                    >
                      <div>
                        <PlayCircleOutlined style={{ marginRight: 4 }} />
                        {getActionDescription(action)}
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDeleteAction(eventDef.event, action.id)}
                      />
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}

        {/* Action Modal */}
        <Modal
          title="添加动作"
          open={actionModalVisible}
          onCancel={() => {
            setActionModalVisible(false);
            actionForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={actionForm}
            layout="vertical"
            onFinish={handleSaveAction}
          >
            <Form.Item
              name="type"
              label="动作类型"
              rules={[{ required: true, message: '请选择动作类型' }]}
            >
              <Select
                placeholder="选择动作"
                options={[
                  { label: '执行查询', value: 'runQuery' },
                  { label: '设置组件值', value: 'setComponentValue' },
                  { label: '导航页面', value: 'navigateTo' },
                  { label: '显示通知', value: 'showNotification' },
                  { label: '打开弹窗', value: 'openModal' },
                  { label: '关闭弹窗', value: 'closeModal' },
                  { label: '复制到剪贴板', value: 'copyToClipboard' },
                  { label: '打开链接', value: 'openUrl' },
                ]}
              />
            </Form.Item>

            <Form.Item shouldUpdate>
              {() => {
                const actionType = actionForm.getFieldValue('type');
                return renderActionConfig(actionType);
              }}
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                保存
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  // Render action config based on type
  const renderActionConfig = (actionType: string) => {
    switch (actionType) {
      case 'runQuery':
        return (
          <Form.Item name="queryName" label="查询" rules={[{ required: true }]}>
            <Select
              placeholder="选择查询"
              options={[
                // TODO: Load from queryStore
                { label: '查询1', value: 'query1' },
              ]}
            />
          </Form.Item>
        );

      case 'showNotification':
        return (
          <>
            <Form.Item name="notificationType" label="类型" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: '成功', value: 'success' },
                  { label: '错误', value: 'error' },
                  { label: '信息', value: 'info' },
                  { label: '警告', value: 'warning' },
                ]}
              />
            </Form.Item>
            <Form.Item name="message" label="消息内容" rules={[{ required: true }]}>
              <Input placeholder="请输入消息内容" />
            </Form.Item>
          </>
        );

      case 'navigateTo':
        return (
          <Form.Item name="pageId" label="目标页面" rules={[{ required: true }]}>
            <Select
              placeholder="选择页面"
              options={appDefinition.pages.map(p => ({ label: p.name, value: p.id }))}
            />
          </Form.Item>
        );

      case 'openModal':
      case 'closeModal':
        const modalComponents = appDefinition.pages
          .flatMap(p => p.components)
          .filter(c => c.type === 'Modal');
        return (
          <Form.Item name="componentId" label="弹窗组件" rules={[{ required: true }]}>
            <Select
              placeholder="选择弹窗"
              options={modalComponents.map(c => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
        );

      case 'setComponentValue':
        const allComponents = appDefinition.pages.flatMap(p => p.components);
        return (
          <>
            <Form.Item name="targetComponentId" label="目标组件" rules={[{ required: true }]}>
              <Select
                placeholder="选择组件"
                options={allComponents.map(c => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item name="targetProp" label="属性名">
              <Input placeholder="如: value, checked" />
            </Form.Item>
            <Form.Item name="targetValue" label="值">
              <ExpressionInput placeholder="输入值或 {{ expression }}" />
            </Form.Item>
          </>
        );

      case 'copyToClipboard':
      case 'openUrl':
        return (
          <Form.Item name="content" label={actionType === 'openUrl' ? 'URL' : '内容'} rules={[{ required: true }]}>
            <ExpressionInput placeholder={actionType === 'openUrl' ? 'https://...' : '复制的内容'} />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  // Get human-readable action description
  const getActionDescription = (action: EventAction): string => {
    const typeLabel = actionTypeLabels[action.type] || action.type;

    switch (action.type) {
      case 'runQuery':
        return `${typeLabel}: ${action.config.queryName || '未选择'}`;
      case 'showNotification':
        return `${typeLabel}: ${action.config.message || ''}`;
      case 'navigateTo':
        const page = appDefinition.pages.find(p => p.id === action.config.pageId);
        return `${typeLabel}: ${page?.name || '未选择'}`;
      default:
        return typeLabel;
    }
  };

  const tabItems = [
    { key: 'properties', label: '属性', children: renderPropertiesTab() },
    { key: 'styles', label: '样式', children: renderStylesTab() },
    { key: 'events', label: '事件', children: renderEventsTab() },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Expandable Content Panel - 320px width */}
      <div
        style={{
          width: panelExpanded ? 320 : 0,
          background: '#fff',
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 320, height: '100%', display: 'flex', flexDirection: 'column', padding: '0 12px' }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as RightPanelTab)}
            size="small"
            tabPosition="top"
            items={tabItems}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          />
        </div>
      </div>

      {/* Icon Navigation Bar - 48px width */}
      <div
        style={{
          width: 48,
          background: '#fff',
          borderLeft: '1px solid #e8e8e8',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          boxShadow: panelExpanded ? '-2px 0 8px rgba(0, 0, 0, 0.1)' : 'none',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        <Tooltip title="属性设置" placement="left">
          <div
            onClick={handleToggle}
            style={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              background: panelExpanded ? '#e6f7ff' : 'transparent',
              color: panelExpanded ? '#1677ff' : '#595959',
              borderRight: panelExpanded ? '3px solid #1677ff' : '3px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <SettingOutlined style={{ fontSize: 20 }} />
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default RightPanel;
