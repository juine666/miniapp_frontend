package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.service.FavoriteService;
import com.stylemirror.miniapp_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 收藏控制器
 * 负责收藏相关的API接口
 */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
@Slf4j
public class FavoriteController {
    private final FavoriteService favoriteService;
    private final UserService userService;
    private final com.stylemirror.miniapp_backend.common.TestAuthHelper testAuthHelper;

    /**
     * 收藏商品
     */
    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> addFavorite(
            @PathVariable("productId") Long productId,
            Authentication auth) {
        Long userId = getUserId(auth);
        log.info("添加收藏，用户ID: {}, 商品ID: {}", userId, productId);
        favoriteService.addFavorite(userId, productId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 取消收藏
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(
            @PathVariable("productId") Long productId,
            Authentication auth) {
        Long userId = getUserId(auth);
        log.info("取消收藏，用户ID: {}, 商品ID: {}", userId, productId);
        favoriteService.removeFavorite(userId, productId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 检查是否已收藏
     */
    @GetMapping("/{productId}/check")
    public ResponseEntity<ApiResponse<Boolean>> checkFavorite(
            @PathVariable("productId") Long productId,
            Authentication auth) {
        Long userId = getUserId(auth);
        boolean favorited = favoriteService.isFavorited(userId, productId);
        return ResponseEntity.ok(ApiResponse.success(favorited));
    }

    /**
     * 获取我的收藏列表（分页）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Product>>> getMyFavorites(
            Authentication auth,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Long userId = getUserId(auth);
        log.debug("查询收藏列表，用户ID: {}, 页码: {}, 每页: {}", userId, page, size);
        if (size > 50) size = 50;
        return ResponseEntity.ok(ApiResponse.success(favoriteService.getFavoriteProducts(userId, page, size)));
    }

    /**
     * 获取当前用户ID（测试模式下支持无认证访问）
     */
    private Long getUserId(Authentication auth) {
        return testAuthHelper.getUserId(auth);
    }
}

