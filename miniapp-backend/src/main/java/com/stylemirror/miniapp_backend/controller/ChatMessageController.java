package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.ChatMessage;
import com.stylemirror.miniapp_backend.service.ChatMessageService;
import com.stylemirror.miniapp_backend.service.TranslationService;
import com.stylemirror.miniapp_backend.service.TTSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@Slf4j
public class ChatMessageController {
    private final ChatMessageService chatMessageService;
    private final TranslationService translationService;
    private final TTSService ttsService;
    private final RedisTemplate<String, String> redisTemplate;
    
    /**
     * 发送消息
     */
    @PostMapping("/send")
    public ResponseEntity<ApiResponse<ChatMessage>> sendMessage(
            @RequestParam Long productId,
            @RequestParam String userId,
            @RequestParam String nickname,
            @RequestParam(required = false) String avatarUrl,
            @RequestParam String content,
            @RequestParam(required = false) Long replyToId,
            @RequestParam(required = false) String atUsernames) {
        try {
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error(400, "消息内容不能为空"));
            }
            
            ChatMessage message = chatMessageService.sendMessage(productId, userId, nickname, avatarUrl, content, replyToId, atUsernames);
            return ResponseEntity.ok(ApiResponse.success(message));
        } catch (Exception e) {
            log.error("发送消息失败", e);
            return ResponseEntity.ok(ApiResponse.error(500, "发送消息失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取消息列表（轮询）
     * since: 自某个时间戳之后的消息（毫秒）
     */
    @GetMapping("/messages/{productId}")
    public ResponseEntity<ApiResponse<List<ChatMessage>>> getMessages(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") long since) {
        try {
            List<ChatMessage> messages;
            if (since > 0) {
                messages = chatMessageService.getMessages(productId, since);
            } else {
                // 没有since参数，获取最新50条消息
                messages = chatMessageService.getLatestMessages(productId, 50);
            }
            
            return ResponseEntity.ok(ApiResponse.success(messages));
        } catch (Exception e) {
            log.error("获取消息失败", e);
            return ResponseEntity.ok(ApiResponse.error(500, "获取消息失败: " + e.getMessage()));
        }
    }
    
    /**
     * 翻译聊天消息
     */
    @PostMapping("/messages/{messageId}/translate")
    public ResponseEntity<ApiResponse<?>> translateMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            if (text == null || text.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error(400, "文本不能为空"));
            }
            
            // 检查去除首尾空白后是否为空
            if (text.trim().isEmpty()) {
                // 如果只有空白字符，返回原文
                return ResponseEntity.ok(ApiResponse.success(text));
            }
            
            // 先从缓存查询
            String cacheKey = "translation:chat:" + messageId;
            String cachedTranslation = redisTemplate.opsForValue().get(cacheKey);
            if (cachedTranslation != null) {
                return ResponseEntity.ok(ApiResponse.success(cachedTranslation));
            }
            
            // 调用翻译服务
            String translatedText = translationService.translateToEnglish(text);
            
            // 缓存翻译结果 - 7天过期
            if (translatedText != null && !translatedText.isEmpty()) {
                redisTemplate.opsForValue().set(cacheKey, translatedText, 7, TimeUnit.DAYS);
            }
            
            return ResponseEntity.ok(ApiResponse.success(translatedText));
        } catch (Exception e) {
            log.error("翻译消息失败", e);
            return ResponseEntity.ok(ApiResponse.error(500, "翻译失败: " + e.getMessage()));
        }
    }
    
    /**
     * 聊天消息TTS合成
     */
    @PostMapping("/messages/{messageId}/tts")
    public ResponseEntity<ApiResponse<?>> synthesizeVoice(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            String voice = request.getOrDefault("voice", "female");
            String language = request.getOrDefault("language", "zh-CN");
            
            if (text == null || text.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error(400, "文本不能为空"));
            }
            
            // 检查去除首尾空白后是否为空
            if (text.trim().isEmpty()) {
                // 如果只有空白字符，返回错误
                return ResponseEntity.ok(ApiResponse.error(400, "文本不能为空"));
            }
            
            // 先从缓存查询 - 使用文本hash确保不同内容有不同缓存
            String textHash = String.valueOf(text.hashCode());
            String cacheKey = "tts:chat:" + messageId + ":" + voice + ":" + textHash;
            String cachedAudio = redisTemplate.opsForValue().get(cacheKey);
            if (cachedAudio != null) {
                return ResponseEntity.ok(ApiResponse.success(cachedAudio));
            }
            
            // 调用TTS服务
            String audioUrl = ttsService.synthesizeVoice(text, voice, language);
            
            if (audioUrl != null && !audioUrl.isEmpty()) {
                // 缓存TTS结果 - 7天过期
                redisTemplate.opsForValue().set(cacheKey, audioUrl, 7, TimeUnit.DAYS);
                return ResponseEntity.ok(ApiResponse.success(audioUrl));
            } else {
                return ResponseEntity.ok(ApiResponse.error(500, "TTS 合成失败"));
            }
        } catch (Exception e) {
            log.error("TTS 合成失败", e);
            return ResponseEntity.ok(ApiResponse.error(500, "合成失败: " + e.getMessage()));
        }
    }
}
