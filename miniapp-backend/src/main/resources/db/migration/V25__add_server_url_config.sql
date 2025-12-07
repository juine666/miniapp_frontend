-- 添加服务器URL配置项
INSERT INTO system_config (config_key, config_value, description, group_name, is_sensitive) VALUES
('server.url', 'http://192.168.101.4:8081', '后端服务器URL', 'server', FALSE)
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);
