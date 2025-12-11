/**
 * Cloudflare Workers 数据库配置
 * 支持多种数据库连接方式：
 * 1. Cloudflare D1 (推荐)
 * 2. Neon PostgreSQL (HTTP API)
 * 3. Supabase PostgreSQL (HTTP API)
 */

/**
 * Cloudflare D1 数据库适配器
 */
export class D1DatabaseAdapter {
  constructor(d1Database) {
    this.db = d1Database;
  }

  async query(sql, params = []) {
    try {
      let statement = this.db.prepare(sql);

      // 绑定参数（将 $1, $2 格式转换为 ?）
      if (params.length > 0) {
        statement = statement.bind(...params);
      }

      const result = await statement.all();

      return {
        rows: result.results || [],
        rowCount: result.results?.length || 0,
      };
    } catch (error) {
      console.error('D1 query error:', error);
      throw error;
    }
  }
}

/**
 * Neon PostgreSQL HTTP API 适配器
 * 文档: https://neon.tech/docs/serverless/serverless-driver
 */
export class NeonDatabaseAdapter {
  constructor(connectionString) {
    this.connectionString = connectionString;
  }

  async query(sql, params = []) {
    try {
      // 将 PostgreSQL 参数格式 ($1, $2) 转换为实际值
      let formattedSql = sql;
      params.forEach((param, index) => {
        formattedSql = formattedSql.replace(`$${index + 1}`, this.escapeValue(param));
      });

      const response = await fetch(this.connectionString, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: formattedSql,
        }),
      });

      if (!response.ok) {
        throw new Error(`Neon query failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        rows: data.rows || [],
        rowCount: data.rows?.length || 0,
      };
    } catch (error) {
      console.error('Neon query error:', error);
      throw error;
    }
  }

  escapeValue(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    }
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    return value;
  }
}

/**
 * Supabase PostgreSQL 适配器
 * 使用 Supabase JavaScript SDK
 * 注意：推荐使用 database-supabase.js 中的 SupabaseAdapter
 */
export class SupabaseDatabaseAdapter {
  constructor(url, apiKey) {
    this.url = url;
    this.apiKey = apiKey;
    console.warn('建议使用 database-supabase.js 中的 SupabaseAdapter，它提供了更完整的功能');
  }

  async query(sql, params = []) {
    try {
      // 这是一个简化的实现
      // 实际使用中建议使用 @supabase/supabase-js 客户端
      const response = await fetch(`${this.url}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey,
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: sql,
          params: params,
        }),
      });

      if (!response.ok) {
        throw new Error(`Supabase query failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        rows: data || [],
        rowCount: data?.length || 0,
      };
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  }
}

/**
 * 数据库工厂函数
 * 根据环境变量选择合适的数据库适配器
 */
export async function createDatabaseClient(env) {
  // 优先使用 Cloudflare D1
  if (env.DB) {
    console.log('Using Cloudflare D1 database');
    return new D1DatabaseAdapter(env.DB);
  }

  // 使用 Neon PostgreSQL
  if (env.NEON_CONNECTION_STRING) {
    console.log('Using Neon PostgreSQL database');
    return new NeonDatabaseAdapter(env.NEON_CONNECTION_STRING);
  }

  // 使用 Supabase（推荐使用完整的 SupabaseAdapter）
  if (env.SUPABASE_URL && env.SUPABASE_KEY) {
    console.log('Using Supabase database');
    // 动态导入 SupabaseAdapter
    try {
      const { SupabaseAdapter } = await import('./database-supabase.js');
      return new SupabaseAdapter(env);
    } catch (error) {
      console.warn('Failed to load SupabaseAdapter, using basic implementation:', error.message);
      return new SupabaseDatabaseAdapter(env.SUPABASE_URL, env.SUPABASE_KEY);
    }
  }

  // 如果没有配置任何数据库，返回一个模拟客户端
  console.warn('No database configured, using mock client');
  return {
    async query(sql, params) {
      console.warn('Mock database query:', sql, params);
      return { rows: [], rowCount: 0 };
    },
    async getUser(address) {
      console.warn('Mock getUser:', address);
      return { rows: [], rowCount: 0 };
    },
    async createUser(address, name) {
      console.warn('Mock createUser:', address, name);
      return { rows: [], rowCount: 0 };
    },
    async updateUserName(address, name) {
      console.warn('Mock updateUserName:', address, name);
      return { rows: [], rowCount: 0 };
    },
    async userExists(address) {
      console.warn('Mock userExists:', address);
      return false;
    },
    async logActivity(userAddress, actionType, actionData) {
      console.warn('Mock logActivity:', userAddress, actionType);
      return { rows: [], rowCount: 0 };
    },
    async getUserActivity(address, limit, offset) {
      console.warn('Mock getUserActivity:', address);
      return { rows: [], rowCount: 0 };
    },
  };
}

export default {
  D1DatabaseAdapter,
  NeonDatabaseAdapter,
  SupabaseDatabaseAdapter,
  createDatabaseClient,
};
