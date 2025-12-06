package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.stylemirror.miniapp_backend.domain.ChatMessage;
import com.stylemirror.miniapp_backend.mapper.ChatMessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatMessageService {
    private final ChatMessageMapper chatMessageMapper;
    
    /**
     * 发送聊天消息
     */
    public ChatMessage sendMessage(Long productId, String userId, String nickname, String avatarUrl, String content, Long replyToId, String atUsernames) {
        ChatMessage message = new ChatMessage();
        message.setProductId(productId);
        message.setUserId(userId);
        message.setNickname(nickname);
        message.setAvatarUrl(avatarUrl);
        message.setContent(content);
        message.setReplyToId(replyToId);
        message.setAtUsernames(atUsernames);
        
        // 如果是回复消息，填充被回复消息的信息
        if (replyToId != null) {
            ChatMessage repliedMessage = chatMessageMapper.selectById(replyToId);
            if (repliedMessage != null) {
                message.setReplyToContent(repliedMessage.getContent());
                message.setReplyToNickname(repliedMessage.getNickname());
            }
        }
        
        message.setCreatedAt(LocalDateTime.now());
        message.setUpdatedAt(LocalDateTime.now());
        
        chatMessageMapper.insert(message);
        log.info("发送消息成功，商品ID: {}，用户: {}，回复ID: {}，@用户: {}", productId, userId, replyToId, atUsernames);
        
        return message;
    }
    
    /**
     * 获取商品的聊天消息列表
     */
    public List<ChatMessage> getMessages(Long productId, long sinceTimestamp) {
        QueryWrapper<ChatMessage> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("product_id", productId)
                .gt("created_at", LocalDateTime.ofEpochSecond(sinceTimestamp / 1000, 0, java.time.ZoneOffset.UTC))
                .orderByAsc("created_at");
        
        return chatMessageMapper.selectList(queryWrapper);
    }
    
    /**
     * 获取商品的最新N条消息
     */
    public List<ChatMessage> getLatestMessages(Long productId, int limit) {
        QueryWrapper<ChatMessage> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("product_id", productId)
                .orderByDesc("created_at")
                .last("LIMIT " + limit);
        
        List<ChatMessage> messages = chatMessageMapper.selectList(queryWrapper);
        // 反转列表使其按时间升序
        messages.forEach(m -> {}); // 防止reverse的NPE
        java.util.Collections.reverse(messages);
        
        return messages;
    }
}
