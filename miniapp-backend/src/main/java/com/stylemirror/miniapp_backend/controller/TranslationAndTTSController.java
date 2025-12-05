package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.TestAuthHelper;
import com.stylemirror.miniapp_backend.service.TranslationService;
import com.stylemirror.miniapp_backend.service.TTSService;
import com.stylemirror.miniapp_backend.service.UserDailyQuotaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 翻译和 TTS 控制器
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TranslationAndTTSController {

    private final TranslationService translationService;
    private final TTSService ttsService;
    private final UserDailyQuotaService userDailyQuotaService;
    private final TestAuthHelper testAuthHelper;
    private final RedisTemplate<String, String> redisTemplate;

    /**
     * 翻译评论（中文转英文）- 支持缓存
     */
    @PostMapping("/comments/{commentId}/translate")
    public ApiResponse<?> translateComment(@PathVariable Long commentId, @RequestBody Map<String, String> request, Authentication auth) {
        try {
            String text = request.get("text");
            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error(400, "文本不能为空");
            }

            // 先从缓存查询
            String cacheKey = "translation:comment:" + commentId;
            String cachedTranslation = redisTemplate.opsForValue().get(cacheKey);
            if (cachedTranslation != null) {
                return ApiResponse.success(cachedTranslation);
            }

            // 获取当前用户ID
            Long userId = testAuthHelper.getUserId(auth);
            
            // 检查配额
            int charsNeeded = text.length();
            int remaining = userDailyQuotaService.checkQuota(userId, charsNeeded);
            
            if (remaining < 0) {
                // 配额不足
                int used = userDailyQuotaService.getTodayQuota(userId).getUsedChars();
                int max = userDailyQuotaService.getTodayQuota(userId).getMaxChars();
                return ApiResponse.error(429, "今日配额已用尽 (" + used + "/" + max + "字)");
            }

            // 调用翻译服务
            String translatedText = translationService.translateToEnglish(text);
            
            // 扣除配额
            userDailyQuotaService.useQuota(userId, charsNeeded);
            
            // 缓存翻译结果 - 7天过期
            if (translatedText != null && !translatedText.isEmpty()) {
                redisTemplate.opsForValue().set(cacheKey, translatedText, 7, TimeUnit.DAYS);
            }
            
            return ApiResponse.success(translatedText);
        } catch (Exception e) {
            log.error("翻译评论失败", e);
            return ApiResponse.error(500, "翻译失败: " + e.getMessage());
        }
    }

    /**
     * 合成语音（文字转语音）- 支持缓存
     */
    @PostMapping("/comments/{commentId}/tts")
    public ApiResponse<?> synthesizeVoice(@PathVariable Long commentId, @RequestBody Map<String, String> request, Authentication auth) {
        try {
            String text = request.get("text");
            String voice = request.getOrDefault("voice", "female");
            String language = request.getOrDefault("language", "zh-CN");

            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error(400, "文本不能为空");
            }

            // 先从缓存查询
            String cacheKey = "tts:comment:" + commentId + ":" + voice;
            String cachedAudio = redisTemplate.opsForValue().get(cacheKey);
            if (cachedAudio != null) {
                return ApiResponse.success(cachedAudio);
            }

            // 获取当前用户ID
            Long userId = testAuthHelper.getUserId(auth);
            
            // 检查配额
            int charsNeeded = text.length();
            int remaining = userDailyQuotaService.checkQuota(userId, charsNeeded);
            
            if (remaining < 0) {
                // 配额不足
                int used = userDailyQuotaService.getTodayQuota(userId).getUsedChars();
                int max = userDailyQuotaService.getTodayQuota(userId).getMaxChars();
                return ApiResponse.error(429, "今日配额已用尽 (" + used + "/" + max + "字)");
            }

            // 调用TTS服务
            String audioUrl = ttsService.synthesizeVoice(text, voice, language);
            
            if (audioUrl != null && !audioUrl.isEmpty()) {
                // 扣除配额
                userDailyQuotaService.useQuota(userId, charsNeeded);
                
                // 缓存TTS结果 - 7天过期
                redisTemplate.opsForValue().set(cacheKey, audioUrl, 7, TimeUnit.DAYS);
                
                return ApiResponse.success(audioUrl);
            } else {
                return ApiResponse.error(500, "TTS 合成失败");
            }
        } catch (Exception e) {
            log.error("TTS 合成失败", e);
            return ApiResponse.error(500, "合成失败: " + e.getMessage());
        }
    }
}
