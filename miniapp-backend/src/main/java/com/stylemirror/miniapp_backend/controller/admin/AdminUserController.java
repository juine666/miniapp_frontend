package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员用户控制器
 * 负责用户的管理操作
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Slf4j
public class AdminUserController {
    private final UserService userService;

    /**
     * 查询所有用户列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> list() {
        log.debug("查询所有用户列表");
        return ResponseEntity.ok(ApiResponse.success(userService.findAll()));
    }

    /**
     * 封禁用户
     */
    @PutMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<User>> ban(@PathVariable Long id) {
        log.info("封禁用户，ID: {}", id);
        User user = userService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        user.setBanned(true);
        return ResponseEntity.ok(ApiResponse.success(userService.save(user)));
    }

    /**
     * 解封用户
     */
    @PutMapping("/{id}/unban")
    public ResponseEntity<ApiResponse<User>> unban(@PathVariable Long id) {
        log.info("解封用户，ID: {}", id);
        User user = userService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
        user.setBanned(false);
        return ResponseEntity.ok(ApiResponse.success(userService.save(user)));
    }
}
