export function requirementAnalysisPrompt(vars: {
  userInput: string;
  availableComponents: string[];
  supportedDataTypes: string[];
}): string {
  return `你是 NovaBuilder 低代码平台的 AI 助手。用户描述了想要创建的应用，请分析需求并返回结构化 JSON。

## 可用组件（共 20 个）
${vars.availableComponents.join(', ')}

## NovaDB 支持的数据类型
${vars.supportedDataTypes.join(', ')}

## 限制
- 最多生成 3 个页面
- 仅使用 NovaDB 作为数据源（内置 PostgreSQL）
- 组件类型必须在上方可用组件列表内
- 每个表自动包含 id（自增主键）和 created_at（时间戳），不需要在 columns 中定义

## 用户需求
${vars.userInput}

## 输出格式（严格 JSON，不要其他文字）
\`\`\`json
{
  "appName": "应用名称",
  "summary": "一句话描述这个应用的功能",
  "pages": [
    {
      "name": "页面名称",
      "handle": "url-path",
      "description": "页面功能描述",
      "components": [
        {
          "type": "组件类型（如 Table / Button / TextInput）",
          "name": "组件标识名（如 employeeTable / addButton）",
          "description": "组件用途"
        }
      ]
    }
  ],
  "dataModel": [
    {
      "tableName": "表名（英文 snake_case）",
      "description": "表用途",
      "columns": [
        { "name": "列名", "type": "text|number|boolean|datetime", "description": "说明" }
      ]
    }
  ],
  "queries": [
    {
      "name": "查询标识名（如 getAllEmployees）",
      "description": "查询用途",
      "type": "sql",
      "sql": "SELECT 语句（表名用上面 dataModel 中定义的 tableName）",
      "trigger": "pageLoad 或 manual"
    }
  ]
}
\`\`\``;
}
