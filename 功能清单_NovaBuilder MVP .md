# NovaBuilder MVP 功能清单

创建者: HMJ
创建时间: 2026年3月5日 11:22
上次编辑者: HMJ
上次更新时间: 2026年3月5日 11:25

<aside>
📋

**NovaBuilder MVP 功能清单**

基于 [PRD_NovaBuilder_MVP](https://www.notion.so/PRD_NovaBuilder_MVP-79b61819ea784b2fb44d2487882c9efd?pvs=21) 拆解的开发级功能清单，供 Claude Code 开发对照使用。

**状态标记：** ⬜ 未开始　🔲 开发中　✅ 已完成　🚫 MVP 不做

</aside>

---

# 一、平台基础设施

## 1.1 项目工程化

- ⬜ Monorepo 项目结构搭建（推荐 pnpm workspace 或 Turborepo）
- ⬜ 前端项目初始化（React + TypeScript + Vite）
- ⬜ 后端项目初始化（NestJS + TypeScript）
- ⬜ 共享类型包（`@novabuilder/types`）：前后端共用类型定义
- ⬜ ESLint + Prettier 统一代码规范配置
- ⬜ Docker Compose 编排文件（前端 / 后端 / PostgreSQL / Redis）
- ⬜ `.env.example` 环境变量模板（数据库连接、Redis、AI API Key 等）
- ⬜ 数据库 Schema 初始化脚本（PostgreSQL migration）
- ⬜ README 文档（快速启动、环境要求、项目结构说明）

## 1.2 数据库 Schema 设计

- ⬜ `users` 表：用户信息（id, email, password_hash, name, role, created_at, updated_at）
- ⬜ `workspaces` 表：工作区（id, name, owner_id, created_at）
- ⬜ `apps` 表：应用（id, name, workspace_id, status, definition_draft, definition_published, created_by, created_at, updated_at, published_at）
- ⬜ `app_pages` 表：应用页面（id, app_id, name, order, definition）
- ⬜ `data_sources` 表：数据源配置（id, workspace_id, name, type, config_encrypted, created_by）
- ⬜ `queries` 表：查询定义（id, app_id, name, data_source_id, type, query_string, options）
- ⬜ `novadb_tables` 表：NovaDB 用户表元数据（id, workspace_id, table_name, schema_definition, created_by）
- ⬜ `app_versions` 表：应用版本记录（id, app_id, version, definition_snapshot, published_by, published_at）

---

# 二、用户认证与权限

## 2.1 用户注册

- ⬜ 注册页面 UI（邮箱、密码、确认密码、用户名）
- ⬜ 邮箱格式校验（前端 + 后端双重校验）
- ⬜ 密码复杂度校验（至少 8 位，包含大小写字母和数字）
- ⬜ 邮箱唯一性检查
- ⬜ 密码 bcrypt 加密存储
- ⬜ 注册成功后自动登录
- ⬜ 首个注册用户自动设为 Admin 角色

## 2.2 用户登录

- ⬜ 登录页面 UI（邮箱、密码）
- ⬜ JWT Token 生成（Access Token + Refresh Token）
- ⬜ Access Token 过期时间：15 分钟
- ⬜ Refresh Token 过期时间：7 天，存储在 Redis
- ⬜ Token 自动刷新机制（前端拦截器）
- ⬜ 登录失败错误提示（邮箱不存在 / 密码错误）
- ⬜ 登出功能（清除 Token + Redis 会话）

## 2.3 RBAC 权限控制

- ⬜ 角色定义：Admin / Builder / End User
- ⬜ NestJS 权限守卫（Guard）实现
- ⬜ 角色权限矩阵：
    - ⬜ **Admin**：用户管理（增删改查、角色分配）、所有应用管理、所有数据源管理、平台设置
    - ⬜ **Builder**：创建/编辑/删除自己的应用、配置数据源、创建查询、使用 AI 生成、管理 NovaDB 表
    - ⬜ **End User**：仅查看和使用已发布的应用（只读访问）
- ⬜ API 路由权限装饰器（`@Roles('admin', 'builder')`）
- ⬜ 前端路由守卫（未登录跳转登录页，权限不足提示）

## 2.4 用户管理（Admin）

- ⬜ 用户列表页面（姓名、邮箱、角色、创建时间）
- ⬜ 邀请新用户（输入邮箱 + 选择角色）
- ⬜ 修改用户角色
- ⬜ 禁用 / 启用用户账号
- ⬜ 删除用户

---

# 三、应用管理

## 3.1 应用列表

- ⬜ 应用列表页面 UI（卡片式展示：应用名、状态、最后编辑时间、创建者）
- ⬜ 应用状态标识：Draft（草稿）/ Published（已发布）
- ⬜ 创建新应用入口（空白应用 / AI 生成）
- ⬜ 应用搜索（按名称模糊搜索）
- ⬜ 应用排序（按更新时间、创建时间、名称）
- ⬜ 应用删除（二次确认弹窗）
- ⬜ 应用重命名
- ⬜ 应用复制（克隆整个应用定义）

## 3.2 应用版本管理

- ⬜ Draft / Published 两态模型
    - ⬜ 编辑态始终操作 Draft 版本
    - ⬜ 发布时将 Draft 快照为 Published 版本
    - ⬜ End User 访问的始终是 Published 版本
- ⬜ 一键发布按钮
- ⬜ 发布确认弹窗（显示与上一版本的变更摘要）
- ⬜ 回滚到上一个 Published 版本
- ⬜ 版本记录列表（版本号、发布时间、发布人）

## 3.3 应用预览

- ⬜ 预览模式切换按钮（编辑态 ↔ 预览态）
- ⬜ 预览态下组件可交互（按钮可点击、表单可输入、查询可执行）
- ⬜ 预览态下隐藏编辑器面板
- ⬜ 应用独立运行 URL（`/apps/:appId`）— End User 访问入口

---

# 四、可视化应用构建器

## 4.1 编辑器布局

- ⬜ 三栏布局：左侧组件面板 + 中间画布 + 右侧属性面板
- ⬜ 左侧面板：组件列表（分类展示 6 大类 20 个组件）
- ⬜ 左侧面板：页面管理器（页面列表、新建、删除、排序、重命名）
- ⬜ 左侧面板：组件树（显示当前页面的组件层级结构）
- ⬜ 左侧面板：查询列表（当前应用的所有查询）
- ⬜ 顶部工具栏：应用名称、保存、预览、发布按钮
- ⬜ 顶部工具栏：撤销 / 重做按钮
- ⬜ 底部面板：查询编辑器（可折叠展开）

## 4.2 画布核心

- ⬜ 拖拽引擎集成（@dnd-kit 或 react-dnd）
- ⬜ 从左侧面板拖拽组件到画布
- ⬜ 画布内组件自由拖拽移动
- ⬜ 组件拖拽时的对齐辅助线（水平 + 垂直）
- ⬜ 网格吸附（可配置网格大小）
- ⬜ 组件选中高亮边框
- ⬜ 组件选中时显示调整手柄（拖拽调整大小）
- ⬜ 多选组件（Shift + 点击 或 框选）
- ⬜ 组件复制 / 粘贴（Ctrl+C / Ctrl+V）
- ⬜ 组件删除（Delete 键 或 右键菜单）
- ⬜ 组件层级调整（置顶、置底、上移、下移）
- ⬜ 画布缩放（Ctrl + 滚轮，50%-200%）
- ⬜ 画布平移（空格 + 拖拽）
- ⬜ 撤销 / 重做（Ctrl+Z / Ctrl+Shift+Z），操作历史栈

## 4.3 属性面板

- ⬜ 选中组件后右侧显示属性面板
- ⬜ 属性面板分组：
    - ⬜ **基础属性**：组件名称（唯一标识符）、可见性条件
    - ⬜ **数据**：数据源绑定（支持 `query1.data` 表达式）
    - ⬜ **样式**：宽度、高度、颜色、边距、圆角、阴影等
    - ⬜ **事件**：事件处理器配置（onClick、onChange 等）
- ⬜ 属性值支持动态绑定（`{{}}` 表达式，引用组件值、查询数据）
- ⬜ 属性修改实时预览（所见即所得）

## 4.4 事件系统

- ⬜ 事件处理器动作类型：
    - ⬜ **执行查询**：选择已定义的查询并触发执行
    - ⬜ **设置组件值**：修改其他组件的属性值
    - ⬜ **导航页面**：跳转到应用内其他页面
    - ⬜ **打开模态框**：显示 Modal 组件
    - ⬜ **关闭模态框**：隐藏 Modal 组件
    - ⬜ **显示通知**：显示 Toast 消息（成功 / 错误 / 警告）
    - ⬜ **复制到剪贴板**：复制指定文本
    - ⬜ **打开 URL**：在新标签页打开链接
- ⬜ 单个事件支持串联多个动作（按顺序执行）
- ⬜ 事件处理器条件执行（设置 if 条件）

## 4.5 数据绑定

- ⬜ 双花括号表达式引擎（ `expression` ）
- ⬜ 支持引用：
    - ⬜ `components.componentName.value` — 组件当前值
    - ⬜ `queries.queryName.data` — 查询结果数据
    - ⬜ `queries.queryName.isLoading` — 查询加载状态
    - ⬜ `globals.currentUser` — 当前用户信息
    - ⬜ `globals.urlParams` — URL 参数
- ⬜ 表达式支持 JavaScript 语法（三元表达式、数组方法等）
- ⬜ 表达式编辑器带自动补全提示
- ⬜ 表达式错误提示（语法错误、引用不存在等）

## 4.6 多页面管理

- ⬜ 创建新页面（默认名称 Page N）
- ⬜ 页面重命名
- ⬜ 页面删除（至少保留一个页面）
- ⬜ 页面排序（拖拽排序）
- ⬜ 页面切换（左侧面板点击切换）
- ⬜ 页面上限：10 个页面
- ⬜ 设置默认首页

---

# 五、UI 组件库（20 个）

## 5.1 数据展示组件（4 个）

### Table（表格）

- ⬜ 基础表格渲染（行、列、单元格）
- ⬜ 数据绑定（接受数组数据，自动推断列）
- ⬜ 列配置：列名、列宽、数据类型（文本/数字/日期/布尔/图片/链接）
- ⬜ 列排序（点击列头排序）
- ⬜ 客户端搜索 / 筛选
- ⬜ 分页（客户端分页 + 服务端分页）
- ⬜ 行选择（单选 / 多选）
- ⬜ 行点击事件（`onRowClicked`）
- ⬜ 单元格内操作按钮列（编辑 / 删除）
- ⬜ 加载状态（Loading skeleton）
- ⬜ 空数据状态展示

### ListView（列表）

- ⬜ 列表渲染（可自定义行模板）
- ⬜ 数据绑定
- ⬜ 行高配置
- ⬜ 行点击事件

### Chart（图表）

- ⬜ 图表类型：柱状图、折线图、饼图、环形图
- ⬜ 数据绑定（X 轴、Y 轴、系列配置）
- ⬜ 图例显示 / 隐藏
- ⬜ 颜色主题配置
- ⬜ 图表库集成（推荐 Chart.js 或 Recharts）

### Stat（统计卡片）

- ⬜ 主数值显示（大号字体）
- ⬜ 标题 / 描述文本
- ⬜ 前缀 / 后缀文本（如 ¥、%）
- ⬜ 图标配置
- ⬜ 背景颜色配置

## 5.2 表单输入组件（6 个）

### TextInput（文本输入）

- ⬜ 单行文本输入
- ⬜ 多行文本输入（Textarea 模式）
- ⬜ 标签（Label）
- ⬜ 占位符（Placeholder）
- ⬜ 默认值
- ⬜ 必填校验
- ⬜ 正则校验
- ⬜ 最大长度限制
- ⬜ 禁用 / 只读状态
- ⬜ `onChange` 事件
- ⬜ 密码输入模式（密文显示）

### NumberInput（数字输入）

- ⬜ 数字输入框
- ⬜ 最小值 / 最大值限制
- ⬜ 步进值配置
- ⬜ 小数位数配置
- ⬜ 前缀 / 后缀（如 ¥、%）
- ⬜ `onChange` 事件

### Select（下拉选择）

- ⬜ 单选下拉
- ⬜ 选项列表配置（静态列表 或 动态数据绑定）
- ⬜ 选项格式：label + value
- ⬜ 搜索过滤（输入搜索选项）
- ⬜ 默认值
- ⬜ 占位符
- ⬜ 清除选择
- ⬜ `onChange` 事件
- ⬜ 多选模式（Multi-Select）

### DatePicker（日期选择器）

- ⬜ 日期选择弹窗
- ⬜ 日期格式配置（YYYY-MM-DD 等）
- ⬜ 日期范围选择模式
- ⬜ 最小 / 最大日期限制
- ⬜ 默认值
- ⬜ `onChange` 事件

### FileUpload（文件上传）

- ⬜ 文件选择 / 拖拽上传
- ⬜ 文件类型限制
- ⬜ 文件大小限制
- ⬜ 上传进度条
- ⬜ 多文件上传
- ⬜ 已上传文件列表显示
- ⬜ 上传到服务端存储
- ⬜ `onFileSelected` 事件

### RichTextEditor（富文本编辑器）

- ⬜ 富文本编辑器集成（推荐 TipTap 或 Quill）
- ⬜ 基础格式：加粗、斜体、下划线、标题
- ⬜ 列表（有序 / 无序）
- ⬜ 链接插入
- ⬜ 获取 HTML / 纯文本内容
- ⬜ 默认内容设置

## 5.3 布局容器组件（3 个）

### Container（容器）

- ⬜ 矩形容器区域
- ⬜ 内部可嵌套放置其他组件
- ⬜ 背景颜色 / 边框 / 圆角 / 阴影配置
- ⬜ 内边距配置
- ⬜ 条件可见性

### Tabs（标签页）

- ⬜ 标签页容器
- ⬜ 标签页增删改
- ⬜ 每个标签页内可独立放置组件
- ⬜ 当前选中标签页属性（可读取）
- ⬜ `onTabChange` 事件

### Modal（模态框）

- ⬜ 模态弹窗容器
- ⬜ 弹窗标题配置
- ⬜ 弹窗大小（小 / 中 / 大）
- ⬜ 内部可放置组件
- ⬜ 打开 / 关闭控制（通过事件动作触发）
- ⬜ 关闭按钮
- ⬜ 点击遮罩层关闭（可配置）
- ⬜ `onOpen` / `onClose` 事件

## 5.4 操作反馈组件（4 个）

### Button（按钮）

- ⬜ 按钮文本配置
- ⬜ 按钮样式：Primary / Secondary / Danger / Outline
- ⬜ 按钮大小：Small / Medium / Large
- ⬜ 图标配置（前置 / 后置图标）
- ⬜ 加载状态（Loading 动画）
- ⬜ 禁用状态
- ⬜ `onClick` 事件

### Toggle（开关）

- ⬜ 开关 UI
- ⬜ 默认值（true / false）
- ⬜ 标签文本
- ⬜ `onChange` 事件

### Checkbox（复选框）

- ⬜ 复选框 UI
- ⬜ 标签文本
- ⬜ 默认选中状态
- ⬜ `onChange` 事件

### Spinner（加载状态）

- ⬜ 旋转加载动画
- ⬜ 大小配置
- ⬜ 颜色配置
- ⬜ 条件可见性（通常绑定 `queries.xxx.isLoading`）

## 5.5 媒体展示组件（2 个）

### Image（图像）

- ⬜ 图片 URL 绑定
- ⬜ 宽度 / 高度配置
- ⬜ 填充模式（cover / contain / fill）
- ⬜ 圆角配置
- ⬜ Alt 文本
- ⬜ 点击事件

### PDFViewer（PDF 查看器）

- ⬜ PDF URL 绑定
- ⬜ 页面导航
- ⬜ 缩放控制
- ⬜ PDF 渲染库集成（推荐 react-pdf）

## 5.6 导航组件（1 个）

### Sidebar（侧边栏导航）

- ⬜ 导航菜单列表
- ⬜ 菜单项：图标 + 文本 + 链接页面
- ⬜ 当前页面高亮
- ⬜ 折叠 / 展开
- ⬜ 自动从应用页面列表生成菜单

---

# 六、查询构建器

## 6.1 查询管理

- ⬜ 查询列表面板（显示当前应用的所有查询）
- ⬜ 新建查询（选择查询类型：数据源查询 / JS 查询）
- ⬜ 查询重命名
- ⬜ 查询删除
- ⬜ 查询复制

## 6.2 可视化查询

- ⬜ 选择数据源（从已配置的数据源列表选择）
- ⬜ 选择操作类型（读取 / 插入 / 更新 / 删除）
- ⬜ 表名选择（自动从数据源获取表列表）
- ⬜ 列选择（自动获取表的列信息）
- ⬜ 筛选条件构建器（字段 + 运算符 + 值，支持多条件 AND/OR）
- ⬜ 排序配置（字段 + 升序/降序）
- ⬜ 分页配置（每页数量 + 偏移量）
- ⬜ 运行按钮（手动测试查询）
- ⬜ 查询结果预览面板（JSON 视图 + 表格视图）

## 6.3 SQL 代码查询

- ⬜ SQL 编辑器集成（CodeMirror 6）
- ⬜ SQL 语法高亮
- ⬜ 行号显示
- ⬜ 参数化查询支持（`components.input1.value` 替换为参数化占位符）
- ⬜ SQL 注入防护（后端参数化执行，禁止字符串拼接）
- ⬜ 运行按钮 + 快捷键（Ctrl+Enter）
- ⬜ 查询结果预览（JSON / 表格切换）
- ⬜ 查询执行时间显示
- ⬜ 错误信息显示（SQL 语法错误、连接错误等）

## 6.4 JavaScript 查询

- ⬜ JS 代码编辑器（CodeMirror 6）
- ⬜ JS 语法高亮
- ⬜ 支持 async/await
- ⬜ 支持引用其他查询结果（`queries.query1.data`）
- ⬜ 支持引用组件值（`components.input1.value`）
- ⬜ 服务端安全沙箱执行（VM2 或 isolated-vm）
- ⬜ `return` 语句返回数据
- ⬜ 执行结果预览
- ⬜ 控制台日志输出

## 6.5 数据转换（Transformations）

- ⬜ 查询结果后处理 JS 编辑器
- ⬜ 接收 `data` 参数（原始查询结果）
- ⬜ 返回转换后的数据
- ⬜ 转换前后数据对比预览

## 6.6 查询配置

- ⬜ 查询触发方式设置：
    - ⬜ 页面加载时自动运行（开关）
    - ⬜ 手动触发（通过事件处理器调用）
- ⬜ 成功回调配置（查询成功后执行的动作）
- ⬜ 失败回调配置（查询失败后执行的动作）
- ⬜ 查询超时时间设置（默认 10 秒）
- ⬜ 查询确认弹窗（执行前要求用户确认，适用于写操作）

---

# 七、NovaDB 内置数据库

## 7.1 表管理界面

- ⬜ 表列表侧边栏（显示所有 NovaDB 表）
- ⬜ 创建新表（输入表名）
- ⬜ 删除表（二次确认）
- ⬜ 重命名表

## 7.2 列管理

- ⬜ 添加列（列名 + 数据类型选择）
- ⬜ 支持数据类型：
    - ⬜ `VARCHAR` — 文本
    - ⬜ `INTEGER` / `FLOAT` — 数字
    - ⬜ `BOOLEAN` — 布尔
    - ⬜ `TIMESTAMP` — 日期/时间
- ⬜ 自动生成 `id` 主键列（SERIAL，自增）
- ⬜ 自动生成 `created_at` 列
- ⬜ 列重命名
- ⬜ 列删除（二次确认，数据将丢失）
- ⬜ 列类型修改（带数据丢失警告）
- ⬜ 非空约束设置
- ⬜ 默认值设置

## 7.3 数据操作

- ⬜ 表格式数据展示（类电子表格 UI）
- ⬜ 新增行（弹窗表单 或 行内编辑）
- ⬜ 编辑行（单元格点击编辑）
- ⬜ 删除行（单行删除 + 批量删除）
- ⬜ 搜索（全表搜索）
- ⬜ 列排序（点击列头排序）
- ⬜ 列筛选（按列值筛选）
- ⬜ 分页显示（每页 50 条，上下翻页）
- ⬜ 总行数显示

## 7.4 SQL 编辑器

- ⬜ SQL 编辑器面板（CodeMirror 6）
- ⬜ SQL 语法高亮
- ⬜ 运行 SQL 按钮（Ctrl+Enter）
- ⬜ 查询结果表格展示
- ⬜ 支持 SELECT / INSERT / UPDATE / DELETE / CREATE TABLE / ALTER TABLE
- ⬜ 错误信息展示
- ⬜ 执行时间显示
- ⬜ SQL 历史记录（最近 20 条）

---

# 八、数据源管理

## 8.1 数据源配置页面

- ⬜ 数据源列表（名称、类型、创建时间、状态）
- ⬜ 新建数据源入口
- ⬜ 数据源类型选择页（PostgreSQL / MySQL / REST API 三个卡片）
- ⬜ 编辑数据源配置
- ⬜ 删除数据源（检查是否有查询在使用）

## 8.2 PostgreSQL 数据源

- ⬜ 配置表单：Host、Port、Database、Username、Password
- ⬜ SSL 开关 + SSL 证书配置
- ⬜ 连接字符串模式（高级）
- ⬜ 一键测试连接
- ⬜ 连接成功 / 失败提示
- ⬜ 凭证 AES-256 加密存储

## 8.3 MySQL 数据源

- ⬜ 配置表单：Host、Port、Database、Username、Password
- ⬜ SSL 开关
- ⬜ 一键测试连接
- ⬜ 凭证加密存储

## 8.4 REST API 数据源

- ⬜ 配置表单：Base URL
- ⬜ 认证方式选择：
    - ⬜ None（无认证）
    - ⬜ API Key（Header / Query Param）
    - ⬜ Bearer Token
    - ⬜ Basic Auth（Username + Password）
- ⬜ 默认 Headers 配置（Key-Value 列表）
- ⬜ 一键测试连接（发送 GET 请求到 Base URL）

## 8.5 查询执行引擎（后端）

- ⬜ PostgreSQL 查询执行器（基于 `pg` 库）
- ⬜ MySQL 查询执行器（基于 `mysql2` 库）
- ⬜ REST API 查询执行器（基于 `axios`）
    - ⬜ 支持 GET / POST / PUT / PATCH / DELETE 方法
    - ⬜ Headers 配置
    - ⬜ Query Params 配置
    - ⬜ Body 配置（JSON / Form Data）
- ⬜ JavaScript 查询执行器（安全沙箱执行）
- ⬜ 查询参数解析引擎（解析 `{{}}` 表达式并替换为实际值）
- ⬜ 查询超时处理
- ⬜ 查询错误统一格式化返回

---

# 九、AI 应用生成

## 9.1 AI 对话面板

- ⬜ 聊天式 UI 面板（左侧或右侧抽屉式展开）
- ⬜ 用户输入框（多行文本，支持 Enter 发送、Shift+Enter 换行）
- ⬜ 消息历史展示（用户消息 + AI 回复）
- ⬜ AI 回复中的加载状态（Typing 动画）
- ⬜ 清空对话按钮
- ⬜ 新建应用入口："用 AI 生成应用" 按钮

## 9.2 需求分析与确认

- ⬜ 用户输入需求描述后，AI 返回结构化摘要：
    - ⬜ 应用名称建议
    - ⬜ 页面列表（页面名称 + 简要描述）
    - ⬜ 每个页面包含的组件列表
    - ⬜ 数据模型预览（NovaDB 表结构：表名、列名、类型）
- ⬜ 摘要卡片式展示（可折叠展开查看细节）
- ⬜ 用户确认按钮（"确认生成"）
- ⬜ 用户修改意见输入（"我还想加一个..."）
- ⬜ AI 根据修改意见更新摘要

## 9.3 应用生成

- ⬜ AI 生成应用 JSON 定义（包含页面、组件、布局、查询、数据模型）
- ⬜ 后端 Prompt 工程模块：
    - ⬜ System Prompt：定义输出 JSON 格式规范、可用组件列表、布局规则
    - ⬜ 需求分析 Prompt：将用户描述转化为结构化需求
    - ⬜ 应用生成 Prompt：根据确认的需求生成完整应用 JSON
- ⬜ AI 输出 JSON 解析与校验
- ⬜ 自动创建 NovaDB 表（根据生成的数据模型）
- ⬜ 自动创建查询（CRUD 查询）
- ⬜ 应用 JSON 加载到编辑器画布
- ⬜ 生成进度展示（Streaming 流式输出 或 阶段性进度条）
- ⬜ 生成失败错误处理与重试
- ⬜ 生成限制：单次最多 3 个页面

## 9.4 增量对话修改

- ⬜ 生成后继续对话，AI 理解当前应用上下文
- ⬜ 支持的修改指令类型：
    - ⬜ 组件属性修改（"把表格标题改为'订单列表'"）
    - ⬜ 组件样式修改（"把按钮改成红色"）
    - ⬜ 添加组件（"在表格上方加一个搜索框"）
    - ⬜ 删除组件（"去掉图表"）
    - ⬜ 修改查询（"查询只显示今天的数据"）
    - ⬜ 修改数据模型（"给表加一个状态字段"）
- ⬜ AI 生成变更 diff（修改了哪些组件 / 查询 / 数据模型）
- ⬜ 修改预览（高亮显示被修改的组件）
- ⬜ 用户确认应用修改 或 撤销
- ⬜ 上下文窗口管理（保持最近 N 轮对话上下文）

## 9.5 AI 查询生成

- ⬜ 在查询编辑器中提供 "AI 生成" 按钮
- ⬜ 用户用自然语言描述查询需求（"查找过去7天的订单"）
- ⬜ AI 根据数据源 schema 生成 SQL
- ⬜ 生成的 SQL 填充到编辑器中，用户可编辑和调整
- ⬜ 支持 SELECT / INSERT / UPDATE / DELETE

## 9.6 AI 后端服务

- ⬜ Anthropic Claude API 集成模块
- ⬜ API Key 配置（环境变量）
- ⬜ 请求封装（统一 error handling、retry 逻辑）
- ⬜ 流式响应支持（Server-Sent Events）
- ⬜ Token 用量统计（每次请求记录 input/output tokens）
- ⬜ 速率限制（防止滥用）
- ⬜ Prompt 模板管理（版本化存储，便于迭代优化）

---

# 十、部署与运维

## 10.1 Docker Compose

- ⬜ `docker-compose.yml` 定义 4 个服务：
    - ⬜ `novabuilder-frontend`（React 生产构建 + Nginx）
    - ⬜ `novabuilder-backend`（NestJS Node.js 服务）
    - ⬜ `novabuilder-postgres`（PostgreSQL 15+）
    - ⬜ `novabuilder-redis`（Redis 7+）
- ⬜ 持久化 Volume（PostgreSQL 数据、上传文件）
- ⬜ 服务间网络隔离（internal network）
- ⬜ 健康检查配置（healthcheck）
- ⬜ 服务依赖顺序（depends_on）

## 10.2 环境变量

- ⬜ `DATABASE_URL` — PostgreSQL 连接串
- ⬜ `REDIS_URL` — Redis 连接串
- ⬜ `JWT_SECRET` — JWT 签名密钥
- ⬜ `ENCRYPTION_KEY` — 数据源凭证加密密钥
- ⬜ `ANTHROPIC_API_KEY` — Claude API 密钥
- ⬜ `APP_URL` — 应用访问 URL
- ⬜ `NODE_ENV` — 环境标识

## 10.3 数据库迁移

- ⬜ 数据库迁移工具集成（TypeORM migrations 或 Prisma migrate）
- ⬜ 初始化迁移脚本（创建所有基础表）
- ⬜ 迁移命令集成到启动流程（容器启动时自动执行）

## 10.4 备份

- ⬜ pg_dump 备份脚本（`scripts/backup.sh`）
- ⬜ 备份恢复脚本（`scripts/restore.sh`）
- ⬜ 备份说明文档

---

# 十一、前端全局

## 11.1 全局布局

- ⬜ 顶部导航栏（Logo、应用列表入口、NovaDB 入口、数据源入口、用户菜单）
- ⬜ 用户菜单下拉（个人设置、退出登录）
- ⬜ Admin 入口（用户管理）— 仅 Admin 可见
- ⬜ 全局 Loading 状态
- ⬜ 全局 Toast 通知组件
- ⬜ 404 页面
- ⬜ 403 权限不足页面
- ⬜ 500 服务器错误页面

## 11.2 前端路由

- ⬜ `/login` — 登录
- ⬜ `/register` — 注册
- ⬜ `/apps` — 应用列表（Builder / Admin）
- ⬜ `/apps/:id/edit` — 应用编辑器（Builder / Admin）
- ⬜ `/apps/:id` — 应用运行（End User 访问入口）
- ⬜ `/database` — NovaDB 管理
- ⬜ `/datasources` — 数据源管理
- ⬜ `/settings/users` — 用户管理（Admin）

## 11.3 数据安全

- ⬜ 所有 API 通信 HTTPS（Nginx 配置 TLS）
- ⬜ CSRF 防护
- ⬜ XSS 防护（前端输出转义）
- ⬜ SQL 注入防护（后端参数化查询）
- ⬜ 数据源凭证 AES-256-GCM 加密存储
- ⬜ 凭证绝不通过 API 返回到前端（仅返回 `*****` 掩码）
- ⬜ JS 查询沙箱执行（限制文件系统、网络访问）

---

<aside>
📊

**功能总计统计**

- ✅ **IN 模块：** 8 大模块
- 📋 **功能点总数：** ~280 个
- 🧩 **UI 组件：** 20 个
- 🗄️ **数据源类型：** 3 + 2 内置
- 👥 **角色：** 3 个
</aside>

---

<aside>
📝

*本清单基于 [PRD_NovaBuilder_MVP](https://www.notion.so/PRD_NovaBuilder_MVP-79b61819ea784b2fb44d2487882c9efd?pvs=21) 拆解，开发过程中如遇范围变更请同步更新。*

</aside>