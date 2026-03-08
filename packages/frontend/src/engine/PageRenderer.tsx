import React from 'react';
import { registry } from '../registry';
import type { PageDef, ComponentNode } from '@novabuilder/shared';

interface PageRendererProps {
  pageDef: PageDef;
  context?: Record<string, any>;
  queries?: Record<string, any>;
}

// Simple expression evaluator - extracts {{expression}} and evaluates basic access
const evaluateExpression = (value: any, context: Record<string, any>): any => {
  if (typeof value !== 'string') return value;

  // Match {{expression}} pattern
  const match = value.match(/^\{\{(.+)\}\}$/);
  if (!match) return value;

  const expression = match[1].trim();

  try {
    // Simple context access: queries.getUsers.data -> context.queries?.getUsers?.data
    const keys = expression.split('.');
    let result = context;
    for (const key of keys) {
      if (result == null) return undefined;
      result = result[key];
    }
    return result;
  } catch (e) {
    console.warn('Expression evaluation error:', e);
    return value;
  }
};

// Resolve props - evaluate expression values
const resolveProps = (props: Record<string, any>, context: Record<string, any>): Record<string, any> => {
  const resolved: Record<string, any> = {};
  for (const [key, value] of Object.entries(props)) {
    resolved[key] = evaluateExpression(value, context);
  }
  return resolved;
};

const PageRenderer: React.FC<PageRendererProps> = ({ pageDef, context = {}, queries = {} }) => {
  const { components } = pageDef;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'auto' }}>
      {components.map((comp: ComponentNode) => {
        const { x, y, width, height, zIndex = 0, backgroundColor, borderRadius, borderWidth, borderColor, borderStyle, boxShadow } = comp.style;

        // Get component definition from registry
        const compDef = registry.get(comp.type);
        const ComponentRender = compDef?.render;

        // Resolve props with context (for expression evaluation)
        const resolvedProps = resolveProps(comp.props, { ...context, queries });

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
                queries={queries}
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
