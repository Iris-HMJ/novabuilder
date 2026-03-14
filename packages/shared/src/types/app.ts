// App Types

import { ComponentNode } from './component';

export type AppStatus = 'draft' | 'published';

export interface App {
  id: string;
  name: string;
  workspaceId: string;
  status: AppStatus;
  definitionDraft: AppDefinition | null;
  definitionPublished: AppDefinition | null;
  definitionPrevious: AppDefinition | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

// ============== Step 6.7: Navigation Config ==============

export interface NavigationConfig {
  type: 'sidebar';
  position: 'left';
  theme: 'dark' | 'light';
  collapsed: boolean;
  collapsible: boolean;
  showAppName: boolean;
  width: number;
  collapsedWidth: number;
}

// Default navigation config for new apps
export const defaultNavigationConfig: NavigationConfig = {
  type: 'sidebar',
  position: 'left',
  theme: 'light',
  collapsed: false,
  collapsible: true,
  showAppName: true,
  width: 200,
  collapsedWidth: 48,
};

// ============== Step 6.1: Editor Data Structures ==============

export interface AppDefinition {
  version: string;
  pages: PageDef[];
  globalSettings?: GlobalSettings;
  navigation?: NavigationConfig;
}

export interface GlobalSettings {
  canvasWidth?: number;
  canvasHeight?: number;
  backgroundColor?: string;
}

export interface PageDef {
  id: string;
  name: string;
  isHome?: boolean;
  components: ComponentNode[];
  // Additional page properties
  path?: string;
  hidden?: boolean;
  onLoadQueries?: string[];
  icon?: string;
  // Inline queries for this page (used by AI-generated apps)
  queries?: Array<{
    id: string;
    name: string;
    dataSourceId: string;
    type: 'sql' | 'javascript' | 'visual' | 'rest';
    content: any;
    trigger?: string;
    options?: any;
  }>;
}

// Partial type helper for updates
export type PageDefUpdate = Partial<Pick<PageDef, 'name' | 'isHome' | 'path' | 'hidden' | 'onLoadQueries'>>;

export interface CreateAppDto {
  name: string;
  workspaceId: string;
}

export interface UpdateAppDto {
  name?: string;
  definitionDraft?: AppDefinition;
}

export interface PublishAppDto {
  appId: string;
}

// Legacy compatibility - will be replaced by above
export interface AppDefinitionLegacy {
  version: string;
  pages: PageDefLegacy[];
}

export interface PageDefLegacy {
  id: string;
  name: string;
  order: number;
  components: Record<string, ComponentNode>;
}
