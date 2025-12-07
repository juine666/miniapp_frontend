package com.stylemirror.miniapp_backend.service;

import com.stylemirror.miniapp_backend.domain.AiConversation;
import com.stylemirror.miniapp_backend.domain.AiMessage;
import com.stylemirror.miniapp_backend.util.PreferenceExtractor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiChatService {

    private static final int CONTEXT_LIMIT = 12;
    private static final int MESSAGE_FETCH_LIMIT = 100;
    private static final String DEFAULT_PROMPT = "你是StyleMirror智能穿搭顾问，请用中文回答，语气温和，回答不要超过200字。";

    private final AiConversationService aiConversationService;
    private final AiMessageService aiMessageService;
    private final UserPreferenceService userPreferenceService;
    private final WenxinClient wenxinClient;

    public AiConversation startConversation(Long userId, String title, String systemPrompt) {
        String finalTitle = StringUtils.hasText(title) ? title.trim() : "新的智能助理会话";
        String prompt = StringUtils.hasText(systemPrompt) ? systemPrompt.trim() : DEFAULT_PROMPT;
        String preferenceSnapshot = userPreferenceService.buildPreferenceSummary(userId);
        return aiConversationService.createConversation(userId, finalTitle, prompt, preferenceSnapshot);
    }

    public List<AiConversation> listConversations(Long userId) {
        return aiConversationService.listByUser(userId);
    }

    public List<AiMessage> listMessages(Long userId, Long conversationId, int limit) {
        AiConversation conversation = aiConversationService.findOwnedConversation(conversationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("会话不存在"));
        int cappedLimit = limit > 0 ? Math.min(limit, MESSAGE_FETCH_LIMIT) : MESSAGE_FETCH_LIMIT;
        return aiMessageService.listChronologicalMessages(conversation.getId(), cappedLimit);
    }

    public AiMessage sendUserMessage(Long userId, Long conversationId, String userMessage) {
        if (!StringUtils.hasText(userMessage)) {
            throw new IllegalArgumentException("消息内容不能为空");
        }
        AiConversation conversation = aiConversationService.findOwnedConversation(conversationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("会话不存在"));

        PreferenceExtractor.extract(userMessage).forEach(pref ->
                userPreferenceService.recordPreference(userId, pref.key(), pref.value(), pref.confidence()));

        AiMessage userRecord = aiMessageService.appendMessage(conversation.getId(), "user", userMessage.trim(), null);
        List<AiMessage> context = aiMessageService.listRecentMessages(conversation.getId(), CONTEXT_LIMIT);
        List<WenxinClient.Message> payload = buildPayload(conversation, context);
        WenxinClient.ChatCompletion completion = wenxinClient.chat(payload);
        AiMessage assistantRecord = aiMessageService.appendMessage(conversation.getId(), "assistant", completion.content(), completion.totalTokens());

        String preferenceSnapshot = userPreferenceService.buildPreferenceSummary(userId);
        String summary = truncateSummary(assistantRecord.getContent());
        aiConversationService.refreshConversation(conversation, summary, preferenceSnapshot);

        log.info("文心一言回复成功，conversationId={}, userMessageLength={}, replyLength={}",
                conversationId, userRecord.getContent().length(), assistantRecord.getContent().length());
        return assistantRecord;
    }

    private List<WenxinClient.Message> buildPayload(AiConversation conversation, List<AiMessage> context) {
        List<WenxinClient.Message> payload = new ArrayList<>();
        if (StringUtils.hasText(conversation.getSystemPrompt())) {
            payload.add(new WenxinClient.Message("system", conversation.getSystemPrompt()));
        }
        if (StringUtils.hasText(conversation.getPreferenceSnapshot())) {
            payload.add(new WenxinClient.Message("system", "用户偏好：" + conversation.getPreferenceSnapshot()));
        }
        context.stream()
                .sorted(Comparator.comparing(AiMessage::getCreatedAt))
                .forEach(msg -> payload.add(new WenxinClient.Message(msg.getRole(), msg.getContent())));
        return payload;
    }

    private String truncateSummary(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        String trimmed = text.trim();
        return trimmed.length() > 50 ? trimmed.substring(0, 50) + "..." : trimmed;
    }
}
