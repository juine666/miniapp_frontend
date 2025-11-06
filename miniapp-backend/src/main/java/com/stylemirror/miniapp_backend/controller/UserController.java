package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.ContactInfo;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.service.ContactInfoService;
import com.stylemirror.miniapp_backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 用户控制器
 * 负责用户相关的操作
 */
@RestController
@RequestMapping("/api/user")
@Validated
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final ContactInfoService contactInfoService;
    private final com.stylemirror.miniapp_backend.common.TestAuthHelper testAuthHelper;

    /**
     * 更新用户资料请求
     */
    public record UpdateProfileRequest(String nickname, String avatarUrl) {}
    
    /**
     * 更新联系方式请求
     */
    public record UpdateContactRequest(String phone, String wechatId, String email) {}

    /**
     * 获取当前用户信息
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> me(Authentication auth) {
        Long userId = testAuthHelper.getUserId(auth);
        log.debug("获取当前用户信息，用户ID: {}", userId);
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * 更新用户资料
     */
    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<User>> updateProfile(@Valid @RequestBody UpdateProfileRequest req, Authentication auth) {
        Long userId = testAuthHelper.getUserId(auth);
        log.info("更新用户资料，用户ID: {}", userId);
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        if (req.nickname() != null) {
            user.setNickname(req.nickname());
        }
        if (req.avatarUrl() != null) {
            user.setAvatarUrl(req.avatarUrl());
        }
        return ResponseEntity.ok(ApiResponse.success(userService.save(user)));
    }

    /**
     * 获取用户联系方式
     */
    @GetMapping("/contact")
    public ResponseEntity<ApiResponse<ContactInfo>> getContact(Authentication auth) {
        Long userId = testAuthHelper.getUserId(auth);
        log.debug("获取用户联系方式，用户ID: {}", userId);
        ContactInfo info = contactInfoService.findByUserId(userId).orElse(null);
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    /**
     * 获取指定用户的联系方式
     */
    @GetMapping("/{userId}/contact")
    public ResponseEntity<ApiResponse<ContactInfo>> getUserContact(@PathVariable("userId") Long userId) {
        log.debug("获取用户联系方式，用户ID: {}", userId);
        ContactInfo info = contactInfoService.findByUserId(userId).orElse(null);
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    /**
     * 根据用户ID获取用户信息
     */
    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable("userId") Long userId) {
        log.debug("获取用户信息，用户ID: {}", userId);
        User user = userService.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * 更新用户联系方式
     */
    @PostMapping("/contact")
    public ResponseEntity<ApiResponse<ContactInfo>> updateContact(@Valid @RequestBody UpdateContactRequest req, Authentication auth) {
        Long userId = testAuthHelper.getUserId(auth);
        log.info("更新用户联系方式，用户ID: {}", userId);
        ContactInfo info = contactInfoService.findByUserId(userId)
                .orElse(new ContactInfo());
        info.setUserId(userId);
        info.setPhone(req.phone());
        info.setWechatId(req.wechatId());
        info.setEmail(req.email());
        return ResponseEntity.ok(ApiResponse.success(contactInfoService.save(info)));
    }
}
