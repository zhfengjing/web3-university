import { ethers } from 'ethers';

/**
 * 验证以太坊签名
 * @param {string} message - 原始消息
 * @param {string} signature - 签名
 * @param {string} expectedAddress - 预期的签名者地址
 * @returns {boolean} - 验证是否成功
 */
export function verifySignature(message, signature, expectedAddress) {
  try {
    // 恢复签名者地址
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // 比较地址（不区分大小写）
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * 验证消息时间戳，防止重放攻击
 * @param {string} message - 消息内容
 * @param {number} maxAgeMs - 最大有效期（毫秒）
 * @returns {boolean} - 时间戳是否有效
 */
export function verifyTimestamp(message, maxAgeMs = 5 * 60 * 1000) {
  try {
    // 从消息中提取时间戳
    const timestampMatch = message.match(/时间戳:\s*(\d+)/);
    if (!timestampMatch) {
      return false;
    }

    const timestamp = parseInt(timestampMatch[1], 10);
    const now = Date.now();
    const age = now - timestamp;

    // 检查时间戳是否在有效期内
    return age >= 0 && age <= maxAgeMs;
  } catch (error) {
    console.error('Timestamp verification error:', error);
    return false;
  }
}

/**
 * 完整的签名验证流程
 * @param {string} message - 消息内容
 * @param {string} signature - 签名
 * @param {string} address - 签名者地址
 * @returns {Object} - 验证结果
 */
export function validateSignature(message, signature, address) {
  // 验证签名
  const isValidSignature = verifySignature(message, signature, address);
  if (!isValidSignature) {
    return {
      valid: false,
      error: 'Invalid signature',
    };
  }

  // 验证时间戳
  const isValidTimestamp = verifyTimestamp(message);
  if (!isValidTimestamp) {
    return {
      valid: false,
      error: 'Invalid or expired timestamp',
    };
  }

  return {
    valid: true,
  };
}
