# Supabase 集成指南

## Supabase 是什么？

Supabase 是一个开源的 Firebase 替代品，提供：
- **托管的 PostgreSQL 数据库**（你不需要自己运行 PostgreSQL）
- REST API（自动生成）
- 实时订阅
- 认证和授权
- 存储服务

## Supabase 与 PostgreSQL 的关系

```
┌─────────────────────────────────────────┐
│          Supabase 平台                   │
│  ┌───────────────────────────────────┐  │
│  │   PostgreSQL 数据库（托管）        │  │
│  │   - 你的数据存储在这里             │  │
│  │   - Supabase 负责运行和维护        │  │
│  └───────────────────────────────────┘  │
│           ↕️                             │
│  ┌───────────────────────────────────┐  │
│  │   PostgREST                       │  │
│  │   - 自动将数据库表转换为 REST API │  │
│  └───────────────────────────────────┘  │
│           ↕️                             │
│  ┌───────────────────────────────────┐  │
│  │   Supabase API Gateway            │  │
│  │   - 处理认证、授权                │  │
│  │   - 提供 HTTP 接口                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
           ↕️ HTTPS
┌─────────────────────────────────────────┐
│   Cloudflare Workers                    │
│   - 通过 HTTPS 调用 Supabase API       │
│   - 不需要 TCP 连接                     │
└─────────────────────────────────────────┘
```

## 在 Cloudflare Workers 中使用 Supabase

### 方式 1: 使用 Supabase JavaScript 客户端（推荐）

这是最简单和推荐的方式。

#### 安装依赖

```bash
npm install @supabase/supabase-js
```

#### 创建 Supabase 适配器

创建文件 `config/database-supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase 客户端适配器
 * 使用 Supabase JavaScript SDK，通过 HTTPS 与数据库通信
 */
export class SupabaseAdapter {
  constructor(env) {
    // 创建 Supabase 客户端
    this.client = createClient(
      env.SUPABASE_URL,      // 你的 Supabase 项目 URL
      env.SUPABASE_KEY       // 你的 Supabase API Key (anon/service_role)
    );
  }

  /**
   * 执行查询（SELECT）
   */
  async query(sql, params = []) {
    // Supabase 使用声明式 API，不直接执行 SQL
    // 我们需要将 SQL 查询转换为 Supabase API 调用
    // 这里提供一个基础实现
    throw new Error('请使用 Supabase 的声明式 API，而不是原始 SQL');
  }

  /**
   * 获取用户信息
   */
  async getUser(address) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .ilike('address', address)
      .single();

    if (error) throw error;
    return { rows: data ? [data] : [], rowCount: data ? 1 : 0 };
  }

  /**
   * 创建或更新用户
   */
  async upsertUser(address, name) {
    const { data, error } = await this.client
      .from('users')
      .upsert(
        { address, name, updated_at: new Date().toISOString() },
        { onConflict: 'address' }
      )
      .select()
      .single();

    if (error) throw error;
    return { rows: [data], rowCount: 1 };
  }

  /**
   * 更新用户名称
   */
  async updateUserName(address, name) {
    const { data, error } = await this.client
      .from('users')
      .update({ name, updated_at: new Date().toISOString() })
      .ilike('address', address)
      .select()
      .single();

    if (error) throw error;
    return { rows: [data], rowCount: 1 };
  }

  /**
   * 记录活动日志
   */
  async logActivity(userAddress, actionType, actionData) {
    const { data, error } = await this.client
      .from('activity_log')
      .insert({
        user_address: userAddress,
        action_type: actionType,
        action_data: actionData,
      })
      .select()
      .single();

    if (error) throw error;
    return { rows: [data], rowCount: 1 };
  }

  /**
   * 获取用户活动日志
   */
  async getUserActivity(address, limit = 50, offset = 0) {
    const { data, error } = await this.client
      .from('activity_log')
      .select('*')
      .ilike('user_address', address)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  }

  /**
   * 检查用户是否存在
   */
  async userExists(address) {
    const { data, error } = await this.client
      .from('users')
      .select('id')
      .ilike('address', address)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return !!data;
  }
}
```

#### 更新 worker.js 使用 Supabase

修改 `worker.js` 中的路由处理器：

```javascript
import { validateSignature } from './utils/signature.js';
import { SupabaseAdapter } from './config/database-supabase.js';

class Router {
  constructor(env) {
    this.env = env;
    this.db = new SupabaseAdapter(env);
  }

  // ... 其他代码保持不变

  async getUser(address) {
    if (!this.isValidEthAddress(address)) {
      return this.jsonResponse({ error: 'Invalid Ethereum address' }, 400);
    }

    try {
      const result = await this.db.getUser(address);

      if (result.rows.length === 0) {
        return this.jsonResponse({ error: 'User not found' }, 404);
      }

      return this.jsonResponse(result.rows[0]);
    } catch (error) {
      console.error('Get user error:', error);
      return this.jsonResponse({ error: 'Failed to get user' }, 500);
    }
  }

  async updateUserName(address, body) {
    if (!this.isValidEthAddress(address)) {
      return this.jsonResponse({ error: 'Invalid Ethereum address' }, 400);
    }

    const { name, message, signature } = body;

    if (!name || !message || !signature) {
      return this.jsonResponse({ error: 'Missing required fields' }, 400);
    }

    // 验证签名
    const validation = validateSignature(message, signature, address);
    if (!validation.valid) {
      return this.jsonResponse({ error: validation.error }, 401);
    }

    // 检查消息内容
    if (!message.includes(name)) {
      return this.jsonResponse({ error: 'Message does not match name' }, 400);
    }

    try {
      // 检查用户是否存在
      const exists = await this.db.userExists(address);

      let result;
      if (!exists) {
        // 创建新用户
        result = await this.db.upsertUser(address, name);
      } else {
        // 更新现有用户
        result = await this.db.updateUserName(address, name);
      }

      // 记录活动日志
      await this.db.logActivity(address, 'update_name', { name });

      return this.jsonResponse({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Update name error:', error);
      return this.jsonResponse({ error: 'Failed to update name' }, 500);
    }
  }

  async getUserActivity(address, limit, offset) {
    if (!this.isValidEthAddress(address)) {
      return this.jsonResponse({ error: 'Invalid Ethereum address' }, 400);
    }

    try {
      const result = await this.db.getUserActivity(address, limit, offset);

      return this.jsonResponse({
        activities: result.rows,
        limit,
        offset,
      });
    } catch (error) {
      console.error('Get activity error:', error);
      return this.jsonResponse({ error: 'Failed to get activity' }, 500);
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    const router = new Router(env);
    return await router.route(request);
  },
};
```

### 方式 2: 使用原始 SQL（通过 Supabase REST API）

如果你需要执行原始 SQL 查询，可以使用 Supabase 的 RPC 功能。

#### 在 Supabase Dashboard 创建 SQL 函数

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 进入 SQL Editor
3. 创建自定义函数：

```sql
-- 创建一个执行原始查询的函数
CREATE OR REPLACE FUNCTION execute_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (%s) t', query_text)
  INTO result;
  RETURN result;
END;
$$;
```

#### 在 Workers 中调用

```javascript
async executeRawSQL(sql, params) {
  const { data, error } = await this.client.rpc('execute_query', {
    query_text: sql
  });

  if (error) throw error;
  return { rows: data || [], rowCount: data?.length || 0 };
}
```

## 配置步骤

### 1. 创建 Supabase 项目

1. 访问 [Supabase.com](https://supabase.com)
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - Project Name: `web3-university`
   - Database Password: 设置一个强密码（保存好）
   - Region: 选择离你最近的区域
5. 等待项目创建完成（约 2 分钟）

### 2. 获取连接信息

在 Supabase Dashboard 中：

1. 进入 "Project Settings" → "API"
2. 复制以下信息：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public key**: 用于前端和受限访问
   - **service_role key**: 用于后端，拥有完全权限

### 3. 导入数据库 Schema

#### 方法 1: 使用 SQL Editor（推荐）

1. 在 Supabase Dashboard 中，进入 "SQL Editor"
2. 点击 "New Query"
3. 粘贴 `database/schema.sql` 的内容
4. 点击 "Run" 执行

#### 方法 2: 使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref your-project-ref

# 执行 schema
supabase db push
```

### 4. 配置环境变量

在 Cloudflare Workers 中设置：

```bash
# 设置 Supabase URL
npx wrangler secret put SUPABASE_URL
# 输入: https://xxx.supabase.co

# 设置 Supabase Key（使用 service_role key）
npx wrangler secret put SUPABASE_KEY
# 输入: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

或在 `wrangler.toml` 中配置（不推荐用于生产）：

```toml
[vars]
SUPABASE_URL = "https://xxx.supabase.co"
# 注意：不要将 service_role key 放在 wrangler.toml 中
# 使用 wrangler secret 命令设置
```

本地开发时，创建 `.dev.vars` 文件：

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-service-role-key
```

## 通信方式详解

### Cloudflare Workers ↔ Supabase

```
┌─────────────────────┐
│ Cloudflare Workers  │
└──────────┬──────────┘
           │
           │ HTTPS Request
           │ (Supabase JS SDK)
           ↓
┌─────────────────────┐
│  Supabase API       │
│  (api.supabase.co)  │
└──────────┬──────────┘
           │
           │ 内部通信
           ↓
┌─────────────────────┐
│  PostgreSQL 数据库  │
│  (托管在 Supabase)  │
└─────────────────────┘
```

### 关键点

1. **不需要 TCP 连接**
   - Cloudflare Workers 不支持传统的 PostgreSQL TCP 连接
   - Supabase 提供 HTTPS API，完美适配 Workers

2. **所有通信通过 HTTPS**
   - 安全、可靠
   - 支持全球 CDN 加速

3. **自动处理连接池**
   - Supabase 管理数据库连接
   - 你不需要担心连接池配置

## Row Level Security (RLS)

Supabase 支持行级安全策略，可以在数据库层面控制访问权限。

### 启用 RLS

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取
CREATE POLICY "Allow public read access"
ON users FOR SELECT
USING (true);

-- 创建策略：只允许 service_role 写入
CREATE POLICY "Allow service role to insert/update"
ON users FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');
```

## 性能优化

### 1. 使用索引

确保在 Supabase 中创建了必要的索引：

```sql
CREATE INDEX IF NOT EXISTS idx_users_address ON users(LOWER(address));
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(LOWER(user_address));
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
```

### 2. 启用缓存

在 Workers 中使用 Cache API：

```javascript
async getUser(address) {
  const cacheKey = `user:${address.toLowerCase()}`;
  const cache = caches.default;

  // 尝试从缓存获取
  let response = await cache.match(cacheKey);
  if (response) {
    return response.json();
  }

  // 从数据库查询
  const result = await this.db.getUser(address);

  // 存入缓存（5 分钟）
  response = new Response(JSON.stringify(result), {
    headers: {
      'Cache-Control': 'max-age=300',
      'Content-Type': 'application/json',
    },
  });
  await cache.put(cacheKey, response.clone());

  return result;
}
```

### 3. 批量操作

使用 Supabase 的批量插入：

```javascript
await this.client
  .from('activity_log')
  .insert([
    { user_address: '0x123', action_type: 'login' },
    { user_address: '0x456', action_type: 'update' },
  ]);
```

## 监控和调试

### 查看数据库日志

1. 在 Supabase Dashboard 中
2. 进入 "Database" → "Logs"
3. 查看实时查询日志

### 查看 API 使用情况

1. 进入 "Project Settings" → "Usage"
2. 查看：
   - API 请求数
   - 数据库连接数
   - 存储使用量

## 常见问题

### Q: anon key 和 service_role key 的区别？

**anon key:**
- 用于前端和公开 API
- 受 Row Level Security (RLS) 限制
- 安全，可以暴露给客户端

**service_role key:**
- 用于后端和管理操作
- 绕过所有 RLS 策略
- 必须保密，只在服务器端使用

在 Cloudflare Workers 中，使用 **service_role key**。

### Q: 如何处理大量并发请求？

Supabase 自动处理连接池，但免费版有限制：
- 每分钟 500 个请求
- 同时 60 个数据库连接

解决方案：
1. 使用 Workers 的 Cache API 缓存
2. 升级到付费计划
3. 使用连接池优化

### Q: 数据存储在哪里？

- 数据存储在 AWS（Supabase 使用 AWS 基础设施）
- 创建项目时可以选择区域
- 推荐选择离用户最近的区域

### Q: 如何备份数据？

Supabase 自动每日备份（付费计划）。手动备份：

```bash
# 使用 Supabase CLI
supabase db dump -f backup.sql

# 或使用 pg_dump（需要直接数据库访问）
pg_dump "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" > backup.sql
```

## 费用说明

### 免费版限制

- 500 MB 数据库空间
- 1 GB 文件存储
- 2 GB 带宽
- 50,000 月活用户
- 7 天日志保留

### 升级建议

当以下情况时考虑升级：
- 数据库超过 500 MB
- 需要更多并发连接
- 需要每日自动备份
- 需要更长的日志保留期

## 额外资源

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase JavaScript SDK](https://supabase.com/docs/reference/javascript)
- [PostgREST API 参考](https://postgrest.org/)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)

## 总结

使用 Supabase 的优势：
- ✅ 完全托管，无需维护 PostgreSQL
- ✅ 通过 HTTPS 通信，与 Workers 完美兼容
- ✅ 自动生成 REST API
- ✅ 内置认证和实时功能
- ✅ 免费额度充足
- ✅ 全球 CDN 加速

你不需要自己运行 PostgreSQL，一切都由 Supabase 管理！
