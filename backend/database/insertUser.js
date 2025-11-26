import { pool } from '../config/database.js'; // 导入连接池，注意路径
// 或者如果你的 database.js 默认导出 pool:
// import pool from '../config/database.js';

/**
 * @dev 插入新的用户数据到 users 表
 * @param {string} address 用户的钱包地址 (VARCHAR(42) UNIQUE NOT NULL)
 * @param {string} name 用户的名称 (VARCHAR(100))
 */
async function insertUser(address, name) {
  // 定义 SQL 插入语句
  const sql = `
    INSERT INTO users (address, name)
    VALUES ($1, $2)
    RETURNING id, created_at;
  `;

  // 定义要插入的值（参数化查询：使用 $1, $2 来防止 SQL 注入）
  const values = [address, name];

  try {
    // 使用 pool.query 执行 SQL 语句
    const result = await pool.query(sql, values);
    
    // 返回新插入记录的ID和创建时间
    console.log('User inserted successfully:', result.rows[0]); 
    return result.rows[0];

  } catch (error) {
    console.error('Error inserting user:', error);
    throw error; // 抛出错误以便上层调用者处理
  }
}

// 示例调用
async function runInsertionExample() {
    // 假设这是要插入的测试数据
    const testAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const testName = 'Alice Web3';

    try {
        console.log(`Attempting to insert user: ${testName} with address: ${testAddress}`);
        await insertUser(testAddress, testName);
    } catch (e) {
        console.log('Failed to run example.');
    } finally {
        // 在示例完成后，手动结束连接池进程，实际应用中不需要
        await pool.end();
        console.log('Database connection pool closed.');
    }
}

runInsertionExample(); 
// 请取消注释这行代码，然后使用 Node 执行此文件