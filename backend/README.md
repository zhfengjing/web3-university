# Web3 University - Backend

基于 Express + PostgreSQL 的后端 API 服务。

## 技术栈

- **Express.js**: Web 框架
- **PostgreSQL**: 数据库
- **Ethers.js**: 签名验证
- **CORS**: 跨域支持

## 项目结构

```
backend/
├── routes/           # API 路由
│   └── users.js
├── utils/            # 工具函数
│   └── signature.js
├── config/           # 配置文件
│   └── database.js
├── database/         # 数据库相关
│   ├── schema.sql
│   └── init.js
└── server.js         # 主服务器文件
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 安装 PostgreSQL
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql
sudo service postgresql start
```

### 3. 创建数据库
```bash
createdb web3_university
```

### 4. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web3_university
DB_USER=postgres
DB_PASSWORD=your_password
```

### 5. 初始化数据库
```bash
node database/init.js
```

### 6. 启动服务器
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务器将运行在 http://localhost:5000

## API 文档

### 用户相关

#### 获取用户信息
```
GET /api/users/:address
```

**响应示例**:
```json
{
  "id": 1,
  "address": "0x1234...",
  "name": "Alice",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

#### 更新用户名称
```
POST /api/users/:address/update-name
```

**请求体**:
```json
{
  "name": "New Name",
  "message": "更新名称为: New Name\n时间戳: 1234567890",
  "signature": "0xabc..."
}
```

**响应示例**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "address": "0x1234...",
    "name": "New Name",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 获取用户活动日志
```
GET /api/users/:address/activity?limit=50&offset=0
```

**响应示例**:
```json
{
  "activities": [
    {
      "id": 1,
      "user_address": "0x1234...",
      "action_type": "update_name",
      "action_data": { "name": "Alice" },
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "limit": 50,
  "offset": 0
}
```

### 健康检查

```
GET /api/health
```

**响应示例**:
```json
{
  "status": "ok",
  "message": "Web3 University API is running"
}
```

## 数据库设计

### users 表
存储用户基本信息

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) UNIQUE NOT NULL,
    name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### activity_log 表
记录用户活动

```sql
CREATE TABLE activity_log (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    action_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### course_metadata 表
缓存课程信息（可选）

```sql
CREATE TABLE course_metadata (
    id SERIAL PRIMARY KEY,
    course_id INTEGER UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    author_address VARCHAR(42) NOT NULL,
    price_in_yd DECIMAL(18, 8) NOT NULL,
    total_enrolled INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 签名验证

### 验证流程

1. **前端生成消息**:
```javascript
const message = `更新名称为: ${name}\n时间戳: ${Date.now()}`;
```

2. **用户签名**:
```javascript
const signature = await signMessageAsync({ message });
```

3. **发送到后端**:
```javascript
await axios.post('/api/users/address/update-name', {
  name,
  message,
  signature
});
```

4. **后端验证**:
```javascript
// 验证签名
const recoveredAddress = ethers.verifyMessage(message, signature);

// 验证时间戳
const timestamp = extractTimestamp(message);
const isValid = Date.now() - timestamp < 5 * 60 * 1000; // 5分钟内有效
```

### 安全特性

- ✅ 签名验证确保请求来自正确的钱包
- ✅ 时间戳防止重放攻击
- ✅ 消息内容验证确保数据完整性
- ✅ SQL 注入防护（参数化查询）
- ✅ 输入验证和消毒

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 5000 |
| NODE_ENV | 环境模式 | development |
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 5432 |
| DB_NAME | 数据库名称 | web3_university |
| DB_USER | 数据库用户 | postgres |
| DB_PASSWORD | 数据库密码 | - |
| CORS_ORIGIN | CORS 允许的源 | http://localhost:3000 |

## 错误处理

### 标准错误响应
```json
{
  "error": "错误类型",
  "message": "详细错误信息"
}
```

### HTTP 状态码
- `200` - 成功
- `400` - 请求参数错误
- `401` - 签名验证失败
- `404` - 资源不存在
- `500` - 服务器内部错误

## 开发建议

### 日志记录
使用 console.log 记录重要操作：
```javascript
console.log('User updated:', address);
console.error('Database error:', error);
```

### 数据库连接池
使用连接池提高性能：
```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 参数验证
使用 express-validator：
```javascript
body('name').trim().isLength({ min: 1, max: 100 })
```

## 部署

### 传统部署（Node.js 服务器）

#### 开发环境
```bash
npm run dev
```

#### 生产环境
```bash
npm start
```

#### 使用 PM2
```bash
npm install -g pm2
pm2 start server.js --name web3-university-api
pm2 save
```

### Cloudflare Workers 部署

本项目支持部署到 Cloudflare Workers，享受全球边缘网络和无服务器架构的优势。

#### 快速开始

1. **安装依赖**
```bash
npm install
```

2. **登录 Cloudflare**
```bash
npm run workers:login
```

3. **本地开发**
```bash
npm run workers:dev
```

4. **部署到生产**
```bash
npm run workers:deploy
```

#### 详细文档

查看完整的 Cloudflare Workers 部署指南：
**[CLOUDFLARE_WORKERS_DEPLOYMENT.md](./CLOUDFLARE_WORKERS_DEPLOYMENT.md)**

#### Workers 特性

- ✅ 全球边缘网络，低延迟
- ✅ 自动扩展，无需配置
- ✅ 支持多种数据库方案（D1, Neon, Supabase）
- ✅ 免费额度充足（每天 100,000 次请求）
- ✅ 内置 DDoS 防护和 CDN

#### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run workers:dev` | 本地开发服务器 |
| `npm run workers:deploy` | 部署到生产环境 |
| `npm run workers:tail` | 查看实时日志 |
| `npm run workers:login` | 登录 Cloudflare |

#### 数据库选项

Cloudflare Workers 支持以下数据库方案：

1. **Cloudflare D1**（推荐）- 内置 SQLite 数据库
2. **Neon PostgreSQL** - 无服务器 PostgreSQL
3. **Supabase** - 开源 PostgreSQL 平台

详细配置请参考：[CLOUDFLARE_WORKERS_DEPLOYMENT.md](./CLOUDFLARE_WORKERS_DEPLOYMENT.md)

## 常见问题

**Q: 数据库连接失败？**
A: 检查 PostgreSQL 是否运行，以及 `.env` 配置是否正确。

**Q: 签名验证失败？**
A: 确保前端发送的消息格式正确，且时间戳在有效期内（5分钟）。

**Q: CORS 错误？**
A: 检查 `.env` 中的 `CORS_ORIGIN` 是否正确配置。

**Q: 如何备份数据库？**
A: 使用 `pg_dump` 命令：
```bash
pg_dump web3_university > backup.sql
```

## 监控和维护

### 日志查看
```bash
# PM2 日志
pm2 logs web3-university-api

# 直接运行
tail -f logs/error.log
```

### 性能监控
- 使用 PM2 监控进程状态
- 监控数据库连接池使用情况
- 记录 API 响应时间

## 相关资源

- [Express.js 文档](https://expressjs.com/)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Ethers.js 文档](https://docs.ethers.org/)
- [Node.js 最佳实践](https://github.com/goldbergyoni/nodebestpractices)
