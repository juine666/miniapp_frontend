package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.domain.ShareLink;
import com.stylemirror.miniapp_backend.service.ProductService;
import com.stylemirror.miniapp_backend.service.ShareLinkService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Map;

/**
 * 分享控制器
 * 负责商品分享链接的创建和解析
 */
@RestController
@RequestMapping("/api/share")
@RequiredArgsConstructor
@Slf4j
public class ShareController {
    private final ShareLinkService shareLinkService;
    private final ProductService productService;

    /**
     * 创建商品分享链接
     */
    @PostMapping("/product/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> create(@PathVariable("id") Long id, Authentication auth) {
        log.info("创建商品分享链接，商品ID: {}", id);
        Product product = productService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        // Optional: ensure only seller can create share link
        
        ShareLink link = new ShareLink();
        link.setProductId(product.getId());
        link.setCode(randomCode(8));
        shareLinkService.save(link);
        
        return ResponseEntity.ok(ApiResponse.success(Map.of("code", link.getCode())));
    }

    /**
     * 根据分享码解析商品
     */
    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<Product>> resolve(@PathVariable String code) {
        log.debug("解析分享码: {}", code);
        ShareLink link = shareLinkService.findByCode(code)
                .orElseThrow(() -> new IllegalArgumentException("分享不存在"));
        
        Product product = productService.findById(link.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    /**
     * 生成随机分享码
     */
    private static String randomCode(int len) {
        byte[] bytes = new byte[len / 2 + 1];
        new SecureRandom().nextBytes(bytes);
        return HexFormat.of().formatHex(bytes).substring(0, len);
    }
}
