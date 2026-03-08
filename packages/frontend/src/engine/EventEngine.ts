import { message } from 'antd';
import type { EventAction } from '@novabuilder/shared';
import { queryApi } from '../api/query';
import { useEditorStore } from '../stores/editorStore';
import { useQueryStore } from '../stores/queryStore';

interface ActionContext {
  appId: string;
  pageId: string;
  componentId: string;
  event: string;
  // Context data from the event (e.g., clicked row data)
  eventData?: Record<string, any>;
}

// Execute a single action
export const executeAction = async (
  action: EventAction,
  _context: ActionContext
): Promise<void> => {
  const { appDefinition, updateComponent } = useEditorStore.getState();
  const { setQueryResult, setExecuting } = useQueryStore.getState();

  switch (action.type) {
    case 'runQuery': {
      const { queryName } = action.config;
      if (!queryName) {
        message.error('未选择查询');
        return;
      }

      try {
        setExecuting(true);
        const result = await queryApi.execute(queryName);

        if (result.error) {
          message.error(`查询执行失败: ${result.error}`);
        } else {
          // Store the result in query store
          setQueryResult(queryName, result);
          message.success('查询执行成功');
        }
      } catch (error) {
        message.error(`查询执行失败: ${error}`);
      } finally {
        setExecuting(false);
      }
      break;
    }

    case 'setComponentValue': {
      const { targetComponentId, targetProp, targetValue } = action.config;
      if (!targetComponentId) {
        message.error('未选择目标组件');
        return;
      }

      // Evaluate expression if it's a binding expression
      let value = targetValue;
      if (typeof targetValue === 'string' && targetValue.startsWith('{{') && targetValue.endsWith('}}')) {
        // For now, just use the expression as-is
        // In a full implementation, we'd evaluate this in a sandbox
        value = targetValue;
      }

      updateComponent(targetComponentId, {
        props: { [targetProp || 'value']: value },
      });
      message.success('组件值已更新');
      break;
    }

    case 'navigateTo': {
      const { pageId } = action.config;
      if (!pageId) {
        message.error('未选择目标页面');
        return;
      }

      const page = appDefinition.pages.find(p => p.id === pageId);
      if (page) {
        // Dispatch navigation event
        window.dispatchEvent(new CustomEvent('navigate-to-page', { detail: { pageId } }));
      }
      break;
    }

    case 'showNotification': {
      const { notificationType = 'info', message: notificationMessage } = action.config;
      switch (notificationType) {
        case 'success':
          message.success(notificationMessage);
          break;
        case 'error':
          message.error(notificationMessage);
          break;
        case 'warning':
          message.warning(notificationMessage);
          break;
        default:
          message.info(notificationMessage);
      }
      break;
    }

    case 'openModal': {
      const { componentId } = action.config;
      if (!componentId) {
        message.error('未选择弹窗组件');
        return;
      }

      // Update modal component to be visible
      updateComponent(componentId, {
        props: { ...{ visible: true } },
      });
      break;
    }

    case 'closeModal': {
      const { componentId } = action.config;
      if (!componentId) {
        message.error('未选择弹窗组件');
        return;
      }

      // Update modal component to be hidden
      updateComponent(componentId, {
        props: { ...{ visible: false } },
      });
      break;
    }

    case 'copyToClipboard': {
      const { content } = action.config;
      if (!content) {
        message.error('未提供复制内容');
        return;
      }

      try {
        // Extract expression if it's a binding
        let textToCopy = content;
        if (typeof content === 'string' && content.startsWith('{{') && content.endsWith('}}')) {
          textToCopy = content;
        }

        await navigator.clipboard.writeText(textToCopy);
        message.success('已复制到剪贴板');
      } catch (error) {
        message.error('复制失败');
      }
      break;
    }

    case 'openUrl': {
      const { content: url } = action.config;
      if (!url) {
        message.error('未提供 URL');
        return;
      }

      window.open(url, '_blank');
      break;
    }

    default:
      console.warn('Unknown action type:', action.type);
  }
};

// Execute all actions for an event
export const executeEventActions = async (
  actions: EventAction[],
  context: ActionContext
): Promise<void> => {
  for (const action of actions) {
    await executeAction(action, context);
  }
};

// Trigger an event on a component
export const triggerComponentEvent = async (
  componentId: string,
  eventName: string,
  eventData?: Record<string, any>
): Promise<void> => {
  const { appId, appDefinition } = useEditorStore.getState();

  // Find the component and its event handlers
  for (const page of appDefinition.pages) {
    const component = page.components.find(c => c.id === componentId);
    if (component && component.events) {
      const handler = component.events.find(e => e.event === eventName);
      if (handler && handler.actions && handler.actions.length > 0) {
        // Check condition if present
        if (handler.condition) {
          // For now, allow all - in full implementation, evaluate condition
          // const shouldExecute = evaluateExpression(handler.condition, context);
          // if (!shouldExecute) return;
        }

        await executeEventActions(handler.actions, {
          appId: appId || '',
          pageId: page.id,
          componentId,
          event: eventName,
          eventData,
        });
      }
    }
  }
};
