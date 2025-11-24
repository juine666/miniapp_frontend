-- 优化查询性能的索引

-- 为管理后台商品查询添加复合索引（状态 + 创建时间）
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);

-- 为商品名称搜索优化索引
CREATE FULLTEXT INDEX IF NOT EXISTS idx_products_fulltext ON products(name, description);

-- 为用户查询优化
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_banned ON users(banned);

-- 为分类查询优化
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
