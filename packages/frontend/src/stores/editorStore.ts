import { create } from 'zustand';
import type { AppDefinition, PageDef, ComponentNode, ComponentStyle, ComponentType, GlobalSettings } from '@novabuilder/shared';
import { registry } from '../registry';
import { saveToHistory } from './historyStore';

// Debounce helper for history push
let lastHistoryPush = 0;
const HISTORY_DEBOUNCE_MS = 300;

const shouldPushHistory = (): boolean => {
  const now = Date.now();
  if (now - lastHistoryPush > HISTORY_DEBOUNCE_MS) {
    lastHistoryPush = now;
    return true;
  }
  return false;
};

// Helper to push state to history before making changes
const pushHistoryIfNeeded = () => {
  if (shouldPushHistory()) {
    saveToHistory();
  }
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Get Chinese name for component type from registry
const getChineseName = (type: ComponentType): string => {
  const def = registry.get(type);
  return def?.name || type;
};

// Generate component name with Chinese name + number
const generateComponentName = (type: ComponentType, existingComponents: ComponentNode[]): string => {
  const chineseName = getChineseName(type);
  // Count existing components of this type
  const count = existingComponents.filter(c => c.type === type).length + 1;
  return `${chineseName}${count}`;
};

// ========== Z-Index Management Helpers ==========

// Get components sorted by zIndex (ascending)
const getSortedByZIndex = (components: ComponentNode[]): ComponentNode[] => {
  return [...components].sort((a, b) => (a.style.zIndex ?? 0) - (b.style.zIndex ?? 0));
};

// Reindex all components from 0, 1, 2...
const reindexComponents = (components: ComponentNode[]): ComponentNode[] => {
  return components.map((comp, index) => ({
    ...comp,
    style: { ...comp.style, zIndex: index },
  }));
};

// Get component's current layer position (0 = bottom, max = top)
const getLayerPosition = (componentId: string, components: ComponentNode[]): { position: number; total: number } => {
  const sorted = getSortedByZIndex(components);
  const position = sorted.findIndex(c => c.id === componentId);
  return { position, total: sorted.length };
};

// Default component style
const getDefaultStyle = (type: ComponentType): ComponentStyle => {
  const defaults: Record<ComponentType, ComponentStyle> = {
    Table: { x: 20, y: 20, width: 600, height: 400 },
    ListView: { x: 20, y: 20, width: 400, height: 300 },
    Chart: { x: 20, y: 20, width: 500, height: 300 },
    Stat: { x: 20, y: 20, width: 200, height: 100 },
    TextInput: { x: 20, y: 20, width: 200, height: 36 },
    NumberInput: { x: 20, y: 20, width: 150, height: 36 },
    Select: { x: 20, y: 20, width: 200, height: 36 },
    DatePicker: { x: 20, y: 20, width: 200, height: 36 },
    FileUpload: { x: 20, y: 20, width: 300, height: 100 },
    RichTextEditor: { x: 20, y: 20, width: 500, height: 200 },
    Container: { x: 20, y: 20, width: 400, height: 300, flexDirection: 'column' },
    Tabs: { x: 20, y: 20, width: 400, height: 200 },
    Modal: { x: 20, y: 20, width: 500, height: 400 },
    Button: { x: 20, y: 20, width: 100, height: 36 },
    Toggle: { x: 20, y: 20, width: 50, height: 24 },
    Checkbox: { x: 20, y: 20, width: 100, height: 24 },
    Spinner: { x: 20, y: 20, width: 40, height: 40 },
    Image: { x: 20, y: 20, width: 200, height: 150 },
    PDFViewer: { x: 20, y: 20, width: 500, height: 600 },
    Sidebar: { x: 20, y: 20, width: 200, height: 400 },
  };

  return defaults[type];
};

// Default component props by type
const getDefaultProps = (type: ComponentType): Record<string, any> => {
  const defaults: Record<ComponentType, Record<string, any>> = {
    Table: {
      dataSource: '',
      columns: [],
      pagination: { enabled: true, pageSize: 10 },
      showSearch: false,
      rowSelection: 'none',
    },
    ListView: {
      dataSource: '',
      itemTemplate: '',
    },
    Chart: {
      chartType: 'line',
      dataSource: '',
      xField: '',
      yField: '',
    },
    Stat: {
      value: '',
      label: '',
      prefix: '',
      suffix: '',
    },
    TextInput: {
      placeholder: '请输入...',
      value: '',
      disabled: false,
    },
    NumberInput: {
      placeholder: '请输入数字',
      value: '',
      min: undefined,
      max: undefined,
    },
    Select: {
      placeholder: '请选择',
      options: [],
      value: '',
      mode: 'single',
    },
    DatePicker: {
      placeholder: '选择日期',
      format: 'YYYY-MM-DD',
      showTime: false,
    },
    FileUpload: {
      accept: '*',
      maxCount: 1,
      draggable: true,
    },
    RichTextEditor: {
      content: '',
      placeholder: '请输入内容...',
    },
    Container: {
      backgroundColor: 'transparent',
    },
    Tabs: {
      tabs: [],
      activeKey: '1',
    },
    Modal: {
      title: '弹窗',
      visible: false,
      width: 500,
    },
    Button: {
      text: '按钮',
      type: 'default',
      disabled: false,
    },
    Toggle: {
      checked: false,
      disabled: false,
    },
    Checkbox: {
      label: '复选框',
      checked: false,
      disabled: false,
    },
    Spinner: {
      size: 'default',
      tip: '加载中...',
    },
    Image: {
      src: '',
      alt: '',
      fit: 'contain',
    },
    PDFViewer: {
      url: '',
      page: 1,
    },
    Sidebar: {
      menus: [],
      collapsed: false,
    },
  };

  return defaults[type] || {};
};

// Create a new component node
const createComponent = (type: ComponentType, name?: string): ComponentNode => {
  const id = generateId();
  const defaultName = `${type.toLowerCase()}${id.slice(0, 4)}`;
  return {
    id,
    type,
    name: name || defaultName,
    props: getDefaultProps(type),
    style: getDefaultStyle(type),
    events: [],
    children: [],
  };
};

// Create a new page
const createPage = (name: string, isHome: boolean = false): PageDef => ({
  id: generateId(),
  name,
  isHome,
  components: [],
  path: name.toLowerCase().replace(/\s+/g, '-'),
  hidden: false,
  onLoadQueries: [],
});

// Create empty app definition
const createEmptyAppDefinition = (): AppDefinition => ({
  version: '1.0.0',
  pages: [createPage('首页', true)],
  globalSettings: {
    canvasWidth: 1920,
    canvasHeight: 1080,
    backgroundColor: '#f5f5f5',
  },
});

// Editor state interface
export type SaveStatus = 'saved' | 'saving' | 'error';
export type EditorMode = 'edit' | 'preview';

interface EditorState {
  // App data
  appId: string | null;
  appName: string;
  appDefinition: AppDefinition;

  // Editor state
  currentPageId: string | null;
  selectedComponentIds: string[];
  mode: EditorMode;
  isDirty: boolean;
  saveStatus: SaveStatus;

  // Canvas state
  zoom: number;
  panOffset: { x: number; y: number };

  // Loading state
  isLoading: boolean;

  // Actions - App
  loadApp: (appId: string, appName: string, definition: AppDefinition | null) => void;
  setAppName: (name: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  setGlobalSettings: (settings: Partial<GlobalSettings>) => void;

  // Actions - Pages
  setCurrentPage: (pageId: string) => void;
  addPage: (name: string) => void;
  deletePage: (pageId: string) => void;
  updatePage: (pageId: string, updates: Partial<PageDef> & { path?: string; hidden?: boolean; onLoadQueries?: string[] }) => void;
  reorderPages: (startIndex: number, endIndex: number) => void;
  setHomePage: (pageId: string) => void;

  // Actions - Components
  addComponent: (type: ComponentType, name?: string) => ComponentNode | null;
  updateComponent: (componentId: string, updates: Partial<ComponentNode>) => void;
  deleteComponent: (componentId: string) => void;
  moveComponent: (componentId: string, x: number, y: number) => void;
  resizeComponent: (componentId: string, width: number, height: number) => void;
  updateComponentStyle: (componentId: string, style: Partial<ComponentStyle>) => void;
  duplicateComponent: (componentId: string) => void;

  // Actions - Layer (z-index)
  bringToFront: (componentId: string) => void;
  sendToBack: (componentId: string) => void;
  bringForward: (componentId: string) => void;
  sendBackward: (componentId: string) => void;
  getLayerInfo: (componentId: string) => { position: number; total: number } | null;

  // Actions - Selection
  selectComponent: (componentId: string, multi?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;

  // Actions - Canvas
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  setMode: (mode: EditorMode) => void;
  setDirty: (dirty: boolean) => void;

  // Helpers
  getCurrentPage: () => PageDef | null;
  getComponent: (componentId: string) => ComponentNode | null;
  getSelectedComponents: () => ComponentNode[];
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  // Initial state
  appId: null,
  appName: '',
  appDefinition: createEmptyAppDefinition(),
  currentPageId: null,
  selectedComponentIds: [],
  mode: 'edit',
  isDirty: false,
  saveStatus: 'saved',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  isLoading: false,

  // App actions
  loadApp: (appId, appName, definition) => {
    // Ensure definition has valid structure
    let appDefinition = definition || createEmptyAppDefinition();

    // If definition has no pages or invalid pages, create a valid structure
    if (!appDefinition.pages || !Array.isArray(appDefinition.pages) || appDefinition.pages.length === 0) {
      appDefinition = createEmptyAppDefinition();
    }

    // Ensure each page has required fields
    appDefinition = {
      ...appDefinition,
      pages: appDefinition.pages.map(page => ({
        id: page.id || Math.random().toString(36).substring(2, 11),
        name: page.name || '未命名页面',
        components: page.components || [],
        isHome: page.isHome || false,
      }))
    };

    const currentPageId = appDefinition.pages[0]?.id || null;
    set({
      appId,
      appName,
      appDefinition,
      currentPageId,
      selectedComponentIds: [],
      isDirty: false,
      saveStatus: 'saved',
    });
  },

  setAppName: (name) => set({ appName: name, isDirty: true }),

  setSaveStatus: (status) => set({ saveStatus: status }),

  setGlobalSettings: (settings) => {
    const { appDefinition } = get();
    set({
      appDefinition: {
        ...appDefinition,
        globalSettings: {
          canvasWidth: 1920,
          canvasHeight: 1080,
          backgroundColor: '#f5f5f5',
          ...appDefinition.globalSettings,
          ...settings,
        },
      },
      isDirty: true,
    });
  },

  // Page actions
  setCurrentPage: (pageId) => set({ currentPageId: pageId, selectedComponentIds: [] }),

  addPage: (name) => {
    const { appDefinition } = get();
    if (appDefinition.pages.length >= 10) return; // Max 10 pages

    pushHistoryIfNeeded(); // Save state before adding page

    const newPage = createPage(name, appDefinition.pages.length === 0);
    set({
      appDefinition: {
        ...appDefinition,
        pages: [...appDefinition.pages, newPage],
      },
      currentPageId: newPage.id,
      selectedComponentIds: [],
      isDirty: true,
    });
  },

  deletePage: (pageId) => {
    const { appDefinition, currentPageId } = get();
    if (appDefinition.pages.length <= 1) return; // Keep at least 1 page

    pushHistoryIfNeeded(); // Save state before deleting page

    const newPages = appDefinition.pages.filter((p) => p.id !== pageId);
    // If deleted page was home, make first page home
    if (newPages.length > 0 && !newPages.some((p) => p.isHome)) {
      newPages[0].isHome = true;
    }

    set({
      appDefinition: {
        ...appDefinition,
        pages: newPages,
      },
      currentPageId: currentPageId === pageId ? newPages[0]?.id || null : currentPageId,
      selectedComponentIds: [],
      isDirty: true,
    });
  },

  updatePage: (pageId, updates) => {
    const { appDefinition } = get();
    pushHistoryIfNeeded(); // Save state before updating page
    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
      },
      isDirty: true,
    });
  },

  reorderPages: (startIndex, endIndex) => {
    const { appDefinition } = get();
    pushHistoryIfNeeded(); // Save state before reordering pages

    const newPages = Array.from(appDefinition.pages);
    const [removed] = newPages.splice(startIndex, 1);
    newPages.splice(endIndex, 0, removed);

    set({
      appDefinition: {
        ...appDefinition,
        pages: newPages,
      },
      isDirty: true,
    });
  },

  setHomePage: (pageId) => {
    const { appDefinition } = get();
    pushHistoryIfNeeded(); // Save state before setting home page

    const newPages = appDefinition.pages.map(page => ({
      ...page,
      isHome: page.id === pageId,
    }));

    set({
      appDefinition: {
        ...appDefinition,
        pages: newPages,
      },
      isDirty: true,
    });
  },

  // Component actions
  addComponent: (type, name) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return null;

    // Get existing components in current page to generate unique name
    const currentPage = appDefinition.pages.find(p => p.id === currentPageId);
    if (!currentPage) return null; // Defensive: if page not found, return null

    const existingComponents = currentPage.components || [];

    // Generate Chinese name with number if no custom name provided
    const componentName = name || generateComponentName(type, existingComponents);
    const component = createComponent(type, componentName);

    // Set zIndex to highest (put on top)
    component.style.zIndex = existingComponents.length;

    pushHistoryIfNeeded(); // Save state before adding component

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((page) =>
          page.id === currentPageId
            ? { ...page, components: [...page.components, component] }
            : page
        ),
      },
      selectedComponentIds: [component.id],
      isDirty: true,
    });

    return component;
  },

  updateComponent: (componentId, updates) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    pushHistoryIfNeeded(); // Save state before updating component

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                components: page.components.map((c) =>
                  c.id === componentId ? { ...c, ...updates } : c
                ),
              }
            : page
        ),
      },
      isDirty: true,
    });
  },

  deleteComponent: (componentId) => {
    const { currentPageId, appDefinition, selectedComponentIds } = get();
    if (!currentPageId) return;

    pushHistoryIfNeeded(); // Save state before deleting component

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((page) =>
          page.id === currentPageId
            ? { ...page, components: page.components.filter((c) => c.id !== componentId) }
            : page
        ),
      },
      selectedComponentIds: selectedComponentIds.filter((id) => id !== componentId),
      isDirty: true,
    });
  },

  moveComponent: (componentId, x, y) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    // Snap to grid (8px)
    const snappedX = Math.round(x / 8) * 8;
    const snappedY = Math.round(y / 8) * 8;

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                components: page.components.map((c) =>
                  c.id === componentId
                    ? { ...c, style: { ...c.style, x: snappedX, y: snappedY } }
                    : c
                ),
              }
            : page
        ),
      },
      isDirty: true,
    });
  },

  resizeComponent: (componentId, width, height) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    // Snap to grid (8px)
    const snappedWidth = Math.round(width / 8) * 8;
    const snappedHeight = Math.round(height / 8) * 8;

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                components: page.components.map((c) =>
                  c.id === componentId
                    ? {
                        ...c,
                        style: { ...c.style, width: snappedWidth, height: snappedHeight },
                      }
                    : c
                ),
              }
            : page
        ),
      },
      isDirty: true,
    });
  },

  updateComponentStyle: (componentId, style) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    pushHistoryIfNeeded(); // Save state before updating style

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((page) =>
          page.id === currentPageId
            ? {
                ...page,
                components: page.components.map((c) =>
                  c.id === componentId ? { ...c, style: { ...c.style, ...style } } : c
                ),
              }
            : page
        ),
      },
      isDirty: true,
    });
  },

  duplicateComponent: (componentId) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    const component = page?.components.find((c) => c.id === componentId);
    if (!component) return;

    const duplicated: ComponentNode = {
      ...component,
      id: generateId(),
      name: `${component.name}_copy`,
      style: {
        ...component.style,
        x: component.style.x + 20,
        y: component.style.y + 20,
      },
    };

    pushHistoryIfNeeded(); // Save state before duplicating

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((p) =>
          p.id === currentPageId
            ? { ...p, components: [...p.components, duplicated] }
            : p
        ),
      },
      selectedComponentIds: [duplicated.id],
      isDirty: true,
    });
  },

  // Layer (z-index) actions
  bringToFront: (componentId) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    if (!page) return;

    const sorted = getSortedByZIndex(page.components);
    const target = sorted.find((c) => c.id === componentId);
    if (!target) return;

    pushHistoryIfNeeded(); // Save state before changing layer

    // Move to end of array
    const rest = sorted.filter((c) => c.id !== componentId);
    const newOrder = [...rest, target];
    const reindexed = reindexComponents(newOrder);

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((p) =>
          p.id === currentPageId
            ? { ...p, components: reindexed }
            : p
        ),
      },
      isDirty: true,
    });
  },

  sendToBack: (componentId) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    if (!page) return;

    const sorted = getSortedByZIndex(page.components);
    const target = sorted.find((c) => c.id === componentId);
    if (!target) return;

    pushHistoryIfNeeded(); // Save state before changing layer

    // Move to start of array
    const rest = sorted.filter((c) => c.id !== componentId);
    const newOrder = [target, ...rest];
    const reindexed = reindexComponents(newOrder);

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((p) =>
          p.id === currentPageId
            ? { ...p, components: reindexed }
            : p
        ),
      },
      isDirty: true,
    });
  },

  bringForward: (componentId) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    if (!page) return;

    const sorted = getSortedByZIndex(page.components);
    const index = sorted.findIndex((c) => c.id === componentId);

    if (index < 0 || index >= sorted.length - 1) return; // Already at top

    pushHistoryIfNeeded(); // Save state before changing layer

    // Swap with next element
    [sorted[index], sorted[index + 1]] = [sorted[index + 1], sorted[index]];
    const reindexed = reindexComponents(sorted);

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((p) =>
          p.id === currentPageId
            ? { ...p, components: reindexed }
            : p
        ),
      },
      isDirty: true,
    });
  },

  sendBackward: (componentId) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    if (!page) return;

    const sorted = getSortedByZIndex(page.components);
    const index = sorted.findIndex((c) => c.id === componentId);

    if (index <= 0) return; // Already at bottom

    pushHistoryIfNeeded(); // Save state before changing layer

    // Swap with previous element
    [sorted[index], sorted[index - 1]] = [sorted[index - 1], sorted[index]];
    const reindexed = reindexComponents(sorted);

    set({
      appDefinition: {
        ...appDefinition,
        pages: appDefinition.pages.map((p) =>
          p.id === currentPageId
            ? { ...p, components: reindexed }
            : p
        ),
      },
      isDirty: true,
    });
  },

  getLayerInfo: (componentId) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return null;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    if (!page || page.components.length === 0) return null;

    return getLayerPosition(componentId, page.components);
  },

  // Selection actions
  selectComponent: (componentId, multi = false) => {
    const { selectedComponentIds } = get();
    if (multi) {
      if (selectedComponentIds.includes(componentId)) {
        set({ selectedComponentIds: selectedComponentIds.filter((id) => id !== componentId) });
      } else {
        set({ selectedComponentIds: [...selectedComponentIds, componentId] });
      }
    } else {
      set({ selectedComponentIds: [componentId] });
    }
  },

  clearSelection: () => set({ selectedComponentIds: [] }),

  selectAll: () => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    if (!page) return;

    set({ selectedComponentIds: page.components.map((c) => c.id) });
  },

  // Canvas actions
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),
  setPanOffset: (offset) => set({ panOffset: offset }),
  setMode: (mode) => set({ mode }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  // Helpers
  getCurrentPage: () => {
    const { currentPageId, appDefinition } = get();
    return appDefinition.pages.find((p) => p.id === currentPageId) || null;
  },

  getComponent: (componentId) => {
    const { currentPageId, appDefinition } = get();
    if (!currentPageId) return null;

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    return page?.components.find((c) => c.id === componentId) || null;
  },

  getSelectedComponents: () => {
    const { selectedComponentIds, currentPageId, appDefinition } = get();
    if (!currentPageId) return [];

    const page = appDefinition.pages.find((p) => p.id === currentPageId);
    if (!page) return [];

    return page.components.filter((c) => selectedComponentIds.includes(c.id));
  },
}));
