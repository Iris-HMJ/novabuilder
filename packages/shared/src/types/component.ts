// Component Types

export type ComponentType =
  | 'Table'
  | 'ListView'
  | 'Chart'
  | 'Stat'
  | 'TextInput'
  | 'NumberInput'
  | 'Select'
  | 'DatePicker'
  | 'FileUpload'
  | 'RichTextEditor'
  | 'Container'
  | 'Tabs'
  | 'Modal'
  | 'Button'
  | 'Toggle'
  | 'Checkbox'
  | 'Spinner'
  | 'Image'
  | 'PDFViewer'
  | 'Sidebar';

export interface ComponentNode {
  id: string;
  type: ComponentType;
  properties: Record<string, any>;
  styles: Record<string, any>;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  events: EventHandler[];
}

export interface EventHandler {
  id: string;
  event: string;
  actions: Action[];
  condition?: string;
}

export type ActionType =
  | 'runQuery'
  | 'setComponentValue'
  | 'navigateTo'
  | 'openModal'
  | 'closeModal'
  | 'showNotification'
  | 'copyToClipboard'
  | 'openURL';

export interface Action {
  id: string;
  type: ActionType;
  params: Record<string, any>;
}

// Component Registry Type
export interface ComponentRegistryItem {
  type: ComponentType;
  defaultProps: Record<string, any>;
  propertySchema: Record<string, any>;
  eventDefs: string[];
}
