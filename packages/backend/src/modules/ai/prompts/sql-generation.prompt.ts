export function sqlGenerationPrompt(vars: {
  description: string;
  tables: any[];
}): string {
  return `根据用户描述和数据库 Schema，生成 PostgreSQL 查询。

## 数据库 Schema
${vars.tables.map(t =>
  `表 ${t.name}:\n  列: ${t.columns.map((c: any) => `${c.name} (${c.type})`).join(', ')}`
).join('\n\n')}

## 用户描述
${vars.description}

## 输出格式（JSON）
\`\`\`json
{
  "sql": "生成的 SQL",
  "explanation": "简要说明这个查询做了什么"
}
\`\`\`

注意：
1. 使用标准 PostgreSQL 语法
2. 如果需要引用前端组件值，使用 {{component.value}} 语法
3. 只返回 JSON`;
}
