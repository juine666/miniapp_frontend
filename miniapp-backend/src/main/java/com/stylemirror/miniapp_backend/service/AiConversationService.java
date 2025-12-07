package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.AiConversation;
import com.stylemirror.miniapp_backend.mapper.AiConversationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AiConversationService extends ServiceImpl<AiConversationMapper, AiConversation> {

    public List<AiConversation> listByUser(Long userId) {
        return list(new LambdaQueryWrapper<AiConversation>()
                .eq(AiConversation::getUserId, userId)
                .orderByDesc(AiConversation::getLastMessageAt));
    }

    public Optional<AiConversation> findOwnedConversation(Long conversationId, Long userId) {
        return Optional.ofNullable(getOne(new LambdaQueryWrapper<AiConversation>()
                .eq(AiConversation::getId, conversationId)
                .eq(AiConversation::getUserId, userId)));
    }

    public AiConversation createConversation(Long userId, String title, String systemPrompt, String preferenceSnapshot) {
        LocalDateTime now = LocalDateTime.now();
        AiConversation conversation = AiConversation.builder()
                .userId(userId)
                .title(title)
                .systemPrompt(systemPrompt)
                .preferenceSnapshot(preferenceSnapshot)
                .summary(title)
                .lastMessageAt(now)
                .createdAt(now)
                .updatedAt(now)
                .build();
        save(conversation);
        return conversation;
    }

    public void refreshConversation(AiConversation conversation, String summary, String preferenceSnapshot) {
        conversation.setSummary(summary);
        conversation.setPreferenceSnapshot(preferenceSnapshot);
        conversation.setLastMessageAt(LocalDateTime.now());
        conversation.setUpdatedAt(LocalDateTime.now());
        updateById(conversation);
    }
}
