import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { pool } from '../config/database.js';
import { validateSignature } from '../utils/signature.js';

const router = express.Router();

/**
 * GET /api/users/:address
 * 获取用户信息
 */
router.get(
  '/:address',
  param('address').isEthereumAddress(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address } = req.params;

      const result = await pool.query(
        'SELECT * FROM users WHERE LOWER(address) = LOWER($1)',
        [address]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }
);

/**
 * POST /api/users/:address/update-name
 * 更新用户名称（需要签名验证）
 */
router.post(
  '/:address/update-name',
  [
    param('address').isEthereumAddress(),
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('message').notEmpty(),
    body('signature').notEmpty(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address } = req.params;
      const { name, message, signature } = req.body;

      // 验证签名
      const validation = validateSignature(message, signature, address);
      if (!validation.valid) {
        return res.status(401).json({ error: validation.error });
      }

      // 检查消息内容
      if (!message.includes(name)) {
        return res.status(400).json({ error: 'Message does not match name' });
      }

      // 检查用户是否存在
      const userCheck = await pool.query(
        'SELECT * FROM users WHERE LOWER(address) = LOWER($1)',
        [address]
      );

      let result;

      if (userCheck.rows.length === 0) {
        // 创建新用户
        result = await pool.query(
          'INSERT INTO users (address, name) VALUES ($1, $2) RETURNING *',
          [address, name]
        );
      } else {
        // 更新现有用户
        result = await pool.query(
          'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE LOWER(address) = LOWER($2) RETURNING *',
          [name, address]
        );
      }

      // 记录活动日志
      await pool.query(
        'INSERT INTO activity_log (user_address, action_type, action_data) VALUES ($1, $2, $3)',
        [address, 'update_name', JSON.stringify({ name })]
      );

      res.json({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      console.error('Update name error:', error);
      res.status(500).json({ error: 'Failed to update name' });
    }
  }
);

/**
 * GET /api/users/:address/activity
 * 获取用户活动日志
 */
router.get(
  '/:address/activity',
  param('address').isEthereumAddress(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { address } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const result = await pool.query(
        'SELECT * FROM activity_log WHERE LOWER(user_address) = LOWER($1) ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [address, limit, offset]
      );

      res.json({
        activities: result.rows,
        limit,
        offset,
      });
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ error: 'Failed to get activity' });
    }
  }
);

export default router;
