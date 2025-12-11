# Supabase 快速开始指南

这是一个 5 分钟快速开始指南，帮助你使用 Supabase 配置 Cloudflare Workers 项目。

## 核心概念

**Supabase = 托管的 PostgreSQL + REST API**

- ✅ Supabase 为你运行 PostgreSQL 数据库（云端托管）
- ✅ 不需要在本地或服务器上安装/运行 PostgreSQL
- ✅ 通过 HTTPS API 访问数据库（完美适配 Cloudflare Workers）
- ✅ 所有通信都是安全的 HTTPS，无需 TCP 连接

## 架构图

```
你的应用 (Cloudflare Workers)
        ↓ HTTPS
Supabase API (api.supabase.co)
        ↓ 内部通信
PostgreSQL 数据库 (由 Supabase 管理)
```

## 5 步快速开始

### 步骤 1: 创建 Supabase 项目（2 分钟）

1. 访问 https://supabase.com
2. 点击 "Start your project"
3. 注册/登录（支持 GitHub 登录）
4. 点击 "New Project"
5. 填写信息：
   - Name: `web3-university`
   - Database Password: 设置强密码并保存
   - Region: 选择 `Singapore` 或离你最近的区域
6. 点击 "Create new project"
7. 等待 2 分钟完成初始化

### 步骤 2: 获取 API 密钥（30 秒）

项目创建完成后：

1. 在左侧菜单点击 ⚙️ "Project Settings"
2. 点击 "API"
3. 复制以下两个值：

```
Project URL: https://xxxxx.supabase.co
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **重要：使用 `service_role key`，不是 `anon key`**

### 步骤 3: 导入数据库 Schema（1 分钟）

1. 在 Supabase Dashboard 左侧点击 📊 "SQL Editor"
2. 点击 "+ New Query"
3. 复制粘贴以下内容：

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);

-- Activity log
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_address);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);
```

4. 点击 ▶️ "Run" 或按 `Ctrl/Cmd + Enter`
5. 看到 "Success" 即完成

### 步骤 4: 配置本地开发环境（1 分钟）

在项目根目录创建 `.dev.vars` 文件：

```bash
cd /path/to/backend
nano .dev.vars
```

粘贴以下内容（替换为你的实际值）：

```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

保存并退出（`Ctrl+O`, `Enter`, `Ctrl+X`）

### 步骤 5: 测试运行（1 分钟）

```bash
# 启动本地开发服务器
npm run workers:dev
```

在另一个终端测试：

```bash
# 测试健康检查
curl http://localhost:8787/api/health

# 应该返回：
# {"status":"ok","message":"Web3 University API is running on Cloudflare Workers"}
```

🎉 **完成！你的应用现在已连接到 Supabase！**

## 部署到生产环境

### 配置 Cloudflare Workers 环境变量

```bash
# 设置 Supabase URL
npx wrangler secret put SUPABASE_URL
# 输入: https://xxxxx.supabase.co

# 设置 Supabase Key
npx wrangler secret put SUPABASE_KEY
# 输入: eyJhbG... (你的 service_role key)

# 设置 CORS（你的前端域名）
npx wrangler secret put CORS_ORIGIN
# 输入: https://your-domain.com
```

### 部署

```bash
npm run workers:deploy
```

## 验证数据库连接

### 方法 1: 在 Supabase Dashboard 查看

1. 访问 Supabase Dashboard
2. 点击左侧 📊 "Table Editor"
3. 选择 `users` 表
4. 你应该能看到表结构

### 方法 2: 通过 API 测试

```bash
# 测试获取用户（应该返回 404，因为还没有数据）
curl http://localhost:8787/api/users/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# 应该返回：
# {"error":"User not found"}
```

这说明数据库连接正常！

## 常见问题速查

### Q: 我需要安装 PostgreSQL 吗？
**A: 不需要！** Supabase 已经为你运行 PostgreSQL，你只需要使用 API。

### Q: 数据存储在哪里？
**A:** 存储在 Supabase 的云端服务器（AWS），你在创建项目时选择的区域。

### Q: 如何查看数据？
**A:**
1. 在 Supabase Dashboard → Table Editor
2. 或使用 SQL Editor 执行查询：`SELECT * FROM users;`

### Q: anon key 和 service_role key 的区别？
**A:**
- `anon key`: 用于前端，受权限限制
- `service_role key`: 用于后端（Workers），有完全权限
- **在 Workers 中必须使用 `service_role key`**

### Q: 如何重置数据库？
**A:**
```sql
-- 在 SQL Editor 中执行
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS users;
-- 然后重新运行 Schema 脚本
```

### Q: 连接失败怎么办？
**A:** 检查：
1. `.dev.vars` 文件是否存在且配置正确
2. `SUPABASE_URL` 格式是否正确（必须是 https://）
3. `SUPABASE_KEY` 是否是 service_role key
4. 在 Supabase Dashboard 查看项目状态是否正常

## 下一步

### 启用 Row Level Security（可选）

如果你的应用需要用户认证，可以启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow public read" ON users
FOR SELECT USING (true);

-- 只允许 service_role 写入
CREATE POLICY "Allow service role write" ON users
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### 查看实时日志

```bash
# Cloudflare Workers 日志
npm run workers:tail

# Supabase 数据库日志
# 在 Dashboard → Database → Logs
```

### 监控使用情况

在 Supabase Dashboard:
- Project Settings → Usage
- 查看 API 请求数、数据库连接数、存储使用量

## 免费额度

Supabase 免费版包括：
- ✅ 500 MB 数据库空间
- ✅ 1 GB 文件存储
- ✅ 2 GB 带宽/月
- ✅ 50,000 月活用户
- ✅ 无限 API 请求

对于大多数小型项目来说已经足够！

## 需要帮助？

- 📖 完整文档: [SUPABASE_INTEGRATION.md](./SUPABASE_INTEGRATION.md)
- 🌐 Supabase 官方文档: https://supabase.com/docs
- 💬 Supabase Discord: https://discord.supabase.com

## 总结

你现在已经：
- ✅ 创建了 Supabase 项目（托管的 PostgreSQL）
- ✅ 导入了数据库 Schema
- ✅ 配置了本地开发环境
- ✅ 测试了数据库连接
- ✅ 准备好部署到生产环境

**重点记住：**
- Supabase = 托管的 PostgreSQL，不需要自己运行数据库
- 所有通信通过 HTTPS，适配 Cloudflare Workers
- 使用 `service_role key` 在后端访问数据库
