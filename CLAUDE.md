```markdown
# NovaBuilder — AI 原生低代码应用开发平台

## 项目概述

NovaBuilder 是一个 AI 原生的低代码应用开发平台。用户通过「自然语言描述 + 可视化拖拽」快速构建内部工具。
MVP 目标：跑通「创建应用 → 连接数据 → 发布使用」完整闭环。

## 技术栈

| 层级 | 技术 |
|---|---|
| Monorepo | pnpm workspace |
| 前端 | React 18 + TypeScript 5 + Vite 5 |
| UI 库 | Ant Design 5 |
| 状态管理 | Zustand 4 |
| 拖拽 | @dnd-kit 6 |
| 代码编辑 | CodeMirror 6（SQL / JS） |
| 路由 | React Router 6 |
| HTTP | Axios |
| 后端 | NestJS 10 + TypeScript 5 |
| ORM | TypeORM 0.3 |
| 鉴权 | Passport + JWT（Access 15min / Refresh 7d） |
| 数据库 | PostgreSQL 16（platform schema + novadb schema） |
| 缓存 | Redis 7 |
| AI | Anthropic Claude API (claude-3.5-sonnet) |
| JS 沙箱 | vm2 |
| 部署 | Docker Compose |

## 项目结构

```

novabuilder/

├── [CLAUDE.md](http://CLAUDE.md)

├── docker-compose.yml

├── .env.example

├── pnpm-workspace.yaml

├── packages/

│   ├── shared/              # 前后端共享类型 (app / query / datasource / component / api)

│   ├── frontend/            # React 前端

│   │   └── src/

│   │       ├── api/         # Axios 客户端

│   │       ├── stores/      # Zustand stores

│   │       ├── engine/      # 拖拽 / 渲染 / 绑定 / 事件

│   │       ├── registry/    # 20 个组件注册表

│   │       ├── components/  # 通用 UI

│   │       └── pages/       # 路由页面

│   └── backend/             # NestJS 后端

│       └── src/

│           ├── common/      # Guards / Decorators / Interceptors / Pipes

│           └── modules/     # auth / user / app / query / datasource / novadb / ai

├── scripts/                 # init-db.sql / [backup.sh](http://backup.sh) / [seed.sh](http://seed.sh)

└── migrations/              # TypeORM migrations

```jsx

## 架构约定

### 后端
- 分层：Controller → Service → Repository，三层严格分离
- 模块化：每个功能域一个 NestJS Module (auth / app / query / datasource / novadb / ai / user)
- 数据源适配器模式：所有数据源实现 `IDataSourceAdapter` 接口 (testConnection / executeQuery / getSchema / disconnect)
- 适配器工厂：`DataSourceAdapterFactory` 根据 type 返回对应 adapter
- 查询安全：所有 SQL 必须参数化 ($1, $2...)，严禁字符串拼接
- 凭证加密：数据源连接信息用 AES-256-GCM，密钥来自 `ENCRYPTION_KEY` 环境变量
- 权限：`@Roles()` 装饰器 + `RolesGuard`，三角色: admin / builder / end_user
- API：`/api/v1` 前缀，RESTful
- 错误格式：`{ statusCode, code, message, details? }`

### 前端
- 状态管理：按职责划分 Zustand Store (editor / component / query / history / auth)
- 组件树：核心数据结构是 `AppDefinition > PageDef > ComponentNode`，存为 JSONB
- 组件注册：统一通过 `ComponentRegistry` 注册，每个组件包含 render / propertySchema / defaultProps / eventDefs
- 数据绑定：` expression ` 语法，通过 evaluator 在沙箱上下文中求值
- 事件系统：`EventHandler[] > Action[]`，支持 runQuery / setComponentValue / navigateTo / showNotification / openModal / closeModal
- 导航配置化：所有导航项抽成 `config/navigation.ts` 配置数组，不要硬编码在 Header 组件里
- 布局抽象：统一通过 `AppLayout` 组件管理布局，支持两种模式：
  - 模式 A（标准布局）：顶部导航 56px + 页面主体 max-width 1200px 居中（用于工作台/NovaDB/数据源/管理后台）
  - 模式 B（编辑器布局）：编辑器专属顶栏 48px + 左侧面板 240px + 中间画布 flex:1 + 右侧属性面板 320px + 底部查询面板可折叠 280px
  - 未来扩展时只需修改 AppLayout 即可切换为侧边栏模式，业务页面不受影响

### 数据库
- 双 Schema：`platform`（平台元数据: users / apps / data_sources / queries / ai_sessions / ai_messages）+ `novadb`（用户数据: nova_tables / nova_columns / 动态用户表）
- 应用存储：apps 表包含 `definition_draft`、`definition_published`、`definition_previous` 三个 JSONB 字段
- 发布流程：draft → published（同时备份 previous）；回滚：previous → published

## 命名规范

- Entity: PascalCase (App, DataSource, NovaTable)
- Controller: `*.controller.ts`，Service: `*.service.ts`，DTO: `*.dto.ts`
- API 路由: kebab-case (`/data-sources/:id/test`)
- 前端组件: PascalCase + 后缀 (TableComponent, ButtonComponent)
- Store: camelCase + Store 后缀 (editorStore, componentStore)
- 数据库表: snake_case (nova_tables, ai_sessions)

## 开发进度

### 当前模块
> ✅ Step 4: 查询执行引擎 —— 已完成
> ✅ Step 5: NovaDB —— 已完成

### 模块推进顺序

先跑通手动闭环，再叠 AI。每个模块做完就进入下一个，不按周划分。

**第一阶段：基础闭环**

- [x] Step 0: 项目骨架
  - pnpm monorepo + shared types + Docker Compose + PostgreSQL schema + Redis
  - 初始化 NestJS + React + Vite + 路由框架
  - 完成标志：`docker-compose up` 可启动全部服务，前端能访问登录页

- [x] Step 1: 认证模块
  - 邮箱密码注册 / 登录 / JWT 签发与刷新 / RBAC 三角色守卫
  - 密码 bcrypt 哈希 (saltRounds=12) + 密码策略 (≥8位, 含大小写+数字)
  - 前端登录/注册页 + Token 管理 + 路由守卫
  - 📐 界面参考：界面设计文档「一、登录页」「二、注册页」— 含线框图、组件规格 (antd Card 400px 居中 / Form / Input / Button)、校验规则、API 映射
  - 完成标志：能注册、登录、按角色拦截请求

- [x] Step 2: 应用管理 + 版本控制
  - App CRUD API (name / definition_draft JSONB)
  - 发布流程 (draft → published + 备份 previous) + 回滚
  - 前端工作台：应用列表页 + 创建/编辑/删除
  - 📐 界面参考：界面设计文档「三、工作台」— 含卡片布局 (Row/Col span=6, 一行4个)、AI 生成特殊卡片、新建弹窗 (空白/AI 两种模式)、状态标签、排序、搜索、API 映射
  - 完成标志：能创建应用、保存草稿、发布、回滚

- [x] Step 3: 数据源连接
  - DataSource CRUD + Adapter模式 (PostgreSQL / MySQL / REST API)
  - 连接测试 + 凭证 AES-256-GCM 加密存储
  - 前端数据源配置页
  - 📐 界面参考：界面设计文档「八、数据源管理」— 含列表页 (antd Table)、三种类型配置弹窗 (PG/MySQL: host+port+db+user+pwd+SSL, REST: baseURL+auth+headers)、测试连接交互
  - 完成标志：能添加 PG/MySQL/REST 数据源并测试连通

- [x] Step 4: 查询执行引擎
  - Query Entity + QueryService: SQL 参数化执行 / JS 沙箱执行 (vm2) / 可视化查询转 SQL / REST API 执行
  - 数据转换 (transformer)
  - 前端查询构建器 UI: 可视化表单 + CodeMirror SQL/JS 编辑器 + 结果展示
  - API: CRUD + execute + preview
  - 完成标志：能对已连接的数据源执行 SQL/JS 查询并看到结果

- [ ] Step 5: NovaDB
  - novadb schema: nova_tables + nova_columns + 动态创建用户表
  - 表 CRUD / 列 CRUD / 数据 CRUD / 搜索 / 排序 / 分页
  - SQL 编辑器 (CodeMirror)
  - 为内置数据源自动注册 NovaDB + Run JS
  - 📐 界面参考：界面设计文档「七、NovaDB 管理」— 含左侧表列表 (Sider 200px)、可编辑单元格 (双击编辑/失焦保存)、添加列弹窗、底部可折叠 SQL 编辑器面板、行选择批量删除
  - 完成标志：能建表、加列、增删改查数据、跑 SQL

- [ ] Step 6: 可视化编辑器
  - 组件树数据结构 (AppDefinition > PageDef > ComponentNode)
  - Zustand stores: editor / component / query / history
  - @dnd-kit 拖拽画布 + 对齐辅助线 + 网格吸附
  - ComponentRegistry 注册 20 个组件
  - 属性面板 + 数据绑定 ( expression )
  - 事件系统 (onClick → runQuery / navigateTo / ...)
  - 编辑/预览模式切换
  - Undo / Redo
  - 多页面管理 (最多 10 页) + 侧边栏导航
  - 自动保存 (3s 防抖)
  - 📐 界面参考：界面设计文档「四、应用编辑器」（核心页面，重点参考）— 含：
    - 编辑器顶栏：返回/应用名(可编辑)/保存状态/撤销重做/预览/发布/AI 按钮
    - 左侧面板 4 Tab：组件面板 (6 分类 20 组件, @dnd-kit draggable) / 页面管理 (拖拽排序, 上限 10 页) / 组件树 (Tree 组件) / 查询列表
    - 画布：自由布局 absolute positioning, 网格 8px, 选中态蓝色虚线+8 手柄, 多选框选, 右键菜单, 缩放 50%-200%
    - 右侧属性面板 3 Tab：属性 (propertySchema 动态渲染) / 样式 (X/Y/W/H + 外观 + 可见性表达式) / 事件 (动作列表: runQuery/setValue/navigateTo/showNotification/openModal/closeModal)
    - 底部查询面板：左侧查询列表 + 4 种模式 (SQL/JS/可视化/REST) + CodeMirror 编辑器 + 运行结果 (JSON/表格切换) + 设置面板
    - 自动保存：3s 防抖 → PUT /apps/:id
  - 📐 界面参考：界面设计文档「六、预览与运行」— 预览模式浮动工具条 + End User 运行模式 (只渲染 published definition)
  - 完成标志：能拖拽组件、绑定查询数据、预览应用、发布

**里程碑 M1: 手动闭环可用** — 用户可以手动拖拽搭建应用、连接数据、发布使用

**第二阶段：AI 能力叠加**

- [ ] Step 7: AI 生成引擎
  - Prompt 模板库 (PromptManager) + 4 个模板: 需求分析 / 应用生成 / 增量修改 / SQL 生成
  - AI Service: analyzeRequirement → generateApp → modifyApp → generateSQL
  - AI 会话存储 (ai_sessions + ai_messages)
  - 生成结果校验与修复 (validateAndFix)
  - 前端 AI 对话面板 UI
  - 📐 界面参考：界面设计文档「五、AI 对话面板」— 含：
    - 侧边抽屉 320px 替换属性面板位置
    - 消息气泡：用户右对齐蓝色 / AI 左对齐灰色 + 🤖 头像 + Markdown 渲染
    - 需求摘要卡片：页面列表 + 组件列表 + 数据模型，带「确认生成」「我要修改」按钮
    - 生成进度条 (Progress percent 动态更新)
    - 输入框：TextArea autoSize, Enter 发送 / Shift+Enter 换行
    - 状态机流程：空闲 → 等待分析 → 展示摘要 → 生成中 → 生成完成 → 增量修改
    - API: POST /ai/analyze → /ai/generate (SSE 流式) → /ai/modify → /ai/generate-sql
  - 完成标志：输入描述 → 需求摘要 → 确认 → 生成可用应用

- [ ] Step 8: 增量对话修改
  - 对话式组件修改 ("把表格第二列改成日期") → AppPatch
  - AI 查询生成 (描述 → SQL)
  - 修改预览与确认
  - 完成标志：可通过对话调整已生成应用的 UI 和查询

- [ ] Step 9: 权限完善 + 安全加固
  - RBAC 权限控制补全 (管理后台用户管理页)
  - 路由级权限拦截 + End User 只能访问已发布应用
  - CORS 白名单 + Rate Limit + 输入消毒 (class-validator)
  - 📐 界面参考：界面设计文档「九、用户管理」— Admin 专属页面，含用户表格 (角色 Tag 颜色区分 / 状态 Badge)、邀请用户弹窗 (用户名+邮箱+密码+角色选择)、操作下拉菜单 (修改角色/禁用/启用/删除)
  - 完成标志：三角色权限完全生效，无安全漏洞

- [ ] Step 10: 集成测试 + 部署收尾
  - 端到端流程测试 (注册 → 创建应用 → AI 生成 → 编辑 → 发布 → End User 使用)
  - Bug 修复 + 性能优化
  - README + 部署文档 + .env.example
  - pg_dump 备份脚本
  - 完成标志：可交付给早期用户试用

**里程碑 M2: MVP 交付** — 完整产品可用

## Claude Code 协作规则

### 生成代码时遵循
1. 先读 shared/src/types 中的类型定义，确保类型一致
2. 后端模块必须包含: module.ts / controller.ts / service.ts / dto/ / entities/
3. 所有 API 必须通过 ValidationPipe 校验输入
4. 数据库查询必须参数化，严禁拼接 SQL
5. 前端组件必须通过 ComponentRegistry 注册，不要硬编码
6. 所有新文件需要 ESLint + Prettier 格式化

### 常用命令
```

pnpm install                        # 安装依赖

pnpm -F @novabuilder/backend dev     # 启动后端

pnpm -F @novabuilder/frontend dev    # 启动前端

pnpm -F @novabuilder/shared build    # 构建共享类型

docker-compose up -d postgres redis  # 启动基础设施

pnpm -F @novabuilder/backend migration:run  # 运行数据库迁移

```

### 模块开发指南

开发新模块时，按此顺序：
1. 在 shared/src/types 定义类型接口
2. 创建 NestJS Module + Entity + DTO
3. 实现 Service 层业务逻辑
4. 实现 Controller 层 API 端点
5. 前端添加 API 客户端
6. 前端实现页面/组件
7. 测试并连调

## MVP 边界（OUT 列表——不要做）

以下功能明确不在 MVP 范围内，不要生成相关代码：
- Agent Builder / 工作流引擎
- 应用嵌入 / 插件市场
- SSO / SAML / LDAP / 2FA
- GitSync / CI-CD
- 国际化 / 移动端适配 / 深色模式 / 主题系统
- 响应式设计
- Python 查询 / 查询缓存 / 查询链式编排
- CSV 导入 / 外键 / JSON 数据类型 / 文件附件
- 审计日志 / IP 白名单
- K8s 部署 / 环境管理 / 连接池
- 多版本快照 / 版本 diff
```