package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Message;
import com.stylemirror.miniapp_backend.repository.MessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 消息服务类
 * 负责用户消息的增删查操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {
    private final MessageMapper messageMapper;
    private final ModerationService moderationService;

    /**
     * 发送消息
     */
    @Transactional(rollbackFor = Exception.class)
    public Message sendMessage(Long fromUserId, Long toUserId, String content) {
        // 敏感词过滤
        moderationService.assertCleanText(content);
        
        Message message = new Message();
        message.setFromUser(fromUserId);
        message.setToUser(toUserId);
        message.setContent(content);
        messageMapper.insert(message);
        log.info("发送消息，发送者ID: {}, 接收者ID: {}, 内容: {}", fromUserId, toUserId, content);
        return message;
    }

    /**
     * 获取两个用户之间的聊天记录
     */
    public List<Message> getConversation(Long userId1, Long userId2) {
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.and(w -> w.and(w1 -> w1.eq("from_user", userId1).eq("to_user", userId2))
                .or(w2 -> w2.eq("from_user", userId2).eq("to_user", userId1)));
        wrapper.orderByAsc("created_at");
        return messageMapper.selectList(wrapper);
    }

    /**
     * 获取用户的所有会话列表（最近一条消息）- 支持分页
     */
    public PageResponse<Message> getConversationList(Long userId, int page, int size) {
        Page<Message> pageObj = new Page<>(page, size);
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.and(w -> w.eq("from_user", userId).or().eq("to_user", userId));
        wrapper.orderByDesc("created_at");
        Page<Message> result = messageMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 获取用户的所有会话列表（最近一条消息）- 不分页（兼容旧接口）
     */
    public List<Message> getConversationList(Long userId) {
        // 获取所有与用户相关的消息，按时间倒序，去重得到最近一条
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.and(w -> w.eq("from_user", userId).or().eq("to_user", userId));
        wrapper.orderByDesc("created_at");
        return messageMapper.selectList(wrapper);
    }

    /**
     * 标记消息为已读
     */
    @Transactional(rollbackFor = Exception.class)
    public void markAsRead(Long messageId, Long userId) {
        Message message = messageMapper.selectById(messageId);
        if (message != null && message.getToUser().equals(userId)) {
            message.setReadFlag(1);
            messageMapper.updateById(message);
            log.info("标记消息已读，消息ID: {}", messageId);
        }
    }

    /**
     * 获取用户的未读消息总数
     */
    public int getUnreadCount(Long userId) {
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.eq("to_user", userId);
        wrapper.eq("read_flag", 0);
        return messageMapper.selectCount(wrapper).intValue();
    }

    /**
     * 标记与指定用户的所有未读消息为已读
     */
    @Transactional(rollbackFor = Exception.class)
    public void markConversationAsRead(Long userId, Long otherUserId) {
        QueryWrapper<Message> wrapper = new QueryWrapper<>();
        wrapper.eq("from_user", otherUserId);
        wrapper.eq("to_user", userId);
        wrapper.eq("read_flag", 0);
        
        List<Message> unreadMessages = messageMapper.selectList(wrapper);
        for (Message message : unreadMessages) {
            message.setReadFlag(1);
            messageMapper.updateById(message);
        }
        log.info("标记会话消息为已读，用户ID: {}, 对方ID: {}, 已读消息数: {}", userId, otherUserId, unreadMessages.size());
    }
}

