package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.service.TranslationService;
import com.stylemirror.miniapp_backend.service.TTSService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

    /**
     * 翻译评论（中文转英文）
     */
    @PostMapping("/comments/{commentId}/translate")
    public ApiResponse<?> translateComment(@PathVariable Long commentId, @RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error(400, "文本不能为空");
            }

            String translatedText = translationService.translateToEnglish(text);
            return ApiResponse.success(translatedText);
        } catch (Exception e) {
            log.error("翻译评论失败", e);
            return ApiResponse.error(500, "翻译失败: " + e.getMessage());
        }
    }

    /**
     * 合成语音（文字转语音）
     */
    @PostMapping("/tts/synthesize")
    public ApiResponse<?> synthesizeVoice(@RequestBody Map<String, String> request) {
        try {
            String text = request.get("text");
            String voice = request.getOrDefault("voice", "female");
            String language = request.getOrDefault("language", "zh-CN");

            if (text == null || text.trim().isEmpty()) {
                return ApiResponse.error(400, "文本不能为空");
            }

            String audioUrl = ttsService.synthesizeVoice(text, voice, language);
            
            if (audioUrl != null && !audioUrl.isEmpty()) {
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
