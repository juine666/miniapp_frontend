-- 给聊天消息表添加回复字段
ALTER TABLE chat_message 
ADD COLUMN reply_to_id BIGINT COMMENT '回复的消息ID',
ADD COLUMN reply_to_content VARCHAR(500) COMMENT '回复的消息内容（冗余字段，用于快速显示）',
ADD COLUMN reply_to_nickname VARCHAR(255) COMMENT '被回复者昵称（冗余字段）',
ADD KEY idx_reply_to_id (reply_to_id);
