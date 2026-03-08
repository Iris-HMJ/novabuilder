import { ComponentDefinition, ComponentCategory, CategoryDef, categories } from './types';

class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map();

  /**
   * Register a component definition
   */
  register(definition: ComponentDefinition): void {
    if (this.components.has(definition.type)) {
      console.warn(`Component ${definition.type} is already registered, overwriting...`);
    }
    this.components.set(definition.type, definition);
  }

  /**
   * Get a component by type
   */
  get(type: string): ComponentDefinition | undefined {
    return this.components.get(type);
  }

  /**
   * Get all registered components
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getByCategory(category: ComponentCategory): ComponentDefinition[] {
    return this.getAll().filter((c) => c.category === category);
  }

  /**
   * Get all categories with their labels and icons
   */
  getCategories(): CategoryDef[] {
    return categories;
  }

  /**
   * Get category by key
   */
  getCategory(key: ComponentCategory): CategoryDef | undefined {
    return categories.find((c) => c.key === key);
  }

  /**
   * Check if a component is registered
   */
  has(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Get the count of registered components
   */
  count(): number {
    return this.components.size;
  }
}

// Export singleton instance
export const registry = new ComponentRegistry();

// Export the class for testing or custom instances
export { ComponentRegistry };
