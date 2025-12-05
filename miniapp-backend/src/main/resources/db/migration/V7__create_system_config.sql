-- 创建系统配置表
CREATE TABLE IF NOT EXISTS system_config (
  id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键',
  config_key VARCHAR(255) NOT NULL UNIQUE COMMENT '配置键',
  config_value LONGTEXT COMMENT '配置值',
  description VARCHAR(500) COMMENT '配置描述',
  group_name VARCHAR(50) COMMENT '配置分组（oss、email、sms等）',
  is_sensitive BOOLEAN DEFAULT FALSE COMMENT '是否敏感信息',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_group_name (group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 初始化 OSS 配置
INSERT INTO system_config (config_key, config_value, description, group_name, is_sensitive) VALUES
('oss.endpoint', 'oss-cn-shenzhen.aliyuncs.com', 'OSS 服务地址', 'oss', FALSE),
('oss.bucket', 'twoshop', 'OSS 存储桶名称', 'oss', FALSE),
('oss.publicBaseUrl', 'https://twoshop.oss-cn-shenzhen.aliyuncs.com', 'OSS 公网访问地址', 'oss', FALSE),
('oss.accessKeyId', 'LTAI5tDwqnzSyDZSACU2h4XL123', 'OSS 访问密钥ID（敏感信息）', 'oss', TRUE),
('oss.accessKeySecret', 'vg0aHIIEbaJhG1sK0ilA1xlI5i8f3R123', 'OSS 访问密钥Secret（敏感信息）', 'oss', TRUE),
-- 初始化腾讯云配置
('tencent.secretId', '', '腾讯云 API 密钥ID（敏感信息）', 'tencent', TRUE),
('tencent.secretKey', '', '腾讯云 API 密钥Secret（敏感信息）', 'tencent', TRUE),
('tencent.region', 'ap-beijing', '腾讯云服务区域', 'tencent', FALSE),
-- 初始化微信小程序配置
('wechat.appid', '', '微信小程序 AppID（敏感信息）', 'wechat', TRUE),
('wechat.secret', '', '微信小程序 Secret（敏感信息）', 'wechat', TRUE)
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
