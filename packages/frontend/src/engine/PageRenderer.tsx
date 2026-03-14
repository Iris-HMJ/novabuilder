import React from 'react';
import { registry } from '../registry';
import { resolveDynamicProps, buildRuntimeContext } from '../utils/expressionResolver';
import { useQueryStore } from '../stores/queryStore';
import type { PageDef, ComponentNode } from '@novabuilder/shared';

interface PageRendererProps {
  pageDef: PageDef;
  context?: Record<string, any>;
  queries?: Record<string, any>;
  queryResults?: Record<string, any>;
}

// Resolve props - evaluate expression values and dynamic bindings
const resolveProps = (props: Record<string, any>, _context: Record<string, any>, queryResults: Record<string, any> = {}): Record<string, any> => {
  // Build runtime context for expression resolution
  const runtimeContext = buildRuntimeContext(queryResults, {});

  // Use the expression resolver for dynamic props
  const dynamicValues = resolveDynamicProps(props.dynamic, runtimeContext);

  // Merge static and dynamic props (dynamic overrides static)
  return {
    ...props,
    ...dynamicValues,
  };
};

const PageRenderer: React.FC<PageRendererProps> = ({ pageDef, context = {}, queries = {} }) => {
  const { components } = pageDef;

  // Get query results from store
  const queryResults = useQueryStore((state) => state.queryResults);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'auto' }}>
      {components.map((comp: ComponentNode) => {
        const { x, y, width, height, zIndex = 0, backgroundColor, borderRadius, borderWidth, borderColor, borderStyle, boxShadow } = comp.style;

        // Get component definition from registry
        const compDef = registry.get(comp.type);
        const ComponentRender = compDef?.render;

        // Resolve props with context and queryResults (for dynamic binding)
        const resolvedProps = resolveProps(comp.props, { ...context, queries }, queryResults);

        return (
          <div
            key={comp.id}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width,
              height,
              zIndex,
              backgroundColor: backgroundColor || 'transparent',
              borderRadius: borderRadius ? `${borderRadius}px` : undefined,
              border: borderWidth ? `${borderWidth}px ${borderStyle || 'solid'} ${borderColor || '#d9d9d9'}` : 'none',
              boxShadow: boxShadow || undefined,
            }}
          >
            {ComponentRender ? (
              <ComponentRender
                props={resolvedProps}
                style={{ width: '100%', height: '100%' }}
                mode="preview"
                componentId={comp.id}
                context={context}
                queries={queryResults}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                {comp.type}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PageRenderer;
