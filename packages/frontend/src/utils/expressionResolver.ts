/**
 * 运行时求值上下文
 * 包含所有可在表达式中引用的数据
 */
export interface RuntimeContext {
  queries: Record<string, {
    data: any;          // 查询返回的数据（通常是数组）
    isLoading: boolean; // 是否正在加载
    error: string | null;
  }>;
  components: Record<string, Record<string, any>>; // 组件暴露状态
  urlParams?: Record<string, string>;
}

/**
 * 解析简单路径表达式
 * 支持格式：
 *   "queries.getAllEmployees.data"    → context.queries.getAllEmployees.data
 *   "queries.getUsers.isLoading"      → context.queries.getUsers.isLoading
 *   "components.table1.selectedRow"   → context.components.table1.selectedRow
 *
 * 不支持（MVP 不需要）：
 *   函数调用、三元表达式、数组索引、算术运算
 */
export function resolveExpression(expr: string, context: RuntimeContext): any {
  if (!expr || typeof expr !== 'string') return expr;

  // 1. 去掉首尾空格
  const trimmed = expr.trim();

  // 2. 如果不是表达式（不以 queries. 或 components. 开头），原样返回
  if (!trimmed.startsWith('queries.') && !trimmed.startsWith('components.')) {
    return expr;
  }

  // 3. 按 . 分割路径，逐层取值
  const parts = trimmed.split('.');
  let current: any = context;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

/**
 * 批量解析一个组件的所有 dynamic 属性
 *
 * 输入：
 *   dynamicProps = {
 *     data: "queries.getAllEmployees.data",
 *     loading: "queries.getAllEmployees.isLoading"
 *   }
 *
 * 输出：
 *   {
 *     data: [{id:1, name:"张三"}, ...],
 *     loading: false
 *   }
 */
export function resolveDynamicProps(
  dynamicProps: Record<string, string> | undefined,
  context: RuntimeContext,
): Record<string, any> {
  if (!dynamicProps || typeof dynamicProps !== 'object') return {};

  const resolved: Record<string, any> = {};

  for (const [key, expr] of Object.entries(dynamicProps)) {
    if (typeof expr === 'string') {
      resolved[key] = resolveExpression(expr, context);
    } else {
      resolved[key] = expr; // 非字符串直接透传
    }
  }

  return resolved;
}

/**
 * 构建运行时上下文
 * 从各个 Store 读取数据，组装成 RuntimeContext
 */
export function buildRuntimeContext(
  queryResults: Record<string, { data: any; isLoading: boolean; error: string | null }>,
  componentStates: Record<string, Record<string, any>>,
): RuntimeContext {
  return {
    queries: queryResults,
    components: componentStates,
    urlParams: Object.fromEntries(new URLSearchParams(window.location.search)),
  };
}
