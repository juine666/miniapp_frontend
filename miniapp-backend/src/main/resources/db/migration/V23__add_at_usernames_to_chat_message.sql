-- 给聊天消息表添加@用户字段
ALTER TABLE chat_message 
ADD COLUMN at_usernames VARCHAR(1000) COMMENT '被@的用户名列表（JSON格式）';
