package com.stylemirror.miniapp_backend.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.TestAuthHelper;
import com.stylemirror.miniapp_backend.domain.BannedWord;
import com.stylemirror.miniapp_backend.service.BannedWordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 违禁词管理 Controller（后台接口）
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/banned-words")
@RequiredArgsConstructor
public class BannedWordController {
    
    private final BannedWordService bannedWordService;
    private final TestAuthHelper testAuthHelper;
    
    /**
     * 获取违禁词列表
     */
    @GetMapping
    public ApiResponse<?> getBannedWords(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean isActive,
            Authentication auth) {
        
        Page<BannedWord> result = bannedWordService.getAllBannedWords(pageNum, pageSize, category, isActive);
        return ApiResponse.success(result);
    }
    
    /**
     * 添加违禁词
     */
    @PostMapping
    public ApiResponse<?> addBannedWord(
            @RequestBody BannedWord bannedWord,
            Authentication auth) {
        
        Long adminId = testAuthHelper.getUserId(auth);
        
        if (bannedWord.getWord() == null || bannedWord.getWord().trim().isEmpty()) {
            return ApiResponse.error(400, "违禁词不能为空");
        }
        
        BannedWord result = bannedWordService.addBannedWord(bannedWord, adminId);
        if (result == null) {
            return ApiResponse.error(400, "违禁词已存在");
        }
        
        return ApiResponse.success(result);
    }
    
    /**
     * 修改违禁词
     */
    @PutMapping("/{id}")
    public ApiResponse<?> updateBannedWord(
            @PathVariable Long id,
            @RequestBody BannedWord bannedWord,
            Authentication auth) {
        
        Long adminId = testAuthHelper.getUserId(auth);
        bannedWord.setId(id);
        
        boolean success = bannedWordService.updateBannedWord(bannedWord, adminId);
        if (!success) {
            return ApiResponse.error(404, "违禁词不存在");
        }
        
        return ApiResponse.success();
    }
    
    /**
     * 删除违禁词
     */
    @DeleteMapping("/{id}")
    public ApiResponse<?> deleteBannedWord(
            @PathVariable Long id,
            Authentication auth) {
        
        Long adminId = testAuthHelper.getUserId(auth);
        
        boolean success = bannedWordService.deleteBannedWord(id, adminId);
        if (!success) {
            return ApiResponse.error(404, "违禁词不存在");
        }
        
        return ApiResponse.success();
    }
    
    /**
     * 启用/禁用违禁词
     */
    @PostMapping("/{id}/toggle")
    public ApiResponse<?> toggleBannedWordStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Boolean> body,
            Authentication auth) {
        
        Long adminId = testAuthHelper.getUserId(auth);
        Boolean isActive = body.get("isActive");
        
        if (isActive == null) {
            return ApiResponse.error(400, "isActive参数不能为空");
        }
        
        boolean success = bannedWordService.toggleBannedWordStatus(id, isActive, adminId);
        if (!success) {
            return ApiResponse.error(404, "违禁词不存在");
        }
        
        return ApiResponse.success();
    }
}
