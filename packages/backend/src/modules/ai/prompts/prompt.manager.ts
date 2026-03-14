import { Injectable } from '@nestjs/common';
import { requirementAnalysisPrompt } from './requirement-analysis.prompt';
import { appGenerationPrompt } from './app-generation.prompt';
import { sqlGenerationPrompt } from './sql-generation.prompt';

@Injectable()
export class PromptManager {
  private templates = new Map<string, (vars: Record<string, any>) => string>();

  constructor() {
    this.register('requirement-analysis', requirementAnalysisPrompt);
    this.register('app-generation', appGenerationPrompt);
    this.register('sql-generation', sqlGenerationPrompt);
  }

  register(name: string, fn: (vars: Record<string, any>) => string) {
    this.templates.set(name, fn);
  }

  get(name: string, variables: Record<string, any>): string {
    const fn = this.templates.get(name);
    if (!fn) throw new Error(`Prompt template '${name}' not found`);
    return fn(variables);
  }
}
