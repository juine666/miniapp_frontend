package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 管理员用户控制器
 * 负责用户的管理操作，包括查询、封禁/解封等
 * 
 * @author StyleMirror Team
 */
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Slf4j
public class AdminUserController {
    private final UserService userService;

    /**
     * 分页查询用户列表
     * 
     * @param page 页码（从0开始，默认0）
     * @param size 每页大小（默认20，最大100）
     * @param keyword 搜索关键词（昵称、OpenID）
     * @param banned 封禁状态筛选（true=已封禁，false=正常，null=全部）
     * @return 分页用户列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<User>>> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "banned", required = false) Boolean banned) {
        
        // 限制每页最大数量
        if (size > 100) {
            size = 100;
        }
        
        log.debug("查询用户列表，页码: {}, 每页: {}, 关键词: {}, 封禁状态: {}", 
                page, size, keyword, banned);
        
        PageResponse<User> pageResponse = userService.findPage(page, size, keyword, banned);
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    /**
     * 封禁用户
     * 
     * @param id 用户ID
     * @return 更新后的用户信息
     */
    @PutMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<User>> ban(@PathVariable Long id) {
        log.info("封禁用户，ID: {}", id);
        User user = userService.updateBanStatus(id, true);
        log.info("用户封禁成功，ID: {}, OpenID: {}", user.getId(), user.getOpenid());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * 解封用户
     * 
     * @param id 用户ID
     * @return 更新后的用户信息
     */
    @PutMapping("/{id}/unban")
    public ResponseEntity<ApiResponse<User>> unban(@PathVariable Long id) {
        log.info("解封用户，ID: {}", id);
        User user = userService.updateBanStatus(id, false);
        log.info("用户解封成功，ID: {}, OpenID: {}", user.getId(), user.getOpenid());
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
