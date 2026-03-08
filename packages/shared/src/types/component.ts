// ============== Step 6.1: Editor Component Types ==============

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

// Component style for positioning and appearance
export interface ComponentStyle {
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  boxShadow?: string;
  visible?: string; // Visibility expression, e.g., "currentUser.role === 'admin'"
  padding?: number;
  margin?: number;
  opacity?: number;
  zIndex?: number;
  // Flex layout properties (for Container)
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: number;
  flexWrap?: 'wrap' | 'nowrap';
}

// Event action types
export type ActionType =
  | 'runQuery'
  | 'setComponentValue'
  | 'navigateTo'
  | 'openModal'
  | 'closeModal'
  | 'showNotification'
  | 'copyToClipboard'
  | 'openUrl';

export interface EventAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
}

export interface EventHandler {
  event: string; // 'onClick' | 'onChange' | 'onRowClick' | ...
  actions: EventAction[];
  condition?: string; // Condition expression
}

// Main component node structure
export interface ComponentNode {
  id: string;
  type: ComponentType;
  name: string; // 'userTable' | 'submitBtn' | ...
  props: Record<string, any>; // Component properties
  style: ComponentStyle; // Style (position, size, appearance)
  events: EventHandler[]; // Event handlers
  children?: ComponentNode[]; // Child components for container types
}

// Component Registry Type
export interface ComponentRegistryItem {
  type: ComponentType;
  category: 'data' | 'form' | 'layout' | 'feedback' | 'media' | 'navigation';
  defaultProps: Record<string, any>;
  propertySchema: Record<string, any>;
  eventDefs: string[];
  defaultSize: { width: number; height: number };
}

// Legacy compatibility
export interface ComponentNodeLegacy {
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
  events: EventHandlerLegacy[];
}

export interface EventHandlerLegacy {
  id: string;
  event: string;
  actions: ActionLegacy[];
  condition?: string;
}

export interface ActionLegacy {
  id: string;
  type: string;
  params: Record<string, any>;
}
