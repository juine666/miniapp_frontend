-- 创建用户每日配额表
CREATE TABLE IF NOT EXISTS user_daily_quota (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  quota_date DATE NOT NULL COMMENT '配额日期',
  used_chars INT DEFAULT 0 COMMENT '已使用字数',
  max_chars INT DEFAULT 1000 COMMENT '每日限制字数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY unique_user_date (user_id, quota_date),
  INDEX idx_user_id (user_id),
  INDEX idx_quota_date (quota_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户每日配额表';
