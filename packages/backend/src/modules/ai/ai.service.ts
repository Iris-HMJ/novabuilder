import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { AiSession, AiMessage } from './entities';
import { PromptManager } from './prompts/prompt.manager';
import { NovaDBService } from '../novadb/novadb.service';
import { AppService } from '../app/app.service';
import { DataSourceService } from '../datasource/datasource.service';
import { incrementalModifyPrompt, AppPatch, PatchAction } from './prompts/incremental-modify.prompt';
import { UserRole } from '@novabuilder/shared/types/user';

type AiProvider = 'anthropic' | 'minimax' | 'mock';

@Injectable()
export class AiService {
  private anthropic: Anthropic | null = null;
  private provider: AiProvider = 'mock';
  private mockMode: boolean = false;

  // MiniMax config
  private minimaxApiKey: string = '';
  private minimaxGroupId: string = '';

  constructor(
    @InjectRepository(AiSession)
    private sessionRepo: Repository<AiSession>,
    @InjectRepository(AiMessage)
    private messageRepo: Repository<AiMessage>,
    private promptManager: PromptManager,
    private novadbService: NovaDBService,
    private appService: AppService,
    private dataSourceService: DataSourceService,
    private configService: ConfigService,
  ) {
    // Check for MiniMax first
    const minimaxApiKey = this.configService.get<string>('MINIMAX_API_KEY');
    const minimaxGroupId = this.configService.get<string>('MINIMAX_GROUP_ID');

    if (minimaxApiKey && minimaxGroupId) {
      this.minimaxApiKey = minimaxApiKey;
      this.minimaxGroupId = minimaxGroupId;
      this.provider = 'minimax';
      console.log('Using MiniMax AI provider');
      return;
    }

    // Check for Anthropic
    const anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: anthropicApiKey });
      this.provider = 'anthropic';
      console.log('Using Anthropic AI provider');
      return;
    }

    // Fall back to mock mode
    console.warn('No AI API key configured. Using mock mode for AI features.');
    this.mockMode = true;
    this.provider = 'mock';
  }

  // Mock data for testing
  private getMockRequirement(input: string): any {
    // 根据输入关键词返回不同的模拟需求
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('员工') || lowerInput.includes('employee')) {
      return {
        appName: '员工管理系统',
        summary: '管理公司员工信息，包括增删改查功能',
        pages: [
          { name: '员工列表', handle: 'employees', description: '显示所有员工列表', components: [] },
          { name: '添加员工', handle: 'add-employee', description: '添加新员工', components: [] },
        ],
        dataModel: [
          {
            tableName: 'employees',
            description: '员工信息表',
            columns: [
              { name: 'name', type: 'text', description: '姓名' },
              { name: 'email', type: 'text', description: '邮箱' },
              { name: 'department', type: 'text', description: '部门' },
              { name: 'position', type: 'text', description: '职位' },
              { name: 'phone', type: 'text', description: '电话' },
            ],
          },
        ],
        queries: [
          { name: 'getAllEmployees', description: '获取所有员工', type: 'sql', sql: 'SELECT * FROM employees ORDER BY created_at DESC', trigger: 'pageLoad' },
        ],
      };
    }

    if (lowerInput.includes('任务') || lowerInput.includes('todo')) {
      return {
        appName: '任务管理系统',
        summary: '管理日常任务，支持创建、完成、删除操作',
        pages: [
          { name: '任务列表', handle: 'tasks', description: '显示所有任务', components: [] },
        ],
        dataModel: [
          {
            tableName: 'tasks',
            description: '任务表',
            columns: [
              { name: 'title', type: 'text', description: '任务标题' },
              { name: 'description', type: 'text', description: '任务描述' },
              { name: 'status', type: 'text', description: '状态' },
              { name: 'priority', type: 'number', description: '优先级' },
            ],
          },
        ],
        queries: [
          { name: 'getAllTasks', description: '获取所有任务', type: 'sql', sql: 'SELECT * FROM tasks ORDER BY priority DESC', trigger: 'pageLoad' },
        ],
      };
    }

    // 数据分析/统计面板
    if (lowerInput.includes('数据') || lowerInput.includes('统计') || lowerInput.includes('分析') || lowerInput.includes('dashboard')) {
      return {
        appName: '数据统计分析面板',
        summary: '数据可视化分析面板，支持图表展示和数据统计',
        pages: [
          { name: '数据概览', handle: 'overview', description: '显示关键数据指标和图表', components: [] },
          { name: '详细报表', handle: 'reports', description: '详细数据报表和表格', components: [] },
        ],
        dataModel: [
          {
            tableName: 'sales',
            description: '销售数据表',
            columns: [
              { name: 'date', type: 'date', description: '日期' },
              { name: 'amount', type: 'number', description: '销售金额' },
              { name: 'product', type: 'text', description: '产品名称' },
              { name: 'region', type: 'text', description: '地区' },
              { name: 'category', type: 'text', description: '类别' },
            ],
          },
        ],
        queries: [
          { name: 'getSalesSummary', description: '获取销售汇总', type: 'sql', sql: 'SELECT SUM(amount) as total, region FROM sales GROUP BY region', trigger: 'pageLoad' },
          { name: 'getSalesTrend', description: '获取销售趋势', type: 'sql', sql: 'SELECT date, SUM(amount) as total FROM sales GROUP BY date ORDER BY date', trigger: 'pageLoad' },
        ],
      };
    }

    // 默认返回员工管理系统
    return {
      appName: '员工管理系统',
      summary: '管理公司员工信息，包括增删改查功能',
      pages: [
        { name: '员工列表', handle: 'employees', description: '显示所有员工列表', components: [] },
      ],
      dataModel: [
        {
          tableName: 'employees',
          description: '员工信息表',
          columns: [
            { name: 'name', type: 'text', description: '姓名' },
            { name: 'email', type: 'text', description: '邮箱' },
            { name: 'department', type: 'text', description: '部门' },
          ],
        },
      ],
      queries: [
        { name: 'getAllEmployees', description: '获取所有员工', type: 'sql', sql: 'SELECT * FROM employees', trigger: 'pageLoad' },
      ],
    };
  }

  private getMockAppDefinition(requirement: any): any {
    const pageId = `page_${Math.random().toString(36).substring(2, 10)}`;
    const tableId = `cmp_${Math.random().toString(36).substring(2, 10)}`;
    const queryId = `qry_${Math.random().toString(36).substring(2, 10)}`;

    const tableName = requirement.dataModel?.[0]?.tableName || 'employees';
    const columns = requirement.dataModel?.[0]?.columns || [
      { name: 'id', type: 'text' },
      { name: 'name', type: 'text' },
    ];

    return {
      pages: [
        {
          id: pageId,
          name: requirement.pages?.[0]?.name || '首页',
          handle: requirement.pages?.[0]?.handle || 'home',
          components: [
            {
              id: tableId,
              type: 'Table',
              name: '数据表格',
              props: {
                dataSource: queryId,
                columns: columns.map((col: any) => ({
                  title: col.name,
                  dataIndex: col.name,
                  key: col.name,
                })),
                pagination: true,
                pageSize: 10,
                showSearch: true,
                rowSelection: 'none',
              },
              style: { x: 24, y: 24, width: 960, height: 400 },
              events: [],
            },
          ],
          queries: [
            {
              id: queryId,
              name: requirement.queries?.[0]?.name || 'getData',
              dataSourceId: '__NOVADB__',
              type: 'sql',
              content: {
                sql: requirement.queries?.[0]?.sql || `SELECT * FROM ${tableName}`,
              },
              options: {},
            },
          ],
        },
      ],
    };
  }

  // ==========================================
  // 1. 需求分析
  // ==========================================
  async analyzeRequirement(
    input: string,
    appId: string | undefined,
    userId: string,
  ): Promise<any> {
    // 1) 获取或创建 session
    const session = await this.getOrCreateSession(appId, userId);

    // 2) 保存用户消息
    await this.saveMessage(session.id, 'user', input);

    // Mock mode
    if (this.mockMode) {
      const requirement = this.getMockRequirement(input);
      const responseText = JSON.stringify(requirement, null, 2);

      await this.saveMessage(session.id, 'assistant', responseText, {
        type: 'requirement',
        data: requirement,
      });

      return { ...requirement, sessionId: session.id };
    }

    // 3) 构建 prompt
    const prompt = this.promptManager.get('requirement-analysis', {
      userInput: input,
      availableComponents: this.getAvailableComponentTypes(),
      supportedDataTypes: ['text', 'number', 'boolean', 'datetime'],
    });

    // 4) 调用 Claude
    const responseText = await this.callClaude(prompt);

    // 5) 解析 JSON
    const requirement = this.extractJSON(responseText);

    // 6) 保存 AI 回复
    await this.saveMessage(session.id, 'assistant', responseText, {
      type: 'requirement',
      data: requirement,
    });

    return { ...requirement, sessionId: session.id };
  }

  // ==========================================
  // 2. 应用生成
  // ==========================================
  async generateApp(
    requirement: any,
    appId: string,
    userId: string,
    userRole: UserRole = 'builder',
  ): Promise<any> {
    // Mock mode
    if (this.mockMode) {
      const appDef = this.getMockAppDefinition(requirement);

      // Get NovaDB datasource ID
      let novadbDsId = '';
      try {
        const novadbDs = await this.dataSourceService.findByType('novadb');
        if (novadbDs) {
          novadbDsId = novadbDs.id;
        }
      } catch (e) {
        console.warn('NovaDB datasource not found, using fallback');
      }

      // Replace __NOVADB__ with actual ID
      appDef.pages.forEach((page: any) => {
        if (page.queries) {
          page.queries.forEach((q: any) => {
            if (q.dataSourceId === '__NOVADB__') {
              q.dataSourceId = novadbDsId;
            }
          });
        }
      });

      // Save to app
      await this.appService.update(appId, userId, userRole, { definitionDraft: appDef });

      // Save AI message
      const session = await this.getOrCreateSession(appId, userId);
      await this.saveMessage(session.id, 'assistant', '应用已生成（模拟模式）', {
        type: 'generation',
        data: { appDefinition: appDef, createdTables: requirement.dataModel?.map((t: any) => t.tableName) || [] },
      });

      return { appDefinition: appDef, createdTables: requirement.dataModel?.map((t: any) => t.tableName) || [] };
    }

    // 1) 根据 dataModel 创建 NovaDB 表
    const tableIdMap = await this.createNovaDBTables(requirement.dataModel, userId);

    // 2) 获取 NovaDB 默认数据源 ID
    const novadbDsId = await this.getNovaDBDataSourceId();

    // 3) 构建生成 prompt
    const prompt = this.promptManager.get('app-generation', {
      requirement,
      componentSchemas: this.getComponentSchemas(),
    });

    // 4) 调用 Claude
    const responseText = await this.callClaude(prompt);

    // 5) 解析 AppDefinition
    let appDef = this.extractJSON(responseText);

    // 6) 后处理：替换 __NOVADB__、确保 ID 唯一、修复缺失字段
    appDef = this.postProcess(appDef, novadbDsId, tableIdMap);

    // 7) 校验并修复
    appDef = this.validateAndFix(appDef);

    // 8) 保存到 App 的 definition_draft
    await this.appService.update(appId, userId, userRole, { definitionDraft: appDef });

    // 9) 保存 AI 消息
    const session = await this.getOrCreateSession(appId, userId);
    await this.saveMessage(session.id, 'assistant', '应用已生成', {
      type: 'generation',
      data: { appDefinition: appDef, createdTables: Object.keys(tableIdMap) },
    });

    return { appDefinition: appDef, createdTables: Object.keys(tableIdMap) };
  }

  // ==========================================
  // 3. SQL 生成
  // ==========================================
  async generateSQL(
    description: string,
    dataSourceId: string,
  ): Promise<{ sql: string; explanation: string }> {
    // 1) 获取数据源 Schema
    const schema = await this.dataSourceService.getSchema(dataSourceId);

    // 2) 构建 prompt
    const prompt = this.promptManager.get('sql-generation', {
      description,
      tables: schema.tables || [],
    });

    // 3) 调用 Claude
    const responseText = await this.callClaude(prompt);

    // 4) 解析
    return this.extractJSON(responseText);
  }

  // ==========================================
  // 4. 增量修改 - 生成 Patch
  // ==========================================
  async modifyApp(
    instruction: string,
    appId: string,
    pageId: string | undefined,
    userId: string,
    userRole: UserRole = 'builder',
  ): Promise<{ patch: AppPatch; appDefinition: any }> {
    // 1) 获取当前应用定义
    const app = await this.appService.findById(appId);
    const currentDefinition = app.definitionDraft;

    // 2) 获取 NovaDB 表结构
    const novaTables = await this.novadbService.findAllTables();
    const dataModel = novaTables.map((t) => ({
      tableName: t.name,
      columns: t.columns.map((c) => ({
        name: c.name,
        type: c.type,
      })),
    }));

    // 3) 构建 prompt
    const prompt = incrementalModifyPrompt({
      userInstruction: instruction,
      currentDefinition,
      componentSchemas: this.getComponentSchemas(),
      availableComponents: this.getAvailableComponentTypes(),
      dataModel,
    });

    // 4) 调用 Claude
    const responseText = await this.callClaude(prompt);

    // 5) 解析 patch
    const patch = this.extractJSON(responseText) as AppPatch;

    // 6) 验证 patch
    if (!patch.summary || !Array.isArray(patch.actions)) {
      throw new BadRequestException('AI 返回的 patch 格式无效');
    }

    // 7) 保存用户消息
    const session = await this.getOrCreateSession(appId, userId);
    await this.saveMessage(session.id, 'user', instruction, {
      type: 'modification',
      data: { patch, pageId },
    });

    // 8) 保存 AI 回复
    await this.saveMessage(session.id, 'assistant', patch.summary, {
      type: 'modification',
      data: { patch, pageId },
    });

    return { patch, appDefinition: currentDefinition };
  }

  // ==========================================
  // 5. 增量修改 - 应用 Patch
  // ==========================================
  async applyPatch(
    appId: string,
    patch: AppPatch,
    pageId: string | undefined,
    userId: string,
    userRole: UserRole = 'builder',
  ): Promise<{ appDefinition: any }> {
    // 1) 获取当前应用定义
    const app = await this.appService.findById(appId);
    const definition = JSON.parse(JSON.stringify(app.definitionDraft || { pages: [] }));

    // 2) 遍历 actions 并应用
    for (const action of patch.actions) {
      await this.applyPatchAction(definition, action, pageId);
    }

    // 3) 保存更新后的定义
    await this.appService.update(appId, userId, userRole, { definitionDraft: definition });

    // 4) 保存确认消息
    const session = await this.getOrCreateSession(appId, userId);
    await this.saveMessage(session.id, 'assistant', `已应用修改：${patch.summary}`, {
      type: 'patchApplied',
      data: { patch },
    });

    return { appDefinition: definition };
  }

  private async applyPatchAction(
    definition: any,
    action: PatchAction,
    defaultPageId?: string,
  ): Promise<void> {
    const pages = definition.pages || [];

    switch (action.type) {
      case 'updateComponent': {
        // 使用点号路径更新属性
        const { componentId, changes } = action;
        for (const page of pages) {
          const component = (page.components || []).find((c: any) => c.id === componentId);
          if (component) {
            for (const [path, value] of Object.entries(changes)) {
              this.setByPath(component, path, value);
            }
            break;
          }
        }
        break;
      }

      case 'addComponent': {
        const { component, pageId } = action;
        const targetPage = pageId
          ? pages.find((p: any) => p.id === pageId)
          : pages[0];
        if (targetPage) {
          if (!targetPage.components) targetPage.components = [];
          targetPage.components.push(component);
        }
        break;
      }

      case 'removeComponent': {
        const { componentId } = action;
        for (const page of pages) {
          page.components = (page.components || []).filter((c: any) => c.id !== componentId);
        }
        break;
      }

      case 'addQuery': {
        const { query, pageId } = action;
        const targetPage = pageId
          ? pages.find((p: any) => p.id === pageId)
          : pages[0];
        if (targetPage) {
          if (!targetPage.queries) targetPage.queries = [];
          targetPage.queries.push(query);
        }
        break;
      }

      case 'updateQuery': {
        const { queryId, changes } = action;
        for (const page of pages) {
          const query = (page.queries || []).find((q: any) => q.id === queryId);
          if (query) {
            for (const [path, value] of Object.entries(changes)) {
              this.setByPath(query, path, value);
            }
            break;
          }
        }
        break;
      }

      case 'removeQuery': {
        const { queryId } = action;
        for (const page of pages) {
          page.queries = (page.queries || []).filter((q: any) => q.id !== queryId);
        }
        break;
      }

      case 'addColumn': {
        const { tableName, column } = action;
        // 查找 NovaDB 表
        const table = await this.novadbService.findTableByName(tableName);
        if (table) {
          // 幂等：如果列已存在则跳过
          const existingCol = table.columns.find((c) => c.name === column.name);
          if (!existingCol) {
            await this.novadbService.addColumn(table.id, {
              name: column.name,
              type: column.type as any,
            });
          }
        }
        break;
      }

      case 'addTable': {
        const { table } = action;
        // 幂等：如果表已存在则跳过
        const existing = await this.novadbService.findTableByName(table.tableName);
        if (!existing) {
          const newTable = await this.novadbService.createTable(table.tableName, 'ai');
          // 添加列
          for (const col of table.columns || []) {
            await this.novadbService.addColumn(newTable.id, {
              name: col.name,
              type: col.type as any,
            });
          }
        }
        break;
      }
    }
  }

  private setByPath(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }

  // ==========================================
  // 4. 获取会话历史
  // ==========================================
  async getSessionMessages(appId: string, userId: string): Promise<AiMessage[]> {
    const session = await this.sessionRepo.findOne({
      where: { appId, userId },
      order: { createdAt: 'DESC' },
    });
    if (!session) return [];
    return this.messageRepo.find({
      where: { sessionId: session.id },
      order: { createdAt: 'ASC' },
    });
  }

  // ==========================================
  // 辅助方法
  // ==========================================

  private async callClaude(prompt: string): Promise<string> {
    if (this.provider === 'minimax') {
      return this.callMiniMax(prompt);
    }

    if (!this.anthropic) {
      throw new InternalServerErrorException('AI 服务未配置，请设置 ANTHROPIC_API_KEY 或 MINIMAX_API_KEY');
    }
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text : '';
    } catch (error: any) {
      throw new InternalServerErrorException(`AI 服务调用失败: ${error.message}`);
    }
  }

  private async callMiniMax(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.minimax.chat/v1/text/chatcompletion_v2',
        {
          model: 'abab6.5s-chat',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 8192,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.minimaxApiKey}`,
            'Content-Type': 'application/json',
            'GroupId': this.minimaxGroupId,
          },
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content;
      }

      throw new Error('Invalid MiniMax response');
    } catch (error: any) {
      throw new InternalServerErrorException(`MiniMax AI 服务调用失败: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  private extractJSON(text: string): any {
    // 提取 JSON（可能被 ```json ``` 包裹）
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = match ? match[1].trim() : text.trim();
    try {
      return JSON.parse(jsonStr);
    } catch {
      throw new BadRequestException('AI 返回的内容无法解析为 JSON，请重试');
    }
  }

  private async createNovaDBTables(
    dataModel: any[],
    userId: string,
  ): Promise<Record<string, string>> {
    const tableIdMap: Record<string, string> = {};
    if (!dataModel || !Array.isArray(dataModel)) return tableIdMap;

    for (const model of dataModel) {
      // 创建表
      const table = await this.novadbService.createTable(model.tableName, userId);
      tableIdMap[model.tableName] = table.id;

      // 创建列（跳过 id 和 created_at，它们自动生成）
      if (model.columns && Array.isArray(model.columns)) {
        for (const col of model.columns) {
          if (['id', 'created_at'].includes(col.name)) continue;
          await this.novadbService.addColumn(table.id, {
            name: col.name,
            type: this.mapDataType(col.type) as any,
          });
        }
      }
    }
    return tableIdMap;
  }

  private mapDataType(type: string): string {
    const map: Record<string, string> = {
      text: 'text', string: 'text', varchar: 'text',
      number: 'number', integer: 'number', int: 'number', float: 'number', decimal: 'number',
      boolean: 'boolean', bool: 'boolean',
      datetime: 'datetime', date: 'datetime', timestamp: 'datetime',
    };
    return map[type?.toLowerCase()] || 'text';
  }

  private postProcess(
    def: any,
    novadbDsId: string,
    tableIdMap: Record<string, string>,
  ): any {
    // 递归遍历所有 pages 和 queries
    if (def.pages && Array.isArray(def.pages)) {
      for (const page of def.pages) {
        // 替换查询的 dataSourceId
        if (page.queries && Array.isArray(page.queries)) {
          for (const query of page.queries) {
            if (query.dataSourceId === '__NOVADB__') {
              query.dataSourceId = novadbDsId;
            }
          }
        }
        // 确保 components 是数组
        if (!Array.isArray(page.components)) {
          page.components = [];
        }
      }
    }
    return def;
  }

  private validateAndFix(def: any): any {
    const validTypes = new Set(this.getAvailableComponentTypes());

    if (!def) def = {};
    if (!def.pages) def.pages = [];

    for (const page of def.pages) {
      // 确保 page 有必要字段
      if (!page.id) page.id = `page_${this.randomId()}`;
      if (!page.handle) page.handle = page.name?.toLowerCase().replace(/\s+/g, '-') || 'page';
      if (!page.components) page.components = [];
      if (!page.queries) page.queries = [];

      // 过滤无效组件类型
      page.components = page.components.filter((c: any) => {
        if (!c.type || !validTypes.has(c.type)) return false;
        // 确保必要字段
        if (!c.id) c.id = `cmp_${this.randomId()}`;
        if (!c.props) c.props = {};
        if (!c.style) c.style = { x: 24, y: 24, width: 200, height: 40 };
        if (!c.events) c.events = [];
        // layout 值必须是正整数，对齐到 8px
        c.style.x = Math.max(0, Math.round(c.style.x / 8) * 8);
        c.style.y = Math.max(0, Math.round(c.style.y / 8) * 8);
        c.style.width = Math.max(40, Math.round(c.style.width / 8) * 8);
        c.style.height = Math.max(24, Math.round(c.style.height / 8) * 8);
        return true;
      });

      // 确保查询有必要字段
      for (const q of page.queries) {
        if (!q.id) q.id = `qry_${this.randomId()}`;
        if (!q.type) q.type = 'sql';
        if (!q.content) q.content = { sql: '' };
        if (!q.options) q.options = {};
      }
    }
    return def;
  }

  private randomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private async getOrCreateSession(appId: string | undefined, userId: string): Promise<AiSession> {
    if (appId) {
      const existing = await this.sessionRepo.findOne({
        where: { appId, userId },
        order: { createdAt: 'DESC' },
      });
      if (existing) return existing;
    }
    return this.sessionRepo.save(this.sessionRepo.create({ appId, userId }));
  }

  private async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any,
  ) {
    await this.messageRepo.save(
      this.messageRepo.create({ sessionId, role, content, metadata }),
    );
  }

  private async getNovaDBDataSourceId(): Promise<string> {
    // 查找 type='novadb' 的数据源
    const novadbDs = await this.dataSourceService.findByType('novadb');
    if (!novadbDs) {
      throw new InternalServerErrorException('NovaDB 数据源未初始化，请联系管理员');
    }
    return novadbDs.id;
  }

  private getAvailableComponentTypes(): string[] {
    return [
      'Table', 'ListView', 'Chart', 'Stat',
      'TextInput', 'NumberInput', 'Select', 'DatePicker', 'FileUpload', 'RichTextEditor',
      'Container', 'Tabs', 'Modal',
      'Button', 'Toggle', 'Checkbox', 'Spinner',
      'Image', 'PDFViewer', 'SidebarNav',
    ];
  }

  private getComponentSchemas(): Record<string, any> {
    return {
      Table: {
        props: {
          columns: '列配置数组 [{ title, dataIndex, key, type }]',
          pagination: 'boolean 是否分页',
          pageSize: 'number 每页条数',
          showSearch: 'boolean 是否显示搜索',
          rowSelection: '"none" | "single" | "multiple"',
        },
        defaultSize: { width: 960, height: 400 },
      },
      Button: {
        props: {
          text: '按钮文字',
          type: '"primary" | "default" | "dashed" | "danger"',
          size: '"small" | "middle" | "large"',
        },
        defaultSize: { width: 120, height: 40 },
      },
      TextInput: {
        props: {
          label: '标签', placeholder: '占位符',
          defaultValue: '默认值', required: 'boolean',
        },
        defaultSize: { width: 240, height: 40 },
      },
      NumberInput: {
        props: {
          label: '标签', min: '最小值', max: '最大值', step: '步进',
        },
        defaultSize: { width: 240, height: 40 },
      },
      Select: {
        props: {
          label: '标签', placeholder: '占位符',
          options: '选项数组 [{ label, value }]',
          mode: '"single" | "multiple"',
        },
        defaultSize: { width: 240, height: 40 },
      },
      DatePicker: {
        props: { label: '标签', format: '日期格式' },
        defaultSize: { width: 240, height: 40 },
      },
      Stat: {
        props: {
          title: '标题', prefix: '前缀', suffix: '后缀', icon: '图标',
        },
        defaultSize: { width: 220, height: 120 },
      },
      Chart: {
        props: {
          chartType: '"bar" | "line" | "pie" | "doughnut"',
          xField: 'X轴字段', yField: 'Y轴字段', title: '标题',
        },
        defaultSize: { width: 480, height: 320 },
      },
      Container: {
        props: { backgroundColor: '背景色', borderRadius: '圆角', padding: '内边距' },
        defaultSize: { width: 400, height: 300 },
      },
      Modal: {
        props: { title: '弹窗标题', width: '宽度', closable: 'boolean' },
        defaultSize: { width: 520, height: 400 },
      },
      Tabs: {
        props: { tabs: '标签页数组 [{ key, label }]' },
        defaultSize: { width: 600, height: 400 },
      },
      Toggle: { props: { label: '标签', defaultChecked: 'boolean' }, defaultSize: { width: 120, height: 32 } },
      Checkbox: { props: { label: '标签', defaultChecked: 'boolean' }, defaultSize: { width: 120, height: 32 } },
      Spinner: { props: { size: '"small" | "default" | "large"' }, defaultSize: { width: 40, height: 40 } },
      Image: { props: { src: '图片URL', alt: '描述', fit: '"cover" | "contain"' }, defaultSize: { width: 240, height: 160 } },
      PDFViewer: { props: { src: 'PDF URL' }, defaultSize: { width: 600, height: 400 } },
      FileUpload: { props: { accept: '文件类型', maxSize: '最大大小MB', multiple: 'boolean' }, defaultSize: { width: 240, height: 80 } },
      RichTextEditor: { props: { defaultValue: '默认内容', placeholder: '占位符' }, defaultSize: { width: 600, height: 300 } },
      ListView: { props: { rowHeight: '行高' }, defaultSize: { width: 400, height: 400 } },
      SidebarNav: { props: { collapsed: 'boolean' }, defaultSize: { width: 200, height: 600 } },
    };
  }
}
