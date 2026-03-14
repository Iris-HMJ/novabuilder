import { useEffect, useRef } from 'react';
import { useQueryStore } from '../stores/queryStore';

/**
 * 自动执行页面查询
 *
 * 使用方式：在页面/画布渲染组件中调用
 *   useAutoRunQueries(currentPage, executeQuery, queryResults)
 *
 * 参数说明：
 *   page - 当前页面定义，包含 page.queries 数组
 *   executeQuery - 执行查询的函数
 *   queryResults - 当前已有的查询结果（避免重复执行）
 */
export function useAutoRunQueries(
  page: any,                    // 当前页面定义对象
  queryResults: Record<string, any>,            // 已有结果
) {
  const executeQuery = useQueryStore((state) => state.executeQuery);
  // 记录已执行的查询 ID，避免重复触发
  const executedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 页面切换时重置已执行记录
    executedRef.current.clear();
  }, [page?.id]);

  useEffect(() => {
    if (!page?.queries || !Array.isArray(page.queries)) return;

    // 找出所有 trigger 包含 pageLoad 且尚未执行的查询
    const pendingQueries = page.queries.filter((q: any) => {
      // 检查是否有 pageLoad trigger
      const hasPageLoadTrigger =
        q.trigger === 'pageLoad' ||
        q.triggers?.includes('pageLoad') ||
        q.options?.runOnPageLoad;

      if (!hasPageLoadTrigger) return false;

      // 检查是否已经执行过
      if (executedRef.current.has(q.id)) return false;

      // 检查是否已有结果（避免重复执行）- 支持 id 或 name 作为 key
      const existingResult = queryResults[q.name] || queryResults[q.id];
      if (existingResult?.data !== undefined) return false;

      return true;
    });

    // 依次执行待运行的查询
    pendingQueries.forEach((q: any) => {
      executedRef.current.add(q.id);
      executeQuery(q).catch((err) => {
        console.error(`[useAutoRunQueries] 查询 ${q.name || q.id} 执行失败:`, err);
      });
    });
  }, [page?.id, page?.queries, executeQuery, queryResults]);
}
