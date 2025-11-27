package com.stylemirror.miniapp_backend.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.TestAuthHelper;
import com.stylemirror.miniapp_backend.domain.Voice;
import com.stylemirror.miniapp_backend.service.VoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 语音 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/voices")
@RequiredArgsConstructor
public class VoiceController {
    
    private final VoiceService voiceService;
    private final TestAuthHelper testAuthHelper;
    
    /**
     * 上传语音
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Voice>> uploadVoice(
            @RequestBody Voice voice,
            Authentication auth) {
        Long userId = testAuthHelper.getUserId(auth);
        
        Voice result = voiceService.uploadVoice(voice, userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 获取产品的语音列表（分页）
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<Voice>>> getProductVoices(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize) {
        
        Page<Voice> result = voiceService.getProductVoices(productId, pageNum, pageSize);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 删除语音
     */
    @DeleteMapping("/{voiceId}")
    public ResponseEntity<ApiResponse<Void>> deleteVoice(
            @PathVariable Long voiceId,
            Authentication auth) {
        
        Long userId = testAuthHelper.getUserId(auth);
        // TODO: 从认证信息中获取用户是否为管理员
        Boolean isAdmin = false;
        
        boolean success = voiceService.deleteVoice(voiceId, userId, isAdmin);
        if (!success) {
            return ResponseEntity.ok(ApiResponse.error(403, "删除失败，只有发布者本人可以删除"));
        }
        
        return ResponseEntity.ok(ApiResponse.success());
    }
}
