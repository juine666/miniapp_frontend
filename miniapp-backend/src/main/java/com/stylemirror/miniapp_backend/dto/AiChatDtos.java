package com.stylemirror.miniapp_backend.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public class AiChatDtos {

    public record StartConversationRequest(
            @NotBlank String title,
            String systemPrompt
    ) {}

    public record SendMessageRequest(
            @NotBlank String userMessage
    ) {}

    public record ConversationSummary(
            Long conversationId,
            String title,
            String summary,
            LocalDateTime lastMessageAt
    ) {}

    public record MessageResponse(
            Long messageId,
            String role,
            String content,
            LocalDateTime createdAt
    ) {}

    public record VoiceReply(
            String recognizedText,
            MessageResponse reply,
            String audioUrl
    ) {}
}
