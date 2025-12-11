# 文档目录

本目录包含所有部署和集成相关的文档。

## 快速导航

### 🚀 新手推荐

如果你是第一次部署到 Cloudflare Workers，推荐按以下顺序阅读：

1. **[Supabase 快速开始](./SUPABASE_QUICKSTART.md)** ⭐ 推荐
   - 5 分钟快速配置指南
   - 最简单的数据库方案
   - 适合快速原型和生产环境

2. **[Cloudflare Workers 部署指南](../CLOUDFLARE_WORKERS_DEPLOYMENT.md)**
   - 完整的部署流程
   - 三种数据库方案对比
   - 环境配置和常见问题

### 📚 详细文档

#### Supabase 集成

- **[SUPABASE_QUICKSTART.md](./SUPABASE_QUICKSTART.md)**
  - 快速开始（5 分钟）
  - 基础概念和架构
  - 常见问题速查

- **[SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)**
  - 深入的集成指南
  - 代码示例和最佳实践
  - 性能优化和监控
  - Row Level Security 配置

#### Cloudflare Workers

- **[CLOUDFLARE_WORKERS_DEPLOYMENT.md](../CLOUDFLARE_WORKERS_DEPLOYMENT.md)**
  - 完整部署指南
  - 数据库方案对比（D1、Neon、Supabase）
  - 环境变量配置
  - 性能优化建议

## 数据库方案选择

### 推荐方案：Supabase

**优势：**
- ✅ 托管的 PostgreSQL，无需维护
- ✅ 完全兼容 PostgreSQL 语法
- ✅ 通过 HTTPS API 访问，适配 Workers
- ✅ 免费额度充足（500MB 数据库）
- ✅ 自带管理界面和 SQL 编辑器
- ✅ 5 分钟快速开始

**适用场景：**
- 需要关系型数据库
- 希望使用标准 SQL
- 需要数据库管理工具
- 预算有限（免费版）

### 其他方案

#### Cloudflare D1
- SQLite 数据库
- 深度集成 Workers
- 需要适配 SQLite 语法
- 免费额度：5GB 存储

#### Neon PostgreSQL
- 无服务器 PostgreSQL
- 支持 HTTP API
- 按使用量计费
- 免费额度：3GB 存储

详细对比见：[CLOUDFLARE_WORKERS_DEPLOYMENT.md](../CLOUDFLARE_WORKERS_DEPLOYMENT.md)

## 通信架构

### Supabase 架构

```
Cloudflare Workers
       ↓ HTTPS (@supabase/supabase-js)
Supabase API Gateway
       ↓ 内部通信
PostgreSQL 数据库（托管）
```

**关键点：**
- 不需要 TCP 连接
- 所有通信通过 HTTPS
- 完全托管，无需维护数据库

## 快速开始指令

### 使用 Supabase（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（创建 .dev.vars 文件）
echo "SUPABASE_URL=https://your-project.supabase.co" >> .dev.vars
echo "SUPABASE_KEY=your-service-role-key" >> .dev.vars

# 3. 启动本地开发
npm run workers:dev

# 4. 部署到生产
npm run workers:deploy
```

详细步骤见：[SUPABASE_QUICKSTART.md](./SUPABASE_QUICKSTART.md)

### 使用 Cloudflare D1

```bash
# 1. 创建 D1 数据库
npx wrangler d1 create web3-university-db

# 2. 更新 wrangler.toml 配置

# 3. 导入 Schema
npx wrangler d1 execute web3-university-db --file=./database/schema-d1.sql

# 4. 部署
npm run workers:deploy
```

详细步骤见：[CLOUDFLARE_WORKERS_DEPLOYMENT.md](../CLOUDFLARE_WORKERS_DEPLOYMENT.md#选项-1-cloudflare-d1推荐)

## 环境变量说明

### 必需的环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `SUPABASE_URL` | Supabase 项目 URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase service_role key | `eyJhbGci...` |
| `CORS_ORIGIN` | 允许的前端域名 | `https://your-app.com` |

### 可选的环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `YD_TOKEN_ADDRESS` | YD Token 合约地址 | - |
| `COURSE_MANAGER_ADDRESS` | 课程管理合约地址 | - |
| `AAVE_INTEGRATION_ADDRESS` | Aave 集成合约地址 | - |

## 常见问题

### Q: 使用 Supabase 需要安装 PostgreSQL 吗？

**A:** 不需要！Supabase 是托管服务，已经为你运行 PostgreSQL。你只需要通过 API 访问。

### Q: Supabase 和 PostgreSQL 是什么关系？

**A:** Supabase 是托管的 PostgreSQL 服务，相当于：
- Supabase = PostgreSQL 数据库 + REST API + 管理界面
- 你不需要自己安装、运行、维护 PostgreSQL
- 所有数据库操作通过 HTTPS API 完成

### Q: Cloudflare Workers 如何连接数据库？

**A:** 通过 HTTPS API，不使用传统的 TCP 连接：
- ✅ Supabase: 使用 `@supabase/supabase-js` SDK (HTTPS)
- ✅ D1: 使用 Cloudflare 的绑定 API
- ✅ Neon: 使用 HTTP API
- ❌ 不支持: 传统的 `pg` 连接（需要 TCP）

### Q: 如何选择数据库方案？

**推荐 Supabase，因为：**
1. 最容易上手（5 分钟配置）
2. 完全兼容 PostgreSQL
3. 免费额度充足
4. 有管理界面
5. 生产级可靠性

**选择 D1 如果：**
- 想要最低延迟（边缘数据库）
- 数据结构简单
- 愿意使用 SQLite 语法

### Q: 本地开发时需要网络连接吗？

**A:**
- Supabase: 需要网络连接（访问 Supabase API）
- D1: 本地开发时使用本地 SQLite（无需网络）

### Q: 如何查看数据库内容？

**Supabase:**
1. 访问 Supabase Dashboard
2. Table Editor 或 SQL Editor

**D1:**
```bash
npx wrangler d1 execute web3-university-db --command="SELECT * FROM users"
```

## 获取帮助

### 文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)

### 社区

- [Supabase Discord](https://discord.supabase.com)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)

### Issues

遇到问题？请在项目仓库提交 Issue，并附上：
- 使用的数据库方案
- 错误信息
- 相关配置（隐藏敏感信息）

## 贡献

欢迎改进这些文档！如有建议，请提交 PR。
