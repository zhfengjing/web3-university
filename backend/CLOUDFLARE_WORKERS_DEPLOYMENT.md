# Cloudflare Workers 部署指南

本指南将帮助你将 Web3 University 后端项目部署到 Cloudflare Workers。

## 目录

- [前置要求](#前置要求)
- [数据库选项](#数据库选项)
- [配置步骤](#配置步骤)
- [本地开发](#本地开发)
- [部署到生产环境](#部署到生产环境)
- [环境变量配置](#环境变量配置)
- [常见问题](#常见问题)

## 前置要求

1. 安装 Node.js (v18 或更高版本)
2. 拥有 Cloudflare 账号
3. 已安装项目依赖：`npm install`

## 数据库选项

Cloudflare Workers 不支持传统的 TCP PostgreSQL 连接。你需要选择以下数据库方案之一：

### 选项 1: Cloudflare D1（推荐）

Cloudflare D1 是一个基于 SQLite 的分布式数据库，完全集成在 Workers 平台中。

**优点：**
- 无需额外配置
- 免费额度充足
- 低延迟
- 与 Workers 深度集成

**配置步骤：**

1. 创建 D1 数据库：
```bash
npx wrangler d1 create web3-university-db
```

2. 更新 `wrangler.toml`，取消注释 D1 配置：
```toml
[[d1_databases]]
binding = "DB"
database_name = "web3-university-db"
database_id = "你的数据库ID"  # 从上一步获取
```

3. 导入数据库 schema：
```bash
npx wrangler d1 execute web3-university-db --file=./database/schema.sql
```

4. 修改 `database/schema.sql` 以适配 SQLite 语法（如果需要）

### 选项 2: Neon PostgreSQL

Neon 提供无服务器 PostgreSQL，支持 HTTP API。

**配置步骤：**

1. 在 [Neon.tech](https://neon.tech) 创建账号并创建数据库
2. 获取 HTTP 连接字符串
3. 在 Cloudflare Dashboard 中配置环境变量：
   - `NEON_CONNECTION_STRING`: 你的 Neon HTTP 连接字符串

### 选项 3: Supabase PostgreSQL

Supabase 提供 PostgreSQL 数据库和 REST API。

**配置步骤：**

1. 在 [Supabase.com](https://supabase.com) 创建项目
2. 获取项目 URL 和 API Key
3. 在 Cloudflare Dashboard 中配置环境变量：
   - `SUPABASE_URL`: 你的 Supabase 项目 URL
   - `SUPABASE_KEY`: 你的 Supabase API Key

## 配置步骤

### 1. 登录 Cloudflare

```bash
npm run workers:login
```

这将打开浏览器让你登录 Cloudflare 账号。

### 2. 配置 wrangler.toml

编辑 `wrangler.toml` 文件，根据你选择的数据库方案取消相应配置的注释。

### 3. 配置环境变量

在 Cloudflare Dashboard 中设置环境变量：

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 Workers & Pages
3. 选择你的 Worker
4. 进入 Settings > Variables
5. 添加以下环境变量：

**必需的环境变量：**
- `NODE_ENV`: `production`
- `CORS_ORIGIN`: 你的前端域名（如 `https://your-domain.com`）

**可选的环境变量：**
- `YD_TOKEN_ADDRESS`: YD Token 合约地址
- `COURSE_MANAGER_ADDRESS`: Course Manager 合约地址
- `AAVE_INTEGRATION_ADDRESS`: Aave Integration 合约地址

**数据库相关环境变量：**（根据你选择的数据库方案）
- D1: 无需额外配置，在 `wrangler.toml` 中配置即可
- Neon: `NEON_CONNECTION_STRING`
- Supabase: `SUPABASE_URL`, `SUPABASE_KEY`

## 本地开发

### 启动本地开发服务器

```bash
npm run workers:dev
```

这将在本地启动一个模拟 Cloudflare Workers 环境的开发服务器。

默认访问地址：`http://localhost:8787`

### 测试 API

```bash
# 健康检查
curl http://localhost:8787/api/health

# 获取用户信息
curl http://localhost:8787/api/users/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

## 部署到生产环境

### 1. 部署到 Cloudflare Workers

```bash
npm run workers:deploy
```

部署成功后，你将看到 Worker 的 URL，类似于：
```
https://web3-university-backend.your-subdomain.workers.dev
```

### 2. 配置自定义域名（可选）

1. 在 Cloudflare Dashboard 中进入你的 Worker
2. 进入 Triggers 标签
3. 点击 "Add Custom Domain"
4. 输入你的域名并完成验证

### 3. 查看日志

实时查看 Worker 日志：

```bash
npm run workers:tail
```

## 环境变量配置

### 通过命令行设置环境变量

```bash
# 设置环境变量
npx wrangler secret put VARIABLE_NAME

# 示例：设置 CORS_ORIGIN
npx wrangler secret put CORS_ORIGIN
# 然后输入值：https://your-domain.com
```

### 通过 wrangler.toml 配置（不推荐用于敏感信息）

```toml
[vars]
NODE_ENV = "production"
CORS_ORIGIN = "https://your-domain.com"
```

注意：敏感信息（如数据库密码）应使用 `wrangler secret` 命令设置。

## 项目结构

```
backend/
├── worker.js                      # Cloudflare Workers 入口文件
├── wrangler.toml                  # Wrangler 配置文件
├── config/
│   ├── database.js               # 传统 Node.js 数据库配置
│   └── database-workers.js       # Workers 数据库适配器
├── server.js                     # Express 服务器（用于本地开发）
├── routes/                       # Express 路由（参考实现）
└── database/
    └── schema.sql                # 数据库 schema
```

## 常见问题

### 1. 部署后无法连接数据库

**问题：** 数据库查询失败

**解决方案：**
- 检查环境变量是否正确配置
- 确认数据库 schema 已导入
- 查看 Worker 日志：`npm run workers:tail`

### 2. CORS 错误

**问题：** 前端请求被 CORS 策略阻止

**解决方案：**
- 确认 `CORS_ORIGIN` 环境变量包含你的前端域名
- 支持多个域名时使用逗号分隔：`https://domain1.com,https://domain2.com`

### 3. 部署失败

**问题：** `wrangler deploy` 失败

**解决方案：**
- 确认已登录：`npm run workers:login`
- 检查 `wrangler.toml` 配置是否正确
- 确认项目名称未被占用

### 4. 数据库查询语法错误

**问题：** D1 不支持某些 PostgreSQL 语法

**解决方案：**
- D1 使用 SQLite，某些 PostgreSQL 特性可能不支持
- 常见差异：
  - `SERIAL` → `INTEGER PRIMARY KEY AUTOINCREMENT`
  - `TIMESTAMP` → `DATETIME`
  - `RETURNING *` → 部分支持，可能需要调整

### 5. Worker 大小超限

**问题：** Worker 脚本超过 1MB 限制

**解决方案：**
- 移除不必要的依赖
- 使用 Workers 专用的轻量级库
- 考虑将大文件移至 R2 或 KV

## 性能优化建议

1. **使用 D1 的批量操作**
   ```javascript
   await env.DB.batch([
     env.DB.prepare('INSERT INTO users ...'),
     env.DB.prepare('INSERT INTO activity_log ...'),
   ]);
   ```

2. **启用缓存**
   - 使用 Workers KV 缓存频繁访问的数据
   - 设置适当的 Cache-Control 头

3. **使用 Durable Objects**（如需要）
   - 对于需要强一致性的场景，考虑使用 Durable Objects

## 监控和日志

### 查看实时日志

```bash
npm run workers:tail
```

### 在 Cloudflare Dashboard 查看分析

1. 访问 Cloudflare Dashboard
2. 进入你的 Worker
3. 查看 Analytics 标签
   - 请求数
   - 错误率
   - CPU 时间
   - 地域分布

## 回滚

如果需要回滚到之前的版本：

```bash
# 查看部署历史
npx wrangler deployments list

# 回滚到指定版本
npx wrangler rollback [deployment-id]
```

## 额外资源

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Neon PostgreSQL 文档](https://neon.tech/docs)
- [Supabase 文档](https://supabase.com/docs)

## 支持

如果遇到问题，请：
1. 查看 Worker 日志：`npm run workers:tail`
2. 检查 [Cloudflare 状态页](https://www.cloudflarestatus.com/)
3. 访问 [Cloudflare Community](https://community.cloudflare.com/)

## 注意事项

1. **免费版限制：**
   - 每天 100,000 次请求
   - CPU 时间限制：10ms（免费）/ 50ms（付费）

2. **数据库限制：**
   - D1 免费版：5GB 存储，每天 100,000 次读取
   - 查询响应时间有限制

3. **代码限制：**
   - Worker 脚本大小：1MB（免费）/ 10MB（付费）
   - 不支持所有 Node.js API

4. **兼容性：**
   - 某些 npm 包可能不兼容 Workers 环境
   - 优先使用 Workers 专用的库

## 从 Express 迁移到 Workers 的差异

1. **无 TCP 连接：** 必须使用 HTTP-based 数据库或 D1
2. **无文件系统：** 使用 R2 或 KV 存储文件
3. **有限的 Node.js API：** 只支持部分 Node.js 内置模块
4. **请求/响应模型：** 使用 Fetch API 而非 Node.js HTTP

这就是完整的 Cloudflare Workers 部署指南。祝你部署顺利！
