-- Web3 University Database Schema for Cloudflare D1
-- 这是 SQLite 兼容版本的 schema，用于 Cloudflare D1

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on address for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);

-- SQLite trigger to automatically update updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Course metadata (optional, for caching blockchain data)
CREATE TABLE IF NOT EXISTS course_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    author_address TEXT NOT NULL,
    price_in_yd REAL NOT NULL,
    total_enrolled INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,  -- SQLite uses INTEGER for BOOLEAN (0 = false, 1 = true)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_metadata_course_id ON course_metadata(course_id);
CREATE INDEX IF NOT EXISTS idx_course_metadata_author ON course_metadata(author_address);

-- Trigger for course_metadata
CREATE TRIGGER IF NOT EXISTS update_course_metadata_updated_at
    AFTER UPDATE ON course_metadata
    FOR EACH ROW
BEGIN
    UPDATE course_metadata SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;

-- Activity log (optional, for tracking user actions)
CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_address TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_data TEXT,  -- SQLite doesn't have JSONB, use TEXT to store JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_address);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- 注意：
-- 1. SERIAL 替换为 INTEGER PRIMARY KEY AUTOINCREMENT
-- 2. VARCHAR/CHAR 替换为 TEXT
-- 3. TIMESTAMP 替换为 DATETIME
-- 4. BOOLEAN 替换为 INTEGER (0/1)
-- 5. DECIMAL 替换为 REAL
-- 6. JSONB 替换为 TEXT (需要在应用层处理 JSON 序列化/反序列化)
-- 7. PostgreSQL 函数替换为 SQLite 触发器
