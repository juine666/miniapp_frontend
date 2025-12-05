-- 创建聊天消息表
CREATE TABLE IF NOT EXISTS chat_message (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
  product_id BIGINT NOT NULL COMMENT '商品ID',
  user_id VARCHAR(255) NOT NULL COMMENT '发送者用户ID',
  nickname VARCHAR(255) COMMENT '发送者昵称',
  avatar_url VARCHAR(500) COMMENT '发送者头像',
  content TEXT NOT NULL COMMENT '消息内容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_product_id (product_id),
  KEY idx_user_id (user_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='聊天消息表';
