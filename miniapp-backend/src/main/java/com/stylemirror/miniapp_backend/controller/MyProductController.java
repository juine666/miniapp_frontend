package com.stylemirror.miniapp_backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.service.ProductService;
import com.stylemirror.miniapp_backend.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * 我的商品管理控制器
 * 负责用户对自己发布商品的查询、修改、上下架操作
 */
@RestController
@RequestMapping("/api/my/products")
@RequiredArgsConstructor
@Slf4j
public class MyProductController {
    private final ProductService productService;
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 更新商品请求
     */
    public record UpdateProductRequest(
            String name,
            String description,
            String coverUrl,
            List<String> imageUrls,  // 多张图片URL数组
            BigDecimal price,
            Long categoryId,
            Double latitude,
            Double longitude
    ) {}

    /**
     * 将图片URL数组转换为JSON字符串存储
     */
    private String encodeImageUrls(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(imageUrls);
        } catch (Exception e) {
            log.error("序列化图片URL数组失败", e);
            // 如果序列化失败，返回第一张图片
            return imageUrls.get(0);
        }
    }

    /**
     * 将coverUrl JSON字符串解析为图片URL数组
     */
    private List<String> decodeImageUrls(String coverUrl) {
        if (coverUrl == null || coverUrl.isEmpty()) {
            return List.of();
        }
        try {
            // 尝试解析为JSON数组
            if (coverUrl.startsWith("[")) {
                return objectMapper.readValue(coverUrl, new TypeReference<List<String>>() {});
            }
            // 如果不是JSON格式，返回单张图片数组
            return List.of(coverUrl);
        } catch (Exception e) {
            // 解析失败，返回单张图片数组
            return List.of(coverUrl);
        }
    }

    /**
     * 查询我发布的商品列表（分页）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Product>>> list(
            Authentication auth,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Long sellerId = getUserId(auth);
        log.debug("查询我的商品列表，卖家ID: {}, 页码: {}, 每页: {}", sellerId, page, size);
        if (size > 50) size = 50;
        
        PageResponse<Product> pageResponse = productService.findBySellerId(sellerId, page, size);
        
        // 处理每个商品的coverUrl：如果是JSON格式，解析为第一张图片
        List<Product> products = pageResponse.getContent();
        for (Product product : products) {
            if (product.getCoverUrl() != null) {
                List<String> imageUrls = decodeImageUrls(product.getCoverUrl());
                // 设置coverUrl为第一张图片，用于列表显示
                product.setCoverUrl(imageUrls.isEmpty() ? null : imageUrls.get(0));
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    /**
     * 更新商品信息（图片、价格、描述、标题）
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest req,
            Authentication auth) {
        Long sellerId = getUserId(auth);
        log.info("更新商品，ID: {}, 卖家ID: {}", id, sellerId);
        
        Product updateData = new Product();
        if (req.name() != null) {
            updateData.setName(req.name());
        }
        if (req.description() != null) {
            updateData.setDescription(req.description());
        }
        // 优先使用imageUrls，如果为空则使用coverUrl
        if (req.imageUrls() != null && !req.imageUrls().isEmpty()) {
            updateData.setCoverUrl(encodeImageUrls(req.imageUrls()));
        } else if (req.coverUrl() != null && !req.coverUrl().isEmpty()) {
            updateData.setCoverUrl(req.coverUrl());
        }
        if (req.price() != null) {
            updateData.setPrice(req.price());
        }
        if (req.categoryId() != null) {
            updateData.setCategoryId(req.categoryId());
        }
        if (req.latitude() != null) {
            updateData.setLatitude(req.latitude());
        }
        if (req.longitude() != null) {
            updateData.setLongitude(req.longitude());
        }
        
        Product updated = productService.updateProduct(id, sellerId, updateData);
        
        // 返回商品时，将coverUrl解析为imageUrls
        List<String> imageUrls = decodeImageUrls(updated.getCoverUrl());
        updated.setCoverUrl(imageUrls.isEmpty() ? null : imageUrls.get(0));
        
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * 上下架商品
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestParam @NotNull String value,
            Authentication auth) {
        Long sellerId = getUserId(auth);
        log.info("更新商品状态，ID: {}, 卖家ID: {}, 状态: {}", id, sellerId, value);
        
        if (!"ON".equals(value) && !"OFF".equals(value) && !"PUBLISHED".equals(value) && !"OFFLINE".equals(value)) {
            throw new IllegalArgumentException("状态值无效，应为 ON/OFF 或 PUBLISHED/OFFLINE");
        }
        
        String status = "ON".equals(value) || "PUBLISHED".equals(value) ? "PUBLISHED" : "OFFLINE";
        productService.updateStatus(id, sellerId, status);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 获取当前用户ID（真机测试必须登录）
     */
    private Long getUserId(Authentication auth) {
        if (auth == null) {
            throw new IllegalArgumentException("请先登录");
        }
        return userService.findByOpenid(auth.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }
}

