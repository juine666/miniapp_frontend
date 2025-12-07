-- 更新微信小程序配置
UPDATE system_config 
SET config_value = 'wx0af23fd2a82b2553' 
WHERE config_key = 'wechat.appid';

-- 如果需要配置secret，也可以在这里添加（注意：secret是敏感信息，实际部署时应该使用环境变量）
-- UPDATE system_config 
-- SET config_value = 'your_wechat_secret' 
-- WHERE config_key = 'wechat.secret';
