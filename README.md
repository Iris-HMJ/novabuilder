# NovaBuilder

AI 原生低代码应用开发平台 (AI-Native Low-Code Application Development Platform)

## 概述

NovaBuilder 是一个 AI 原生的低代码应用开发平台。用户通过「自然语言描述 + 可视化拖拽」快速构建内部工具。

## 技术栈

| 层级 | 技术 |
|------|------|
| Monorepo | pnpm workspace |
| 前端 | React 18 + TypeScript 5 + Vite 5 |
| UI 库 | Ant Design 5 |
| 状态管理 | Zustand 4 |
| 拖拽 | @dnd-kit 6 |
| 代码编辑 | CodeMirror 6 |
| 路由 | React Router 6 |
| HTTP | Axios |
| 后端 | NestJS 10 + TypeScript 5 |
| ORM | TypeORM 0.3 |
| 鉴权 | Passport + JWT |
| 数据库 | PostgreSQL 16 |
| 缓存 | Redis 7 |
| AI | Anthropic Claude API |

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd novabuilder
```

2. **安装依赖**
```bash
pnpm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
```

4. **启动基础设施**
```bash
docker-compose up -d postgres redis
```

5. **启动后端**
```bash
pnpm -F @novabuilder/backend dev
```

6. **启动前端**
```bash
pnpm -F @novabuilder/frontend dev
```

7. **访问应用**
- 前端: http://localhost:3001
- 后端: http://localhost:4000

### 环境变量说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DB_HOST` | PostgreSQL 主机 | localhost |
| `DB_PORT` | PostgreSQL 端口 | 5432 |
| `DB_USERNAME` | PostgreSQL 用户名 | postgres |
| `DB_PASSWORD` | PostgreSQL 密码 | postgres |
| `DB_NAME` | 数据库名称 | novabuilder |
| `REDIS_URL` | Redis 连接地址 | redis://localhost:6379 |
| `JWT_SECRET` | JWT 密钥 | - |
| `ENCRYPTION_KEY` | 数据源加密密钥 (64位hex) | - |
| `ANTHROPIC_API_KEY` | Anthropic API Key | - |
| `CORS_ORIGINS` | CORS 白名单 (逗号分隔) | http://localhost:3000 |

## 功能特性

### 核心功能

- **应用管理**: 创建、编辑、发布、克隆、回滚应用
- **可视化编辑器**: 拖拽组件、属性配置、数据绑定、事件处理
- **AI 生成**: 自然语言描述生成应用
- **NovaDB**: 内置动态数据库
- **数据源**: 支持 PostgreSQL、MySQL、REST API
- **查询引擎**: SQL/JS/可视化查询

### 角色权限

| 角色 | 权限 |
|------|------|
| 管理员 (admin) | 管理用户、全部应用、数据源 |
| 开发者 (builder) | 创建编辑自己的应用、配置数据源 |
| 终端用户 (end_user) | 仅使用已发布应用 |

## 项目结构

```
novabuilder/
├── packages/
│   ├── shared/          # 共享类型定义
│   ├── frontend/       # React 前端
│   └── backend/        # NestJS 后端
├── scripts/            # 脚本 (备份、初始化)
├── docker-compose.yml  # Docker 配置
└── .env.example       # 环境变量示例
```

## 备份与恢复

### 备份数据库
```bash
./scripts/backup.sh
```

备份文件保存在 `./scripts/backups/` 目录，自动保留最近 7 个备份。

### 恢复数据库
```bash
# 解压备份文件
gunzip < backup_file.sql.gz | psql -U postgres -d novabuilder
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 启动后端
pnpm -F @novabuilder/backend dev

# 启动前端
pnpm -F @novabuilder/frontend dev

# 构建共享类型
pnpm -F @novabuilder/shared build

# 运行测试
pnpm test
```

## API 文档

基础路径: `/api/v1`

### 认证

- `POST /auth/register` - 注册
- `POST /auth/login` - 登录
- `POST /auth/refresh` - 刷新 Token

### 应用

- `GET /apps` - 获取应用列表
- `POST /apps` - 创建应用
- `GET /apps/:id` - 获取应用详情
- `PATCH /apps/:id` - 更新应用
- `DELETE /apps/:id` - 删除应用
- `POST /apps/:id/publish` - 发布应用
- `POST /apps/:id/rollback` - 回滚应用
- `GET /apps/:id/published` - 获取已发布应用

### 数据源

- `GET /data-sources` - 获取数据源列表
- `POST /data-sources` - 创建数据源
- `POST /data-sources/test` - 测试连接
- `GET /data-sources/:id/schema` - 获取 Schema

### 查询

- `GET /queries` - 获取查询列表
- `POST /queries` - 创建查询
- `POST /queries/:id/run` - 执行查询
- `POST /queries/preview` - 预览查询结果

### AI

- `POST /ai/analyze` - 分析需求
- `POST /ai/generate` - 生成应用
- `POST /ai/modify` - 增量修改
- `POST /ai/apply-patch` - 应用修改

## 许可证

MIT License
