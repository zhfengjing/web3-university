/**
 * Supabase 数据库适配器
 * 使用 Supabase JavaScript SDK，通过 HTTPS 与数据库通信
 *
 * 注意：Supabase 已经是托管的 PostgreSQL，不需要额外启动数据库服务
 */

import { createClient } from '@supabase/supabase-js';

export class SupabaseAdapter {
  constructor(env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_KEY are required');
    }

    // 创建 Supabase 客户端
    // 所有通信通过 HTTPS，不需要 TCP 连接
    this.client = createClient(
      env.SUPABASE_URL,      // 你的 Supabase 项目 URL
      env.SUPABASE_KEY,      // 你的 Supabase API Key (使用 service_role key)
      {
        auth: {
          persistSession: false,  // Workers 环境不需要持久化 session
          autoRefreshToken: false,
        },
      }
    );
  }

  /**
   * 获取用户信息
   */
  async getUser(address) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .ilike('address', address)  // 不区分大小写的匹配
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // 用户不存在
        return { rows: [], rowCount: 0 };
      }
      throw error;
    }

    return { rows: data ? [data] : [], rowCount: data ? 1 : 0 };
  }

  /**
   * 检查用户是否存在
   */
  async userExists(address) {
    const { data, error } = await this.client
      .from('users')
      .select('id')
      .ilike('address', address)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  }

  /**
   * 创建新用户
   */
  async createUser(address, name) {
    const { data, error } = await this.client
      .from('users')
      .insert({
        address,
        name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
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
        action_data: actionData,  // Supabase 自动处理 JSON
        created_at: new Date().toISOString(),
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
   * 批量插入活动日志
   */
  async batchLogActivities(activities) {
    const { data, error } = await this.client
      .from('activity_log')
      .insert(activities.map(activity => ({
        ...activity,
        created_at: new Date().toISOString(),
      })))
      .select();

    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  }

  /**
   * 获取课程元数据（如果需要）
   */
  async getCourseMetadata(courseId) {
    const { data, error } = await this.client
      .from('course_metadata')
      .select('*')
      .eq('course_id', courseId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { rows: [], rowCount: 0 };
      }
      throw error;
    }

    return { rows: data ? [data] : [], rowCount: data ? 1 : 0 };
  }

  /**
   * 更新或创建课程元数据
   */
  async upsertCourseMetadata(courseData) {
    const { data, error } = await this.client
      .from('course_metadata')
      .upsert(
        {
          ...courseData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'course_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return { rows: [data], rowCount: 1 };
  }

  /**
   * 执行原始 SQL（如果需要）
   * 注意：需要在 Supabase 中创建对应的 RPC 函数
   */
  async executeRawSQL(functionName, params) {
    const { data, error } = await this.client.rpc(functionName, params);

    if (error) throw error;
    return { rows: data || [], rowCount: data?.length || 0 };
  }

  /**
   * 测试连接
   */
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1);

      if (error) throw error;
      return { success: true, message: 'Supabase connection successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

export default SupabaseAdapter;
