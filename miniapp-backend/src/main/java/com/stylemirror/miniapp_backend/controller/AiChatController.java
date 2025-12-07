package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.TestAuthHelper;
import com.stylemirror.miniapp_backend.domain.AiConversation;
import com.stylemirror.miniapp_backend.domain.AiMessage;
import com.stylemirror.miniapp_backend.dto.AiChatDtos;
import com.stylemirror.miniapp_backend.service.AiChatService;
import com.stylemirror.miniapp_backend.service.SpeechRecognitionService;
import com.stylemirror.miniapp_backend.service.TTSService;
import com.stylemirror.miniapp_backend.util.AudioFormatResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai/chat")
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final AiChatService aiChatService;
    private final TestAuthHelper testAuthHelper;
    private final SpeechRecognitionService speechRecognitionService;
    private final TTSService ttsService;

    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<AiChatDtos.ConversationSummary>> startConversation(
            @Valid @RequestBody AiChatDtos.StartConversationRequest request,
            Authentication authentication) {
        Long userId = testAuthHelper.getUserId(authentication);
        AiConversation conversation = aiChatService.startConversation(userId, request.title(), request.systemPrompt());
        return ResponseEntity.ok(ApiResponse.success(toSummary(conversation)));
    }

    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<AiChatDtos.ConversationSummary>>> listConversations(Authentication authentication) {
        Long userId = testAuthHelper.getUserId(authentication);
        List<AiChatDtos.ConversationSummary> summaries = aiChatService.listConversations(userId).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<AiChatDtos.MessageResponse>>> listMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {
        Long userId = testAuthHelper.getUserId(authentication);
        List<AiChatDtos.MessageResponse> messages = aiChatService.listMessages(userId, conversationId, limit).stream()
                .map(this::toMessage)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<ApiResponse<AiChatDtos.MessageResponse>> sendMessage(
            @PathVariable Long conversationId,
            @Valid @RequestBody AiChatDtos.SendMessageRequest request,
            Authentication authentication) {
        Long userId = testAuthHelper.getUserId(authentication);
        AiMessage reply = aiChatService.sendUserMessage(userId, conversationId, request.userMessage());
        return ResponseEntity.ok(ApiResponse.success(toMessage(reply)));
    }

    @PostMapping(value = "/conversations/{conversationId}/voice-message", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AiChatDtos.VoiceReply>> sendVoiceMessage(
            @PathVariable Long conversationId,
            @RequestPart("audio") MultipartFile audio,
            @RequestParam(defaultValue = "zh-CN") String language,
            @RequestParam(defaultValue = "female") String voice,
            Authentication authentication) {
        Long userId = testAuthHelper.getUserId(authentication);
        if (audio == null || audio.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error(400, "音频不能为空"));
        }
        try {
            byte[] audioBytes = audio.getBytes();
            String format = AudioFormatResolver.resolve(audio.getOriginalFilename(), audio.getContentType());
            String recognized = speechRecognitionService.transcribe(audioBytes, format, language);
            if (recognized == null || recognized.isBlank()) {
                return ResponseEntity.ok(ApiResponse.error(500, "语音识别失败"));
            }
            AiMessage reply = aiChatService.sendUserMessage(userId, conversationId, recognized.trim());
            String replyAudio = ttsService.synthesizeVoice(reply.getContent(), voice, mapLanguageForTts(language));
            AiChatDtos.VoiceReply payload = new AiChatDtos.VoiceReply(recognized.trim(), toMessage(reply), replyAudio);
            return ResponseEntity.ok(ApiResponse.success(payload));
        } catch (Exception e) {
            log.error("处理语音消息失败", e);
            return ResponseEntity.ok(ApiResponse.error(500, "语音消息处理失败: " + e.getMessage()));
        }
    }

    private String mapLanguageForTts(String language) {
        if (language == null || language.isBlank()) {
            return "zh-CN";
        }
        String normalized = language.toLowerCase();
        if (normalized.contains("en")) {
            return "en-US";
        }
        return "zh-CN";
    }

    private AiChatDtos.ConversationSummary toSummary(AiConversation conversation) {
        return new AiChatDtos.ConversationSummary(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getSummary(),
                conversation.getLastMessageAt());
    }

    private AiChatDtos.MessageResponse toMessage(AiMessage message) {
        return new AiChatDtos.MessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                message.getCreatedAt());
    }
}
