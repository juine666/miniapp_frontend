package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.AiMessage;
import com.stylemirror.miniapp_backend.mapper.AiMessageMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiMessageService extends ServiceImpl<AiMessageMapper, AiMessage> {

    public List<AiMessage> listRecentMessages(Long conversationId, int limit) {
        List<AiMessage> messages = list(new LambdaQueryWrapper<AiMessage>()
                .eq(AiMessage::getConversationId, conversationId)
                .orderByDesc(AiMessage::getCreatedAt)
                .last("LIMIT " + limit));
        Collections.reverse(messages);
        return messages;
    }

    public List<AiMessage> listChronologicalMessages(Long conversationId, int limit) {
        LambdaQueryWrapper<AiMessage> wrapper = new LambdaQueryWrapper<AiMessage>()
                .eq(AiMessage::getConversationId, conversationId)
                .orderByAsc(AiMessage::getCreatedAt);
        if (limit > 0) {
            wrapper.last("LIMIT " + limit);
        }
        return list(wrapper);
    }

    public AiMessage appendMessage(Long conversationId, String role, String content, Integer tokens) {
        AiMessage message = AiMessage.builder()
                .conversationId(conversationId)
                .role(role)
                .content(content)
                .tokens(tokens)
                .createdAt(LocalDateTime.now())
                .build();
        save(message);
        return message;
    }
}
