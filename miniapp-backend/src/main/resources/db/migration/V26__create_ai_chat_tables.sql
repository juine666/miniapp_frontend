-- AI 会话表
CREATE TABLE IF NOT EXISTS ai_conversation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '会话ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  title VARCHAR(255) NOT NULL COMMENT '会话标题',
  system_prompt VARCHAR(1000) DEFAULT NULL COMMENT '系统提示词',
  summary VARCHAR(1000) DEFAULT NULL COMMENT '会话摘要',
  preference_snapshot VARCHAR(1000) DEFAULT NULL COMMENT '偏好快照',
  last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最后消息时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_ai_conversation_user (user_id),
  KEY idx_ai_conversation_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 会话表';

-- AI 消息表
CREATE TABLE IF NOT EXISTS ai_message (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
  conversation_id BIGINT NOT NULL COMMENT '会话ID',
  role VARCHAR(32) NOT NULL COMMENT '角色(user/assistant/system)',
  content TEXT NOT NULL COMMENT '消息内容',
  tokens INT DEFAULT 0 COMMENT 'token 数量',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  KEY idx_ai_message_conversation (conversation_id, created_at),
  CONSTRAINT fk_ai_message_conversation FOREIGN KEY (conversation_id) REFERENCES ai_conversation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 消息表';

-- 用户偏好表
CREATE TABLE IF NOT EXISTS user_preference (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  preference_key VARCHAR(100) NOT NULL COMMENT '偏好类别',
  preference_value VARCHAR(255) NOT NULL COMMENT '偏好内容',
  confidence DECIMAL(5,4) DEFAULT 0.5000 COMMENT '置信度',
  last_triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '最近触发时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_user_preference (user_id, preference_key, preference_value),
  KEY idx_user_preference_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户偏好表';
