# NovaBuilder MVP 技术架构

创建者: HMJ
创建时间: 2026年3月5日 11:29
类别: 产品文档
上次编辑者: HMJ
上次更新时间: 2026年3月5日 12:02

<aside>
📋

**文档信息**

**产品名称：** NovaBuilder · AI 原生低代码应用开发平台 — **MVP 技术架构**

**版本：** MVP v0.1　|　**文档日期：** 2026-03-05　|　**状态：** 规划中

**文档作者：** HMJ

**关联文档：** [PRD_NovaBuilder_MVP](https://www.notion.so/PRD_NovaBuilder_MVP-79b61819ea784b2fb44d2487882c9efd?pvs=21)（MVP PRD）　|　[PRD_NovaBuilder](https://www.notion.so/PRD_NovaBuilder-f0937e708cae821f819f81c33b0cb297?pvs=21)（完整 PRD）

</aside>

---

# 一、架构总览

## 1.1 设计原则

| **原则** | **说明** | **MVP 体现** |
| --- | --- | --- |
| 🧩 **模块化** | 各模块职责单一、边界清晰、可独立演进 | 前后端分离，NestJS 模块化架构，组件 Registry 模式 |
| 📐 **分层解耦** | 表示层、业务层、数据层严格分离 | Controller → Service → Repository 三层架构 |
| 🔌 **可扩展** | 核心抽象稳定，扩展点开放 | 数据源 Adapter 模式、组件 Plugin 机制、AI Provider 抽象 |
| 🚀 **MVP 优先** | 先跑通闭环，不过度设计 | Docker Compose 单机部署，不引入 K8s/MQ 等重依赖 |
| 🤖 **AI 原生** | AI 不是附加功能，而是核心架构组成 | AI Service 与应用生命周期深度集成 |

## 1.2 系统架构总览

```mermaid
graph TB
    subgraph Client["🖥️ 前端 React + TypeScript :3000"]
        direction TB
        Shell["App Shell<br>路由 / 布局 / 全局状态"]
        subgraph Pages["页面模块"]
            Auth["认证页面<br>登录 / 注册"]
            Dashboard["工作台<br>应用列表"]
            EditorPage["应用编辑器"]
            PreviewPage["应用预览"]
            DBAdmin["NovaDB 管理"]
            DSConfig["数据源配置"]
            AdminPage["管理后台<br>用户 / 角色"]
        end
        subgraph Core["核心引擎"]
            DnD["拖拽引擎<br>@dnd-kit"]
            Renderer["渲染引擎<br>组件树 → UI"]
            EventBus["事件总线"]
            StateManager["状态管理<br>Zustand"]
        end
        subgraph Editors["编辑器"]
            CM["CodeMirror 6<br>SQL / JS"]
            PropPanel["属性面板"]
            AIPanel["AI 对话面板"]
        end
        Shell --> Pages
        EditorPage --> Core
        EditorPage --> Editors
    end

    subgraph Server["⚙️ 后端 NestJS + TypeScript :4000"]
        direction TB
        Gateway["API Gateway<br>Guards / Pipes / Interceptors"]
        subgraph Modules["业务模块"]
            AuthMod["Auth Module<br>JWT + RBAC"]
            AppMod["App Module<br>CRUD / 版本管理"]
            QueryMod["Query Module<br>SQL / JS 执行"]
            DSMod["DataSource Module<br>连接管理"]
            NovaDBMod["NovaDB Module<br>表 / 列 / 数据"]
            AIMod["AI Module<br>生成 / 修改"]
            UserMod["User Module<br>用户管理"]
        end
        subgraph Infra["基础设施"]
            TypeORM["TypeORM<br>ORM 层"]
            CryptoSvc["Crypto Service<br>凭证加密"]
            Sandbox["JS Sandbox<br>vm2"]
        end
        Gateway --> Modules
        Modules --> Infra
    end

    subgraph Data["💾 数据层"]
        PG[("PostgreSQL :5432<br>platform_db 元数据<br>nova_db 用户数据")]
        Redis[("Redis :6379<br>Session / Cache")]
    end

    subgraph External["🌐 外部"]
        Claude["Anthropic Claude API"]
        UserPG[("用户 PostgreSQL")]
        UserMySQL[("用户 MySQL")]
        UserAPI["用户 REST API"]
    end

    Client -->|"HTTP / WebSocket"| Server
    Server --> Data
    DSMod --> UserPG
    DSMod --> UserMySQL
    DSMod --> UserAPI
    AIMod --> Claude
```

## 1.3 技术栈一览

| **层级** | **技术** | **版本** | **选型理由** |
| --- | --- | --- | --- |
| **前端框架** | React + TypeScript | React 18 / TS 5.x | 生态成熟、类型安全、Claude Code 生成质量高 |
| **状态管理** | Zustand | 4.x | 轻量、TypeScript 友好、无 boilerplate |
| **拖拽引擎** | @dnd-kit | 6.x | 现代 React DnD 方案、高度可定制、性能优秀 |
| **代码编辑器** | CodeMirror 6 | 6.x | 模块化架构、SQL/JS 语法高亮、轻量 |
| **UI 组件库** | Ant Design | 5.x | 中文友好、企业级组件丰富、与 React 深度集成 |
| **HTTP 客户端** | Axios | 1.x | 拦截器机制方便统一处理鉴权和错误 |
| **路由** | React Router | 6.x | 标准 React 路由方案 |
| **构建工具** | Vite | 5.x | 开发体验极佳、HMR 快、ESBuild 加速 |
| **后端框架** | NestJS + TypeScript | 10.x / TS 5.x | 模块化、装饰器驱动、DI 容器、适合 Claude Code |
| **ORM** | TypeORM | 0.3.x | TypeScript 原生支持、与 NestJS 集成好、支持 Migration |
| **鉴权** | Passport + JWT | — | NestJS 官方推荐、策略模式可扩展 |
| **数据库** | PostgreSQL | 16.x | 功能强大、JSONB 支持、NovaDB 底层 |
| **缓存** | Redis | 7.x | 会话管理、查询缓存 |
| **AI** | Anthropic Claude API | claude-3.5-sonnet | 代码生成质量高、支持长上下文 |
| **JS 沙箱** | vm2 / isolated-vm | — | 安全执行用户 JS 查询 |
| **容器化** | Docker Compose | — | MVP 单机部署、一键启动 |
| **Monorepo** | pnpm Workspace | — | 高效依赖管理、共享类型定义 |

---

# 二、前端架构

## 2.1 整体分层

```mermaid
graph TB
    subgraph UI["UI 层"]
        Pages2["Pages<br>路由页面"]
        Components["Components<br>通用 UI 组件"]
        Layouts["Layouts<br>页面布局"]
    end
    subgraph Engine["引擎层"]
        DnDEngine["DnD Engine<br>拖拽核心"]
        RenderEngine["Render Engine<br>组件树渲染"]
        EventEngine["Event Engine<br>事件分发"]
        DataBinding["Data Binding<br>数据绑定引擎"]
    end
    subgraph Store["状态层 Zustand"]
        AppStore["App Store<br>应用元数据"]
        EditorStore["Editor Store<br>编辑器状态"]
        ComponentStore["Component Store<br>组件树"]
        QueryStore["Query Store<br>查询状态"]
        HistoryStore["History Store<br>Undo / Redo"]
    end
    subgraph Service["服务层"]
        APIClient["API Client<br>Axios 封装"]
        AuthService["Auth Service<br>Token 管理"]
        WSClient["WebSocket Client<br>实时通信（预留）"]
    end

    UI --> Engine
    UI --> Store
    Engine --> Store
    Store --> Service
```

## 2.2 核心数据模型：组件树

组件树是可视化编辑器的核心数据结构，所有 UI 操作最终都映射为组件树的变更。

```mermaid
classDiagram
    class AppDefinition {
        +string id
        +string name
        +PageDef[] pages
        +GlobalStyle globalStyle
        +AppMeta meta
    }
    class PageDef {
        +string id
        +string name
        +string handle
        +ComponentNode[] components
        +Query[] queries
    }
    class ComponentNode {
        +string id
        +string type
        +ComponentProps properties
        +EventHandler[] events
        +DataBinding[] bindings
        +LayoutConfig layout
        +ComponentNode[] children
    }
    class ComponentProps {
        +Record~string, any~ static
        +Record~string, string~ dynamic
    }
    class EventHandler {
        +string eventName
        +Action[] actions
    }
    class Action {
        +string type
        +Record~string, any~ params
    }
    class DataBinding {
        +string propertyPath
        +string expression
    }
    class LayoutConfig {
        +number x
        +number y
        +number width
        +number height
    }
    AppDefinition --> PageDef
    PageDef --> ComponentNode
    ComponentNode --> ComponentProps
    ComponentNode --> EventHandler
    ComponentNode --> DataBinding
    ComponentNode --> LayoutConfig
    ComponentNode --> ComponentNode : children
    EventHandler --> Action
```

### TypeScript 类型定义

```tsx
// === 应用定义 ===
interface AppDefinition {
  id: string;
  name: string;
  pages: PageDef[];
  globalStyle: GlobalStyle;
  meta: AppMeta;
}

interface PageDef {
  id: string;
  name: string;
  handle: string; // URL path
  components: ComponentNode[];
  queries: QueryDef[];
}

// === 组件树节点 ===
interface ComponentNode {
  id: string; // nanoid 生成
  type: ComponentType; // 'Table' | 'Button' | 'TextInput' ...
  properties: {
    static: Record<string, any>;    // 固定值属性
    dynamic: Record<string, string>; // 表达式绑定  queries.q1.data 
  };
  events: EventHandler[];
  layout: {
    x: number; y: number;
    width: number; height: number;
  };
  children?: ComponentNode[]; // 容器组件包含子组件
  styles?: Record<string, string>;
}

// === 事件系统 ===
interface EventHandler {
  eventName: string; // 'onClick' | 'onRowClick' | 'onSubmit'
  actions: Action[];
}

type Action =
  | { type: 'runQuery'; queryId: string }
  | { type: 'setComponentValue'; componentId: string; value: string }
  | { type: 'navigateTo'; pageId: string }
  | { type: 'showNotification'; message: string; level: 'success' | 'error' | 'info' }
  | { type: 'openModal'; modalId: string }
  | { type: 'closeModal'; modalId: string };

// === 查询定义 ===
interface QueryDef {
  id: string;
  name: string;
  dataSourceId: string;
  type: 'sql' | 'javascript' | 'visual' | 'restapi';
  config: SQLQueryConfig | JSQueryConfig | VisualQueryConfig | RESTQueryConfig;
  triggers: ('pageLoad' | 'manual')[];
  transformer?: string; // JS 转换代码
}
```

## 2.3 状态管理架构

使用 Zustand 进行全局状态管理，按职责划分为多个 Store：

```tsx
// === Editor Store：编辑器全局状态 ===
interface EditorState {
  // 当前状态
  currentAppId: string | null;
  currentPageId: string | null;
  selectedComponentId: string | null;
  mode: 'edit' | 'preview';
  isDirty: boolean;

  // 操作
  selectComponent: (id: string | null) => void;
  setMode: (mode: 'edit' | 'preview') => void;
}

// === Component Store：组件树状态 ===
interface ComponentState {
  // 组件树
  pages: Record<string, PageDef>;

  // CRUD 操作
  addComponent: (pageId: string, component: ComponentNode) => void;
  removeComponent: (pageId: string, componentId: string) => void;
  updateComponent: (pageId: string, componentId: string, updates: Partial<ComponentNode>) => void;
  moveComponent: (pageId: string, componentId: string, layout: LayoutConfig) => void;

  // 批量操作
  duplicateComponent: (pageId: string, componentId: string) => void;
}

// === History Store：撤销/重做 ===
interface HistoryState {
  past: Snapshot[];
  future: Snapshot[];
  push: (snapshot: Snapshot) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

// === Query Store：查询运行时状态 ===
interface QueryRuntimeState {
  results: Record<string, {
    data: any;
    isLoading: boolean;
    error: string | null;
    lastRunAt: number;
  }>;
  runQuery: (queryId: string, params?: Record<string, any>) => Promise<void>;
}
```

## 2.4 组件 Registry 机制

所有 20 个 MVP 组件通过统一的 Registry 注册和管理：

```mermaid
graph LR
    subgraph Registry["Component Registry"]
        R["Registry Map<br>type → ComponentDef"]
    end
    subgraph Def["ComponentDef"]
        Meta["metadata<br>name / icon / category"]
        Render["render<br>React Component"]
        PropSchema["propertySchema<br>属性面板配置"]
        DefaultProps["defaultProperties<br>默认属性值"]
        EventDefs["eventDefinitions<br>支持的事件"]
    end
    Registry --> Def
```

```tsx
// 组件定义接口
interface ComponentDefinition {
  type: ComponentType;
  metadata: {
    name: string;        // 显示名称
    nameEn: string;      // 英文名
    icon: string;        // 图标
    category: 'data-display' | 'form-input' | 'layout' | 'action' | 'media' | 'navigation';
    description: string;
  };
  render: React.FC<ComponentRenderProps>; // 渲染组件
  propertySchema: PropertyField[];        // 属性面板 Schema
  defaultProperties: Record<string, any>; // 默认属性
  eventDefinitions: EventDef[];           // 可触发事件
  layoutConstraints?: {                   // 布局约束
    minWidth: number;
    minHeight: number;
    resizable: boolean;
  };
}

// 注册组件
const registry = new Map<ComponentType, ComponentDefinition>();

function registerComponent(def: ComponentDefinition) {
  registry.set(def.type, def);
}

// MVP 20 个组件注册
registerComponent(TableComponent);     // 表格
registerComponent(ListViewComponent);  // 列表
registerComponent(ChartComponent);     // 图表
registerComponent(StatComponent);      // 统计卡片
registerComponent(TextInputComponent); // 文本输入
registerComponent(NumberInputComponent); // 数字输入
registerComponent(SelectComponent);    // 下拉选择
registerComponent(DatePickerComponent); // 日期选择
registerComponent(FileUploadComponent); // 文件上传
registerComponent(RichTextComponent);  // 富文本
registerComponent(ContainerComponent); // 容器
registerComponent(TabsComponent);      // 标签页
registerComponent(ModalComponent);     // 模态框
registerComponent(ButtonComponent);    // 按钮
registerComponent(ToggleComponent);    // 开关
registerComponent(CheckboxComponent);  // 复选框
registerComponent(SpinnerComponent);   // 加载
registerComponent(ImageComponent);     // 图像
registerComponent(PDFViewerComponent); // PDF
registerComponent(SidebarNavComponent); // 侧边栏
```

## 2.5 数据绑定引擎

数据绑定是连接组件和查询结果的桥梁，使用  `expression`  语法：

```mermaid
graph LR
    A["组件属性<br> queries.getUsers.data "] --> B["绑定引擎<br>Expression Evaluator"]
    C["Query Store<br>查询结果"] --> B
    D["Component Store<br>组件值"] --> B
    B --> E["解析后的值<br>渲染到 UI"]
```

```tsx
// 表达式上下文
interface EvalContext {
  queries: Record<string, { data: any; isLoading: boolean }>;
  components: Record<string, { value: any; selectedRow?: any }>;
  currentUser: { id: string; email: string; role: string };
  urlParams: Record<string, string>;
}

// 安全表达式求值（非 eval，使用 Function 构造器 + 白名单）
function evaluateExpression(expr: string, context: EvalContext): any {
  // 1. 解析   内的表达式
  // 2. 在沙箱上下文中求值
  // 3. 返回结果
}

// 示例绑定
//  queries.getUsers.data              → 查询结果
//  components.searchInput.value       → 组件值
//  queries.getUsers.data.length       → 表达式计算
//  currentUser.role === 'admin'       → 条件判断
```

## 2.6 前端路由设计

```tsx
const routes = [
  // --- 公开路由 ---
  { path: '/login',               component: LoginPage },
  { path: '/register',            component: RegisterPage },

  // --- Builder 路由（需认证 + Builder/Admin 角色）---
  { path: '/',                    component: DashboardPage },     // 应用列表
  { path: '/apps/:appId/edit',    component: EditorPage },        // 应用编辑器
  { path: '/apps/:appId/preview', component: PreviewPage },       // 预览
  { path: '/novadb',              component: NovaDBPage },        // NovaDB 管理
  { path: '/novadb/:tableId',     component: NovaDBTablePage },   // 表详情
  { path: '/datasources',        component: DataSourceListPage }, // 数据源列表
  { path: '/datasources/:id',    component: DataSourceEditPage }, // 数据源配置
  { path: '/queries',             component: QueryBuilderPage },  // 查询构建器

  // --- Admin 路由（需 Admin 角色）---
  { path: '/admin/users',         component: UserManagePage },    // 用户管理
  { path: '/admin/settings',      component: SettingsPage },      // 平台设置

  // --- End User 路由 ---
  { path: '/apps/:appId',         component: AppRunnerPage },     // 运行已发布应用
  { path: '/apps/:appId/:pageHandle', component: AppRunnerPage }, // 应用子页面
];
```

---

# 三、后端架构

## 3.1 NestJS 模块结构

```mermaid
graph TB
    subgraph AppModule["AppModule（根模块）"]
        direction TB
        subgraph Core["核心模块"]
            AuthModule["AuthModule<br>JWT / Passport / RBAC"]
            UserModule["UserModule<br>用户 CRUD"]
            ConfigModule2["ConfigModule<br>环境变量"]
        end
        subgraph Business["业务模块"]
            AppMgmtModule["AppModule<br>应用 CRUD / 版本"]
            QueryModule["QueryModule<br>查询执行"]
            DataSourceModule["DataSourceModule<br>数据源连接"]
            NovaDBModule["NovaDBModule<br>内置数据库"]
            AIModule["AIModule<br>AI 生成"]
        end
        subgraph Shared["共享模块"]
            CryptoModule["CryptoModule<br>加密服务"]
            CacheModule["CacheModule<br>Redis"]
            LoggerModule["LoggerModule<br>日志"]
        end
    end
    Core --> Shared
    Business --> Core
    Business --> Shared
```

## 3.2 各模块详细设计

### AuthModule — 认证与授权

```mermaid
sequenceDiagram
    participant C as Client
    participant G as Guard
    participant A as AuthService
    participant U as UserService
    participant R as Redis
    participant P as PostgreSQL

    Note over C,P: 登录流程
    C->>A: POST /auth/login {email, password}
    A->>U: validateUser(email, password)
    U->>P: SELECT * FROM users WHERE email = ?
    P-->>U: user record
    U->>U: bcrypt.compare(password, hash)
    U-->>A: user
    A->>A: generateTokens(user)
    A->>R: SET session:{userId} {refreshToken}
    A-->>C: { accessToken, refreshToken }

    Note over C,P: 请求鉴权
    C->>G: Request + Bearer Token
    G->>G: JWT verify(token)
    G->>G: checkRole(user.role, requiredRole)
    G-->>C: 403 Forbidden / Pass
```

```tsx
// RBAC 角色守卫
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    return requiredRoles.some(role => user.role === role);
  }
}

// 使用装饰器控制权限
@Controller('apps')
export class AppController {
  @Post()
  @Roles(Role.ADMIN, Role.BUILDER)  // 只有 Admin 和 Builder 可创建应用
  create(@Body() dto: CreateAppDto) { ... }

  @Get(':id/published')
  @Roles(Role.ADMIN, Role.BUILDER, Role.END_USER) // 所有角色可访问已发布应用
  getPublished(@Param('id') id: string) { ... }
}
```

### AppModule — 应用管理与版本控制

```mermaid
stateDiagram-v2
    [*] --> Draft: 创建应用
    Draft --> Draft: 编辑保存
    Draft --> Published: 发布
    Published --> Draft: 继续编辑（自动创建新 Draft）
    Published --> Rollback: 回滚
    Rollback --> Published: 恢复上一版
```

```tsx
// 应用实体
@Entity('apps')
export class App {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb' })
  definition_draft: AppDefinition;   // 当前编辑中的草稿

  @Column({ type: 'jsonb', nullable: true })
  definition_published: AppDefinition | null; // 已发布版本

  @Column({ type: 'jsonb', nullable: true })
  definition_previous: AppDefinition | null;  // 上一个发布版本（用于回滚）

  @Column({ type: 'enum', enum: AppStatus, default: AppStatus.DRAFT })
  status: AppStatus;

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 发布流程
async publish(appId: string): Promise<App> {
  const app = await this.appRepo.findOneOrFail(appId);
  app.definition_previous = app.definition_published;  // 备份当前发布版
  app.definition_published = app.definition_draft;     // 草稿 → 发布
  app.status = AppStatus.PUBLISHED;
  return this.appRepo.save(app);
}

// 回滚流程
async rollback(appId: string): Promise<App> {
  const app = await this.appRepo.findOneOrFail(appId);
  if (!app.definition_previous) throw new BadRequestException('无可回滚版本');
  app.definition_published = app.definition_previous;
  app.definition_previous = null;
  return this.appRepo.save(app);
}
```

### DataSourceModule — 数据源连接管理

```mermaid
graph TB
    subgraph Adapter["DataSource Adapter 模式"]
        Interface["IDataSourceAdapter<br>interface"]
        PGAdapter["PostgreSQLAdapter"]
        MySQLAdapter["MySQLAdapter"]
        RESTAdapter["RESTAPIAdapter"]
        NovaDBAdapter["NovaDBAdapter<br>内置"]
    end
    Interface --> PGAdapter
    Interface --> MySQLAdapter
    Interface --> RESTAdapter
    Interface --> NovaDBAdapter
```

```tsx
// 数据源适配器接口
interface IDataSourceAdapter {
  // 连接测试
  testConnection(config: DataSourceConfig): Promise<TestResult>;
  // 执行查询
  executeQuery(config: DataSourceConfig, query: string, params?: any[]): Promise<QueryResult>;
  // 获取 Schema（表/列信息）
  getSchema(config: DataSourceConfig): Promise<SchemaInfo>;
  // 断开连接
  disconnect(): Promise<void>;
}

// PostgreSQL 适配器
@Injectable()
export class PostgreSQLAdapter implements IDataSourceAdapter {
  private pools: Map<string, Pool> = new Map();

  async executeQuery(config: DataSourceConfig, query: string, params?: any[]): Promise<QueryResult> {
    const pool = await this.getOrCreatePool(config);
    const result = await pool.query(query, params); // 参数化查询，防 SQL 注入
    return { rows: result.rows, rowCount: result.rowCount, fields: result.fields };
  }

  async testConnection(config: DataSourceConfig): Promise<TestResult> {
    try {
      const pool = new Pool(this.buildPoolConfig(config));
      await pool.query('SELECT 1');
      await pool.end();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// REST API 适配器
@Injectable()
export class RESTAPIAdapter implements IDataSourceAdapter {
  async executeQuery(config: DataSourceConfig, query: string): Promise<QueryResult> {
    const queryConfig: RESTQueryConfig = JSON.parse(query);
    const response = await axios({
      method: queryConfig.method,
      url: this.resolveUrl(config.baseUrl, queryConfig.path),
      headers: { ...config.headers, ...queryConfig.headers },
      data: queryConfig.body,
      params: queryConfig.queryParams,
    });
    return { rows: response.data, rowCount: 1, fields: [] };
  }
}

// 适配器工厂
@Injectable()
export class DataSourceAdapterFactory {
  constructor(
    private pgAdapter: PostgreSQLAdapter,
    private mysqlAdapter: MySQLAdapter,
    private restAdapter: RESTAPIAdapter,
    private novadbAdapter: NovaDBAdapter,
  ) {}

  getAdapter(type: DataSourceType): IDataSourceAdapter {
    switch (type) {
      case 'postgresql': return this.pgAdapter;
      case 'mysql':      return this.mysqlAdapter;
      case 'restapi':    return this.restAdapter;
      case 'novadb':     return this.novadbAdapter;
      default: throw new Error(`Unsupported data source: ${type}`);
    }
  }
}
```

### QueryModule — 查询执行引擎

```mermaid
sequenceDiagram
    participant C as Client
    participant QS as QueryService
    participant DS as DataSourceService
    participant Adapter as DataSourceAdapter
    participant Sandbox as JS Sandbox
    participant DB as External DB

    C->>QS: POST /queries/run { queryId, params }
    QS->>QS: resolveParams(query, params)
    
    alt SQL Query
        QS->>DS: getAdapter(dataSourceId)
        DS-->>QS: adapter
        QS->>Adapter: executeQuery(sql, params)
        Adapter->>DB: parameterized query
        DB-->>Adapter: result
        Adapter-->>QS: QueryResult
    else JS Query
        QS->>Sandbox: execute(jsCode, context)
        Sandbox-->>QS: result
    else Visual Query
        QS->>QS: buildSQL(visualConfig)
        QS->>Adapter: executeQuery(generatedSQL)
        Adapter-->>QS: QueryResult
    end
    
    opt Transformer
        QS->>Sandbox: transform(result, transformerCode)
        Sandbox-->>QS: transformedResult
    end
    
    QS-->>C: { data, rowCount, executionTime }
```

```tsx
// 查询执行服务
@Injectable()
export class QueryService {
  async runQuery(queryId: string, runtimeParams: Record<string, any>): Promise<QueryResult> {
    const query = await this.queryRepo.findOneOrFail(queryId);
    const dataSource = await this.dsService.findOneOrFail(query.dataSourceId);

    // 1. 解析参数：将  components.xxx.value  替换为实际值
    const resolvedQuery = this.resolveParams(query.config, runtimeParams);

    // 2. 执行查询
    let result: QueryResult;
    switch (query.type) {
      case 'sql':
        const adapter = this.adapterFactory.getAdapter(dataSource.type);
        result = await adapter.executeQuery(dataSource.config, resolvedQuery.sql, resolvedQuery.params);
        break;
      case 'javascript':
        result = await this.sandboxService.execute(resolvedQuery.code, {
          queries: runtimeParams.queryResults,  // 可引用其他查询结果
          moment: require('moment'),            // 常用工具库
        });
        break;
      case 'visual':
        const sql = this.visualQueryBuilder.toSQL(resolvedQuery);
        const adapter2 = this.adapterFactory.getAdapter(dataSource.type);
        result = await adapter2.executeQuery(dataSource.config, sql.query, sql.params);
        break;
    }

    // 3. 数据转换（可选）
    if (query.transformer) {
      result.data = await this.sandboxService.execute(query.transformer, { data: result.data });
    }

    return result;
  }
}
```

### AIModule — AI 生成引擎

```mermaid
graph TB
    subgraph AIService["AI Service 架构"]
        direction TB
        Parser["NLParser<br>需求解析器"]
        Generator["AppGenerator<br>应用生成器"]
        Modifier["IncrementalModifier<br>增量修改器"]
        SQLGen["SQLGenerator<br>查询生成器"]
    end

    subgraph Prompt["Prompt 模板库"]
        P1["需求分析 Prompt"]
        P2["应用生成 Prompt"]
        P3["增量修改 Prompt"]
        P4["SQL 生成 Prompt"]
    end

    subgraph Claude["Claude API"]
        API["Anthropic SDK<br>claude-3.5-sonnet"]
    end

    AIService --> Prompt
    Prompt --> Claude
```

```tsx
// AI 服务架构
@Injectable()
export class AIService {
  constructor(
    private anthropic: Anthropic,
    private promptManager: PromptManager,
  ) {}

  // 1. 需求分析：自然语言 → 结构化需求
  async analyzeRequirement(userInput: string): Promise<RequirementAnalysis> {
    const prompt = this.promptManager.get('requirement-analysis', {
      userInput,
      availableComponents: ComponentRegistry.getAllTypes(),
      supportedDataTypes: NovaDB.SUPPORTED_TYPES,
    });
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    return this.parseRequirementResponse(response);
  }

  // 2. 应用生成：结构化需求 → AppDefinition JSON
  async generateApp(requirement: RequirementAnalysis): Promise<AppDefinition> {
    const prompt = this.promptManager.get('app-generation', {
      requirement,
      componentSchemas: ComponentRegistry.getAllSchemas(),
    });
    const response = await this.callClaude(prompt);
    const appDef = this.parseAppDefinition(response);
    return this.validateAndFix(appDef); // 校验并修复生成结果
  }

  // 3. 增量修改：对话指令 → Patch
  async modifyApp(
    currentApp: AppDefinition,
    instruction: string,
    conversationHistory: Message[],
  ): Promise<AppPatch> {
    const prompt = this.promptManager.get('incremental-modify', {
      currentApp: this.serializeForContext(currentApp),
      instruction,
      history: conversationHistory.slice(-10), // 保留最近 10 轮
    });
    const response = await this.callClaude(prompt);
    return this.parseAppPatch(response);
  }

  // 4. SQL 生成
  async generateSQL(
    description: string,
    schema: SchemaInfo,
  ): Promise<{ sql: string; explanation: string }> {
    const prompt = this.promptManager.get('sql-generation', {
      description,
      tables: schema.tables,
    });
    const response = await this.callClaude(prompt);
    return this.parseSQLResponse(response);
  }
}

// Prompt 管理器
@Injectable()
export class PromptManager {
  private templates: Map<string, string> = new Map();

  get(templateName: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateName);
    return this.interpolate(template, variables);
  }
}
```

### AI 生成流程（端到端）

```mermaid
sequenceDiagram
    participant U as 用户
    participant FE as 前端 AI 面板
    participant BE as AI Service
    participant Claude as Claude API
    participant App as App Service
    participant NDB as NovaDB

    U->>FE: "帮我做一个员工管理系统"
    FE->>BE: POST /ai/analyze { input }
    BE->>Claude: 需求分析 Prompt
    Claude-->>BE: 结构化需求 JSON
    BE-->>FE: { pages, components, dataModel, summary }
    FE->>U: 展示需求摘要，请确认

    U->>FE: 确认生成
    FE->>BE: POST /ai/generate { requirement }
    BE->>Claude: 应用生成 Prompt
    Claude-->>BE: AppDefinition JSON
    BE->>BE: validate & fix
    BE->>NDB: 创建数据表（如需要）
    BE->>App: 创建应用 + 保存 definition
    BE-->>FE: { appId, definition }
    FE->>FE: 渲染到画布
    FE->>U: 应用已生成，可预览和编辑

    U->>FE: "把表格的第二列改成日期格式"
    FE->>BE: POST /ai/modify { appId, instruction, history }
    BE->>Claude: 增量修改 Prompt
    Claude-->>BE: AppPatch JSON
    BE->>App: apply patch to definition
    BE-->>FE: { updatedDefinition, changes }
    FE->>FE: 高亮变更区域
    FE->>U: 修改已应用
```

---

# 四、数据库设计

## 4.1 数据库分区策略

MVP 使用单个 PostgreSQL 实例，逻辑上分为两个 Schema：

```mermaid
graph TB
    subgraph PG["PostgreSQL :5432"]
        subgraph Platform["Schema: platform（平台元数据）"]
            users["users"]
            apps["apps"]
            data_sources["data_sources"]
            queries["queries"]
            ai_sessions["ai_sessions"]
        end
        subgraph Nova["Schema: novadb（用户数据）"]
            nova_tables["nova_tables（表元数据）"]
            nova_columns["nova_columns（列元数据）"]
            user_data["user_table_*（动态创建的用户数据表）"]
        end
    end
```

## 4.2 ER 关系图

```mermaid
erDiagram
    users ||--o{ apps : creates
    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        enum role "admin|builder|end_user"
        varchar name
        timestamp created_at
        timestamp updated_at
    }

    apps ||--o{ app_queries : contains
    apps {
        uuid id PK
        varchar name
        jsonb definition_draft
        jsonb definition_published
        jsonb definition_previous
        enum status "draft|published"
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        timestamp published_at
    }

    data_sources ||--o{ app_queries : "used by"
    data_sources {
        uuid id PK
        varchar name
        enum type "postgresql|mysql|restapi|novadb|javascript"
        jsonb config_encrypted "加密存储"
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    app_queries {
        uuid id PK
        uuid app_id FK
        uuid data_source_id FK
        varchar name
        enum type "sql|javascript|visual|restapi"
        jsonb config
        jsonb triggers
        text transformer
        timestamp created_at
    }

    nova_tables ||--o{ nova_columns : has
    nova_tables {
        uuid id PK
        varchar name UK
        varchar schema_name "动态表名"
        uuid created_by FK
        timestamp created_at
    }

    nova_columns {
        uuid id PK
        uuid table_id FK
        varchar name
        enum data_type "text|number|boolean|datetime"
        boolean is_primary
        int sort_order
    }

    ai_sessions ||--o{ ai_messages : contains
    ai_sessions {
        uuid id PK
        uuid app_id FK
        uuid user_id FK
        timestamp created_at
    }

    ai_messages {
        uuid id PK
        uuid session_id FK
        enum role "user|assistant"
        text content
        jsonb metadata
        timestamp created_at
    }
```

## 4.3 关键表 DDL

```sql
-- ========================================
-- Schema: platform（平台元数据）
-- ========================================
CREATE SCHEMA IF NOT EXISTS platform;

-- 用户表
CREATE TABLE platform.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'builder'
                CHECK (role IN ('admin', 'builder', 'end_user')),
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 应用表
CREATE TABLE platform.apps (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  VARCHAR(200) NOT NULL,
    description           TEXT,
    definition_draft      JSONB NOT NULL DEFAULT '{}',
    definition_published  JSONB,
    definition_previous   JSONB,
    status                VARCHAR(20) NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published')),
    created_by            UUID NOT NULL REFERENCES platform.users(id),
    published_at          TIMESTAMPTZ,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_apps_created_by ON platform.apps(created_by);
CREATE INDEX idx_apps_status ON platform.apps(status);

-- 数据源表
CREATE TABLE platform.data_sources (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(200) NOT NULL,
    type             VARCHAR(30) NOT NULL
                     CHECK (type IN ('postgresql', 'mysql', 'restapi', 'novadb', 'javascript')),
    config_encrypted BYTEA,        -- AES-256 加密的连接配置
    config_iv        BYTEA,        -- 加密初始化向量
    is_default       BOOLEAN NOT NULL DEFAULT false,
    created_by       UUID NOT NULL REFERENCES platform.users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 查询表
CREATE TABLE platform.queries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id          UUID NOT NULL REFERENCES platform.apps(id) ON DELETE CASCADE,
    data_source_id  UUID NOT NULL REFERENCES platform.data_sources(id),
    name            VARCHAR(200) NOT NULL,
    type            VARCHAR(20) NOT NULL
                    CHECK (type IN ('sql', 'javascript', 'visual', 'restapi')),
    config          JSONB NOT NULL DEFAULT '{}',
    triggers        JSONB NOT NULL DEFAULT '["manual"]',
    transformer     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_queries_app_id ON platform.queries(app_id);

-- AI 会话表
CREATE TABLE platform.ai_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id      UUID REFERENCES platform.apps(id) ON DELETE SET NULL,
    user_id     UUID NOT NULL REFERENCES platform.users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI 消息表
CREATE TABLE platform.ai_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES platform.ai_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
    content     TEXT NOT NULL,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ai_messages_session ON platform.ai_messages(session_id);

-- ========================================
-- Schema: novadb（用户数据）
-- ========================================
CREATE SCHEMA IF NOT EXISTS novadb;

-- NovaDB 表元数据
CREATE TABLE novadb.nova_tables (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(200) UNIQUE NOT NULL,
    schema_name  VARCHAR(200) UNIQUE NOT NULL, -- 实际 PG 表名: nova_tbl_{id前8位}
    created_by   UUID NOT NULL REFERENCES platform.users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NovaDB 列元数据
CREATE TABLE novadb.nova_columns (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id    UUID NOT NULL REFERENCES novadb.nova_tables(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    data_type   VARCHAR(20) NOT NULL
                CHECK (data_type IN ('text', 'number', 'boolean', 'datetime')),
    is_primary  BOOLEAN NOT NULL DEFAULT false,
    sort_order  INT NOT NULL DEFAULT 0,
    UNIQUE(table_id, name)
);
```

---

# 五、API 设计

## 5.1 API 规范

- **基础路径：** `/api/v1`
- **认证方式：** Bearer Token（JWT）
- **数据格式：** JSON
- **错误响应格式：**

```tsx
interface ApiError {
  statusCode: number;       // HTTP 状态码
  code: string;             // 业务错误码 e.g. 'AUTH_INVALID_TOKEN'
  message: string;          // 人可读的错误描述
  details?: any;            // 可选的详细信息
}
```

## 5.2 API 端点清单

### 认证 Auth

| **方法** | **路径** | **说明** | **权限** |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | 用户注册 | 公开 |
| `POST` | `/auth/login` | 用户登录，返回 JWT | 公开 |
| `POST` | `/auth/refresh` | 刷新 Token | 公开 |
| `POST` | `/auth/logout` | 登出（销毁 Session） | 已认证 |
| `GET` | `/auth/me` | 获取当前用户信息 | 已认证 |

### 应用 Apps

| **方法** | **路径** | **说明** | **权限** |
| --- | --- | --- | --- |
| `GET` | `/apps` | 获取应用列表 | Builder+ |
| `POST` | `/apps` | 创建应用 | Builder+ |
| `GET` | `/apps/:id` | 获取应用详情（含 draft definition） | Builder+ |
| `PUT` | `/apps/:id` | 更新应用（保存 draft） | Builder+ |
| `DELETE` | `/apps/:id` | 删除应用 | Admin |
| `POST` | `/apps/:id/publish` | 发布应用 | Builder+ |
| `POST` | `/apps/:id/rollback` | 回滚到上一版本 | Builder+ |
| `GET` | `/apps/:id/published` | 获取已发布版本（End User 运行用） | 所有角色 |

### 查询 Queries

| **方法** | **路径** | **说明** | **权限** |
| --- | --- | --- | --- |
| `GET` | `/apps/:appId/queries` | 获取应用的查询列表 | Builder+ |
| `POST` | `/apps/:appId/queries` | 创建查询 | Builder+ |
| `PUT` | `/queries/:id` | 更新查询配置 | Builder+ |
| `DELETE` | `/queries/:id` | 删除查询 | Builder+ |
| `POST` | `/queries/:id/run` | 执行查询 | 所有角色 |
| `POST` | `/queries/preview` | 预览查询（不保存） | Builder+ |

### 数据源 DataSources

| **方法** | **路径** | **说明** | **权限** |
| --- | --- | --- | --- |
| `GET` | `/datasources` | 获取数据源列表 | Builder+ |
| `POST` | `/datasources` | 创建数据源 | Admin |
| `PUT` | `/datasources/:id` | 更新数据源配置 | Admin |
| `DELETE` | `/datasources/:id` | 删除数据源 | Admin |
| `POST` | `/datasources/:id/test` | 测试连接 | Admin |
| `GET` | `/datasources/:id/schema` | 获取 Schema（表/列） | Builder+ |

### NovaDB

| **方法** | **路径** | **说明** | **权限** |
| --- | --- | --- | --- |
| `GET` | `/novadb/tables` | 获取所有表 | Builder+ |
| `POST` | `/novadb/tables` | 创建表 | Builder+ |
| `DELETE` | `/novadb/tables/:id` | 删除表 | Admin |
| `GET` | `/novadb/tables/:id/columns` | 获取列定义 | Builder+ |
| `POST` | `/novadb/tables/:id/columns` | 添加列 | Builder+ |
| `PUT` | `/novadb/columns/:id` | 修改列 | Builder+ |
| `DELETE` | `/novadb/columns/:id` | 删除列 | Builder+ |
| `GET` | `/novadb/tables/:id/rows` | 查询数据（分页/搜索/排序） | Builder+ |
| `POST` | `/novadb/tables/:id/rows` | 插入行 | Builder+ |
| `PUT` | `/novadb/rows/:id` | 更新行 | Builder+ |
| `DELETE` | `/novadb/rows/:id` | 删除行 | Builder+ |
| `POST` | `/novadb/sql` | 执行 SQL | Builder+ |

### AI

| **方法** | **路径** | **说明** | **权限** |
| --- | --- | --- | --- |
| `POST` | `/ai/analyze` | 分析需求，返回结构化摘要 | Builder+ |
| `POST` | `/ai/generate` | 生成应用 | Builder+ |
| `POST` | `/ai/modify` | 增量修改应用 | Builder+ |
| `POST` | `/ai/generate-sql` | 生成 SQL 查询 | Builder+ |
| `GET` | `/ai/sessions/:appId` | 获取 AI 会话历史 | Builder+ |

### 用户管理 Users

| **方法** | **路径** | **说明** | **权限** |
| --- | --- | --- | --- |
| `GET` | `/users` | 获取用户列表 | Admin |
| `POST` | `/users` | 创建用户（管理员邀请） | Admin |
| `PUT` | `/users/:id` | 更新用户信息/角色 | Admin |
| `DELETE` | `/users/:id` | 禁用用户 | Admin |

---

# 六、安全架构

## 6.1 安全分层

```mermaid
graph TB
    subgraph Transport["传输层"]
        TLS["TLS 1.2+ 加密"]
        CORS["CORS 白名单"]
        RateLimit["速率限制<br>express-rate-limit"]
    end
    subgraph Auth2["认证层"]
        JWT2["JWT Token<br>Access 15min + Refresh 7d"]
        BcryptPwd["密码 bcrypt 哈希<br>saltRounds=12"]
        PwdPolicy["密码策略<br>≥8位, 含大小写+数字"]
    end
    subgraph Authz["授权层"]
        RBAC2["RBAC 三角色<br>Admin / Builder / End User"]
        Guards["NestJS Guards<br>路由级权限控制"]
    end
    subgraph DataSec["数据安全层"]
        Encrypt["凭证加密<br>AES-256-GCM"]
        ParamQuery["参数化查询<br>SQL 注入防护"]
        Sanitize["输入消毒<br>class-validator"]
        JSSandbox["JS 沙箱<br>vm2 隔离执行"]
    end
    Transport --> Auth2 --> Authz --> DataSec
```

## 6.2 凭证加密流程

```mermaid
sequenceDiagram
    participant U as Builder
    participant BE as Backend
    participant Crypto as CryptoService
    participant DB as PostgreSQL

    U->>BE: 创建数据源 { host, port, user, password }
    BE->>Crypto: encrypt(config)
    Note over Crypto: AES-256-GCM<br>密钥来自环境变量 ENCRYPTION_KEY<br>每次生成随机 IV
    Crypto-->>BE: { encryptedData, iv, authTag }
    BE->>DB: INSERT (config_encrypted, config_iv)
    
    Note over U,DB: 执行查询时解密
    BE->>DB: SELECT config_encrypted, config_iv
    DB-->>BE: encrypted config
    BE->>Crypto: decrypt(encryptedData, iv)
    Crypto-->>BE: { host, port, user, password }
    BE->>BE: 用明文建立连接，执行查询
    Note over BE: 明文仅在内存中，不写日志、不返回前端
```

## 6.3 JS 沙箱安全

```tsx
// JS 查询在隔离沙箱中执行
@Injectable()
export class SandboxService {
  async execute(code: string, context: Record<string, any>): Promise<any> {
    const vm = new VM({
      timeout: 10000,           // 10 秒超时
      sandbox: {
        ...context,
        console: { log: () => {} }, // 禁用 console
        // 不注入 require / fs / process / child_process
      },
      eval: false,              // 禁止 eval
      wasm: false,              // 禁止 WASM
    });
    return vm.run(code);
  }
}
```

---

# 七、部署架构

## 7.1 Docker Compose 部署图

```mermaid
graph TB
    subgraph Docker["Docker Compose"]
        subgraph FE["novabuilder-frontend"]
            Nginx["Nginx :3000<br>静态文件 + 反向代理"]
        end
        subgraph BE2["novabuilder-backend"]
            NestApp["NestJS :4000"]
        end
        subgraph DB2["novabuilder-db"]
            PG2[("PostgreSQL :5432")]
        end
        subgraph Cache["novabuilder-redis"]
            Redis2[("Redis :6379")]
        end
    end

    User["🌐 浏览器"] --> Nginx
    Nginx -->|"API 请求 /api/*"| NestApp
    Nginx -->|"静态资源"| Nginx
    NestApp --> PG2
    NestApp --> Redis2

    style Docker fill:#f0f7ff,stroke:#4a90d9
```

## 7.2 docker-compose.yml

```yaml
version: '3.8'

services:
  # === 前端 ===
  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:4000
    restart: unless-stopped

  # === 后端 ===
  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://nova:${DB_PASSWORD}@postgres:5432/novabuilder
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRY=15m
      - REFRESH_TOKEN_EXPIRY=7d
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - CORS_ORIGIN=http://localhost:3000
    restart: unless-stopped

  # === 数据库 ===
  postgres:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=novabuilder
      - POSTGRES_USER=nova
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nova -d novabuilder"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # === 缓存 ===
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
  redisdata:
```

## 7.3 环境变量

```bash
# .env.example

# === 数据库 ===
DB_PASSWORD=your_secure_password_here

# === 安全密钥 ===
JWT_SECRET=your_jwt_secret_here_min_32_chars
ENCRYPTION_KEY=your_aes_256_key_here_exactly_32_chars

# === AI ===
ANTHROPIC_API_KEY=sk-ant-xxx

# === 可选 ===
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

---

# 八、项目目录结构

```
novabuilder/
├── docker-compose.yml
├── .env.example
├── pnpm-workspace.yaml
├── package.json
├── packages/
│   ├── shared/                          # 共享类型定义
│   │   └── src/
│   │       ├── types/
│   │       │   ├── app.types.ts         # AppDefinition, PageDef, ComponentNode
│   │       │   ├── query.types.ts       # QueryDef, QueryConfig
│   │       │   ├── datasource.types.ts  # DataSourceConfig
│   │       │   ├── component.types.ts   # ComponentType, ComponentProps
│   │       │   └── api.types.ts         # API 请求/响应类型
│   │       └── index.ts
│   │
│   ├── frontend/                        # 前端 React 应用
│   │   ├── Dockerfile
│   │   ├── vite.config.ts
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── routes.tsx               # 路由配置
│   │   │   ├── api/                     # API 客户端
│   │   │   │   ├── client.ts            # Axios 实例 + 拦截器
│   │   │   │   ├── auth.api.ts
│   │   │   │   ├── app.api.ts
│   │   │   │   ├── query.api.ts
│   │   │   │   ├── datasource.api.ts
│   │   │   │   ├── novadb.api.ts
│   │   │   │   └── ai.api.ts
│   │   │   ├── stores/                  # Zustand 状态管理
│   │   │   │   ├── auth.store.ts
│   │   │   │   ├── editor.store.ts
│   │   │   │   ├── component.store.ts
│   │   │   │   ├── query.store.ts
│   │   │   │   └── history.store.ts
│   │   │   ├── engine/                  # 核心引擎
│   │   │   │   ├── dnd/                 # 拖拽引擎
│   │   │   │   │   ├── DndContext.tsx
│   │   │   │   │   ├── Droppable.tsx
│   │   │   │   │   └── DragOverlay.tsx
│   │   │   │   ├── renderer/            # 渲染引擎
│   │   │   │   │   ├── ComponentRenderer.tsx
│   │   │   │   │   └── PageRenderer.tsx
│   │   │   │   ├── binding/             # 数据绑定
│   │   │   │   │   ├── evaluator.ts
│   │   │   │   │   └── useBinding.ts
│   │   │   │   └── event/               # 事件引擎
│   │   │   │       ├── eventBus.ts
│   │   │   │       └── actionRunner.ts
│   │   │   ├── components/              # 通用 UI 组件
│   │   │   │   ├── Layout/
│   │   │   │   ├── PropertyPanel/
│   │   │   │   ├── QueryBuilder/
│   │   │   │   └── AIChat/
│   │   │   ├── registry/                # 组件注册表
│   │   │   │   ├── index.ts
│   │   │   │   └── components/
│   │   │   │       ├── Table/
│   │   │   │       ├── Button/
│   │   │   │       ├── TextInput/
│   │   │   │       ├── Select/
│   │   │   │       ├── Chart/
│   │   │   │       └── ... (20 个组件)
│   │   │   └── pages/                   # 页面
│   │   │       ├── Login/
│   │   │       ├── Dashboard/
│   │   │       ├── Editor/
│   │   │       ├── Preview/
│   │   │       ├── NovaDB/
│   │   │       ├── DataSource/
│   │   │       └── Admin/
│   │   └── nginx.conf
│   │
│   └── backend/                         # 后端 NestJS 应用
│       ├── Dockerfile
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── common/                  # 公共模块
│       │   │   ├── guards/
│       │   │   │   ├── jwt-auth.guard.ts
│       │   │   │   └── roles.guard.ts
│       │   │   ├── decorators/
│       │   │   │   └── roles.decorator.ts
│       │   │   ├── interceptors/
│       │   │   │   └── transform.interceptor.ts
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts
│       │   │   └── pipes/
│       │   │       └── validation.pipe.ts
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── strategies/
│       │   │   │   │   ├── jwt.strategy.ts
│       │   │   │   │   └── local.strategy.ts
│       │   │   │   └── dto/
│       │   │   ├── user/
│       │   │   ├── app/
│       │   │   │   ├── app.module.ts
│       │   │   │   ├── app.controller.ts
│       │   │   │   ├── app.service.ts
│       │   │   │   ├── entities/
│       │   │   │   │   └── app.entity.ts
│       │   │   │   └── dto/
│       │   │   ├── query/
│       │   │   │   ├── query.module.ts
│       │   │   │   ├── query.controller.ts
│       │   │   │   ├── query.service.ts
│       │   │   │   ├── visual-query.builder.ts
│       │   │   │   └── sandbox.service.ts
│       │   │   ├── datasource/
│       │   │   │   ├── datasource.module.ts
│       │   │   │   ├── datasource.controller.ts
│       │   │   │   ├── datasource.service.ts
│       │   │   │   ├── adapters/
│       │   │   │   │   ├── adapter.interface.ts
│       │   │   │   │   ├── adapter.factory.ts
│       │   │   │   │   ├── postgresql.adapter.ts
│       │   │   │   │   ├── mysql.adapter.ts
│       │   │   │   │   └── restapi.adapter.ts
│       │   │   │   └── crypto.service.ts
│       │   │   ├── novadb/
│       │   │   │   ├── novadb.module.ts
│       │   │   │   ├── novadb.controller.ts
│       │   │   │   ├── novadb.service.ts
│       │   │   │   └── entities/
│       │   │   └── ai/
│       │   │       ├── ai.module.ts
│       │   │       ├── ai.controller.ts
│       │   │       ├── ai.service.ts
│       │   │       ├── prompts/
│       │   │       │   ├── prompt.manager.ts
│       │   │       │   ├── requirement-analysis.prompt.ts
│       │   │       │   ├── app-generation.prompt.ts
│       │   │       │   ├── incremental-modify.prompt.ts
│       │   │       │   └── sql-generation.prompt.ts
│       │   │       └── parsers/
│       │   │           ├── requirement.parser.ts
│       │   │           └── app-definition.parser.ts
│       │   └── config/
│       │       └── database.config.ts
│       └── migrations/                  # TypeORM 数据库迁移
│           ├── 001-init-platform.ts
│           └── 002-init-novadb.ts
│
├── scripts/
│   ├── init-db.sql                      # 初始化 SQL
│   ├── backup.sh                        # 数据库备份脚本
│   └── seed.sh                          # 种子数据
└── docs/
    └── api/                             # API 文档
```

---

# 九、核心数据流

## 9.1 应用编辑 → 保存 → 预览 → 发布

```mermaid
sequenceDiagram
    participant U as 用户
    participant Editor as 编辑器
    participant Store as Zustand Store
    participant API as Backend API
    participant DB as PostgreSQL

    Note over U,DB: 编辑阶段
    U->>Editor: 拖拽组件到画布
    Editor->>Store: addComponent()
    Store->>Store: push to History Stack
    U->>Editor: 配置属性 / 绑定数据
    Editor->>Store: updateComponent()

    Note over U,DB: 自动保存（防抖 3s）
    Store->>API: PUT /apps/:id { definition_draft }
    API->>DB: UPDATE apps SET definition_draft = $1

    Note over U,DB: 预览
    U->>Editor: 切换到预览模式
    Editor->>Store: setMode('preview')
    Editor->>Editor: 用 draft definition 渲染只读视图
    Editor->>API: POST /queries/:id/run
    API-->>Editor: query results

    Note over U,DB: 发布
    U->>Editor: 点击发布按钮
    Editor->>API: POST /apps/:id/publish
    API->>DB: UPDATE apps SET definition_published = definition_draft
    API-->>Editor: { status: 'published' }
```

## 9.2 End User 运行已发布应用

```mermaid
sequenceDiagram
    participant EU as End User
    participant Runner as App Runner
    participant API as Backend API
    participant QE as Query Engine
    participant DS as Data Source

    EU->>Runner: 访问 /apps/:id
    Runner->>API: GET /apps/:id/published
    API-->>Runner: { definition_published }
    Runner->>Runner: 渲染组件树
    
    Note over EU,DS: 页面加载查询
    Runner->>API: POST /queries/q1/run (trigger: pageLoad)
    API->>QE: execute(query, dataSource)
    QE->>DS: SQL query
    DS-->>QE: result
    QE-->>API: QueryResult
    API-->>Runner: { data }
    Runner->>Runner: 数据绑定 → 更新 UI

    Note over EU,DS: 用户交互
    EU->>Runner: 点击按钮
    Runner->>Runner: eventHandler → runQuery action
    Runner->>API: POST /queries/q2/run { params }
    API-->>Runner: { data }
    Runner->>Runner: 刷新表格数据
```

---

# 十、可扩展性设计

<aside>
📈

**MVP 虽然精简，但关键架构决策需要为 v1.0 扩展预留空间。**

</aside>

| **扩展方向** | **MVP 预留设计** | **v1.0 扩展方式** |
| --- | --- | --- |
| **更多数据源** | Adapter 接口模式，新增数据源只需实现 `IDataSourceAdapter` | 添加 MongoDB / GraphQL / gRPC 等 Adapter |
| **更多组件** | Component Registry 注册机制，添加组件不改核心代码 | 扩展到 60+ 组件，支持社区自定义组件 |
| **多 AI 模型** | AIService 通过 `PromptManager` 抽象，不直接耦合 Claude SDK | 添加 OpenAI / 本地模型 Provider，模型路由策略 |
| **K8s 部署** | 无状态后端（Session 存 Redis）、环境变量配置 | Helm Chart + HPA + PG HA |
| **多租户** | 数据库表包含 `created_by` 字段 | 添加 Organization 层，数据隔离策略 |
| **工作流引擎** | Query 和 Event 系统已支持基础链式调用 | 添加 WorkflowEngine 模块，可视化编排 |
| **插件市场** | 组件和数据源均为 Registry 模式 | 开放 Plugin SDK，支持第三方注册 |

### 扩展点架构图

```mermaid
graph TB
    subgraph Core2["核心架构（MVP 稳定层）"]
        ComponentTree["组件树引擎"]
        QueryEngine["查询引擎"]
        EventSystem["事件系统"]
        RenderEngine2["渲染引擎"]
    end

    subgraph Extension["扩展点（v1.0+ 增长层）"]
        CompRegistry["组件 Registry<br>MVP: 20 → v1.0: 60+"]
        DSAdapter["数据源 Adapter<br>MVP: 3 → v1.0: 40+"]
        AIProvider["AI Provider<br>MVP: Claude → v1.0: 多模型"]
        WorkflowEng["工作流引擎<br>v1.0 新增"]
        PluginSDK["插件 SDK<br>v1.1 新增"]
    end

    Core2 --> Extension
```

---

<aside>
📝

*本文档为 NovaBuilder MVP 版本技术架构设计，配合 [PRD_NovaBuilder_MVP](https://www.notion.so/PRD_NovaBuilder_MVP-79b61819ea784b2fb44d2487882c9efd?pvs=21) 和功能清单使用。架构将随开发进展持续迭代更新。*

</aside>