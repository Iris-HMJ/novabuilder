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

export interface AppDefinition {
  version: string;
  pages: PageDef[];
}

export interface PageDef {
  id: string;
  name: string;
  order: number;
  components: Record<string, ComponentNode>;
}

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
