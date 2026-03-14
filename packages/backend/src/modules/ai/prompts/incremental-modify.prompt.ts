// Step 8 - Incremental modification prompt
// This prompt generates a patch JSON based on user instruction and current app definition

export interface AppPatch {
  summary: string;
  actions: PatchAction[];
}

export type PatchAction =
  | UpdateComponentAction
  | AddComponentAction
  | RemoveComponentAction
  | AddQueryAction
  | UpdateQueryAction
  | RemoveQueryAction
  | AddColumnAction
  | AddTableAction;

export interface UpdateComponentAction {
  type: 'updateComponent';
  componentId: string;
  changes: Record<string, any>; // Uses dot notation paths, e.g., "props.columns"
}

export interface AddComponentAction {
  type: 'addComponent';
  component: {
    id: string;
    type: string;
    name: string;
    props: Record<string, any>;
    style: { x: number; y: number; width: number; height: number };
    events: any[];
  };
  pageId?: string;
}

export interface RemoveComponentAction {
  type: 'removeComponent';
  componentId: string;
}

export interface AddQueryAction {
  type: 'addQuery';
  query: {
    id: string;
    name: string;
    dataSourceId: string;
    type: 'sql' | 'js' | 'rest';
    content: Record<string, any>;
    options: Record<string, any>;
  };
  pageId?: string;
}

export interface UpdateQueryAction {
  type: 'updateQuery';
  queryId: string;
  changes: Record<string, any>;
}

export interface RemoveQueryAction {
  type: 'removeQuery';
  queryId: string;
}

export interface AddColumnAction {
  type: 'addColumn';
  tableName: string;
  column: {
    name: string;
    type: string;
    description?: string;
  };
}

export interface AddTableAction {
  type: 'addTable';
  table: {
    tableName: string;
    description?: string;
    columns: Array<{
      name: string;
      type: string;
      description?: string;
    }>;
  };
}

export function incrementalModifyPrompt(vars: {
  userInstruction: string;
  currentDefinition: any;
  componentSchemas: Record<string, any>;
  availableComponents: string[];
  dataModel: any[]; // NovaDB tables info
}): string {
  const {
    userInstruction,
    currentDefinition,
    componentSchemas,
    availableComponents,
    dataModel,
  } = vars;

  return `你是一个低代码应用修改助手。用户希望通过自然语言修改已生成的应用。

## 当前应用定义
${JSON.stringify(currentDefinition, null, 2)}

## 可用组件类型
${JSON.stringify(availableComponents)}

## 组件属性 Schema
${JSON.stringify(componentSchemas, null, 2)}

## NovaDB 数据模型
${JSON.stringify(dataModel, null, 2)}

## 用户修改指令
"${userInstruction}"

## 修改规则
1. 最小修改原则：只做必要的修改，不要改变未提及的部分
2. 已有 ID 不变：新组件用 cmp_ 前缀，新查询用 qry_ 前缀
3. 布局不重叠：新组件放在合适位置，避免与其他组件重叠
4. 改表结构要同步更新查询：如果添加列，需要检查相关查询是否需要更新
5. changes 使用点号路径：例如 "props.columns" 表示修改 props 下的 columns
6. 只返回 JSON，不要返回其他内容

## 输出格式
请返回以下格式的 JSON：

{
  "summary": "一句话描述本次修改",
  "actions": [
    {
      "type": "updateComponent | addComponent | removeComponent | addQuery | updateQuery | removeQuery | addColumn | addTable",
      ...actionFields
    }
  ]
}

## Action 字段说明

### updateComponent
{
  "type": "updateComponent",
  "componentId": "组件ID",
  "changes": { "props.列名": "新值" }
}

### addComponent
{
  "type": "addComponent",
  "component": {
    "id": "cmp_xxx",
    "type": "组件类型",
    "name": "组件名称",
    "props": {},
    "style": { "x": 0, "y": 0, "width": 200, "height": 40 },
    "events": []
  },
  "pageId": "页面ID（可选，默认添加到第一个页面）"
}

### removeComponent
{
  "type": "removeComponent",
  "componentId": "组件ID"
}

### addQuery
{
  "type": "addQuery",
  "query": {
    "id": "qry_xxx",
    "name": "查询名称",
    "dataSourceId": "数据源ID（__NOVADB__ 表示 NovaDB）",
    "type": "sql | js | rest",
    "content": { "sql": "SELECT * FROM ..." },
    "options": {}
  },
  "pageId": "页面ID（可选）"
}

### updateQuery
{
  "type": "updateQuery",
  "queryId": "查询ID",
  "changes": { "content.sql": "新SQL" }
}

### removeQuery
{
  "type": "removeQuery",
  "queryId": "查询ID"
}

### addColumn
{
  "type": "addColumn",
  "tableName": "表名",
  "column": { "name": "列名", "type": "text | number | boolean | datetime" }
}

### addTable
{
  "type": "addTable",
  "table": {
    "tableName": "表名",
    "description": "表描述",
    "columns": [{ "name": "列名", "type": "text | number | boolean | datetime" }]
  }
}

请生成修改方案，只返回 JSON：
`;
}
