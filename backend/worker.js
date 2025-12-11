/**
 * Cloudflare Workers 入口文件
 * 由于 Cloudflare Workers 与 Express 的兼容性限制，
 * 这里使用原生的 fetch API 处理路由
 */

import { validateSignature } from './utils/signature.js';
import { createDatabaseClient } from './config/database-workers.js';

/**
 * CORS 处理
 */
function corsHeaders(origin, env) {
  console.log('corsHeaders', env.CORS_ORIGIN,origin);
  const allowedOrigins = env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
  const allowOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  console.log('allowedOrigins=', allowedOrigins);
  console.log('allowOrigin=', allowOrigin);
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * 路由处理器
 */
class Router {
  constructor(env, db) {
    this.env = env;
    this.db = db;
  }

  async route(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    this.origin = request.headers.get('Origin');

    // 处理 CORS 预检请求
    if (method === 'OPTIONS') {
      console.log('method=OPTIONS', request.url);
      return this.corsResponse(request);
    }

    // 路由匹配
    try {
      // Health check
      if (path === '/api/health' && method === 'GET') {
        return this.jsonResponse({
          status: 'ok',
          message: 'Web3 University API is running on Cloudflare Workers'
        });
      }

      // GET /api/users/:address
      const getUserMatch = path.match(/^\/api\/users\/([^\/]+)$/);
      console.log('getUserMatch:', getUserMatch);
      console.log('method:', method);
      if (getUserMatch && method === 'GET') {
        return await this.getUser(getUserMatch[1]);
      }

      // POST /api/users/:address/update-name
      const updateNameMatch = path.match(/^\/api\/users\/([^\/]+)\/update-name$/);
      if (updateNameMatch && method === 'POST') {
        const body = await request.json();
        return await this.updateUserName(updateNameMatch[1], body);
      }

      // GET /api/users/:address/activity
      const getActivityMatch = path.match(/^\/api\/users\/([^\/]+)\/activity$/);
      if (getActivityMatch && method === 'GET') {
        const limit = url.searchParams.get('limit') || '50';
        const offset = url.searchParams.get('offset') || '0';
        return await this.getUserActivity(getActivityMatch[1], parseInt(limit), parseInt(offset));
      }

      // 404
      return this.jsonResponse({ error: 'Route not found' }, 404);

    } catch (error) {
      console.error('Route error:', error);
      return this.jsonResponse({
        error: 'Internal server error',
        message: this.env.NODE_ENV === 'development' ? error.message : undefined
      }, 500);
    }
  }

  // 用户路由处理器
  async getUser(address) {
    if (!this.isValidEthAddress(address)) {
      return this.jsonResponse({ error: 'Invalid Ethereum address' }, 400);
    }

    try {
      // 优先使用专用方法（Supabase 适配器提供）
      let result;
      if (typeof this.db.getUser === 'function') {
        result = await this.db.getUser(address);
      } else {
        // 回退到原始 SQL 查询
        result = await this.db.query(
          'SELECT * FROM users WHERE LOWER(address) = LOWER($1)',
          [address]
        );
      }
      console.log('result:', result);
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
      let result;

      // 使用专用方法（如果可用）
      if (typeof this.db.userExists === 'function') {
        const exists = await this.db.userExists(address);

        if (!exists) {
          // 创建新用户
          result = await this.db.createUser(address, name);
        } else {
          // 更新现有用户
          result = await this.db.updateUserName(address, name);
        }

        // 记录活动日志
        await this.db.logActivity(address, 'update_name', { name });
      } else {
        // 回退到原始 SQL 查询
        const userCheck = await this.db.query(
          'SELECT * FROM users WHERE LOWER(address) = LOWER($1)',
          [address]
        );

        if (userCheck.rows.length === 0) {
          // 创建新用户
          result = await this.db.query(
            'INSERT INTO users (address, name) VALUES ($1, $2) RETURNING *',
            [address, name]
          );
        } else {
          // 更新现有用户
          result = await this.db.query(
            'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(address) = LOWER($2) RETURNING *',
            [name, address]
          );
        }

        // 记录活动日志
        await this.db.query(
          'INSERT INTO activity_log (user_address, action_type, action_data) VALUES ($1, $2, $3)',
          [address, 'update_name', JSON.stringify({ name })]
        );
      }

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
      // 使用专用方法（如果可用）
      let result;
      if (typeof this.db.getUserActivity === 'function') {
        result = await this.db.getUserActivity(address, limit, offset);
      } else {
        // 回退到原始 SQL 查询
        result = await this.db.query(
          'SELECT * FROM activity_log WHERE LOWER(user_address) = LOWER($1) ORDER BY created_at DESC LIMIT $2 OFFSET $3',
          [address, limit, offset]
        );
      }

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

  // 工具方法
  isValidEthAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(this.origin, this.env),
      },
    });
  }

  corsResponse(request) {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(request.headers.get('Origin'), this.env),
    });
  }
}

/**
 * Cloudflare Workers 默认导出
 */
export default {
  async fetch(request, env, ctx) {
    console.log('fetch-env', env);
    // 异步创建数据库客户端
    const db = await createDatabaseClient(env);
    const router = new Router(env, db);
    return await router.route(request);
  },
};
