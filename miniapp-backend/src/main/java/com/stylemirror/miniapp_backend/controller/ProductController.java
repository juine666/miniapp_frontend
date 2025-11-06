package com.stylemirror.miniapp_backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.service.CategoryService;
import com.stylemirror.miniapp_backend.service.ModerationService;
import com.stylemirror.miniapp_backend.service.ProductService;
import com.stylemirror.miniapp_backend.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 商品控制器
 * 负责商品的查询和发布
 */
@RestController
@RequestMapping("/api/products")
@Validated
@RequiredArgsConstructor
@Slf4j
public class ProductController {
    private final ProductService productService;
    private final CategoryService categoryService;
    private final UserService userService;
    private final ModerationService moderationService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final com.stylemirror.miniapp_backend.common.TestAuthHelper testAuthHelper;

    /**
     * 发布商品请求
     */
    public record PublishRequest(
            String name,  // 标题改为可选
            String description,
            String coverUrl,
            List<String> imageUrls,  // 多张图片URL数组
            @NotNull BigDecimal price,
            @NotNull Long categoryId,  // 分类改为必填
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
                List<String> urls = objectMapper.readValue(coverUrl, new TypeReference<List<String>>() {});
                return urls != null && !urls.isEmpty() ? urls : List.of();
            }
            // 如果不是JSON格式，返回单张图片数组
            return List.of(coverUrl);
        } catch (Exception e) {
            log.warn("解析图片URL失败，使用原始值，coverUrl: {}", coverUrl, e);
            // 解析失败，返回单张图片数组
            return List.of(coverUrl);
        }
    }

    /**
     * 查询所有商品列表（分页）
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序字段：latest（最新）、price（价格）
     * @param sortOrder 排序方向：asc（升序）、desc（降序）
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Product>>> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", defaultValue = "latest") String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder) {
        log.debug("查询所有商品列表，页码: {}, 每页: {}, 排序: {} {}", page, size, sortBy, sortOrder);
        if (size > 50) size = 50; // 限制最大每页数量
        return ResponseEntity.ok(ApiResponse.success(productService.findAll(page, size, sortBy, sortOrder)));
    }

    /**
     * 根据关键词搜索商品（分页）
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<Product>>> search(
            @RequestParam("q") String keyword,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        log.debug("搜索商品，关键词: {}, 页码: {}, 每页: {}", keyword, page, size);
        if (size > 50) size = 50;
        return ResponseEntity.ok(ApiResponse.success(productService.search(keyword, page, size)));
    }

    /**
     * 根据分类查询商品（分页）
     * @param categoryId 分类ID
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序字段：latest（最新）、price（价格）
     * @param sortOrder 排序方向：asc（升序）、desc（降序）
     */
    @GetMapping("/by-category/{categoryId}")
    public ResponseEntity<ApiResponse<PageResponse<Product>>> byCategory(
            @PathVariable("categoryId") Long categoryId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sortBy", defaultValue = "latest") String sortBy,
            @RequestParam(value = "sortOrder", defaultValue = "desc") String sortOrder) {
        log.debug("根据分类查询商品，分类ID: {}, 页码: {}, 每页: {}, 排序: {} {}", categoryId, page, size, sortBy, sortOrder);
        if (size > 50) size = 50;
        return ResponseEntity.ok(ApiResponse.success(productService.findByCategoryId(categoryId, page, size, sortBy, sortOrder)));
    }

    /**
     * 查询商品详情（包含卖家信息和分类信息）
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> detail(@PathVariable("id") Long id) {
        log.debug("查询商品详情，ID: {}", id);
        Product product = productService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", product.getId());
        result.put("name", product.getName());
        result.put("description", product.getDescription());
        // 解析coverUrl为imageUrls数组
        try {
            List<String> imageUrls = decodeImageUrls(product.getCoverUrl());
            result.put("coverUrl", imageUrls.isEmpty() ? null : imageUrls.get(0));
            result.put("imageUrls", imageUrls);
        } catch (Exception e) {
            log.error("处理商品图片URL失败", e);
            // 如果解析失败，使用原始coverUrl
            result.put("coverUrl", product.getCoverUrl());
            result.put("imageUrls", product.getCoverUrl() != null ? List.of(product.getCoverUrl()) : List.of());
        }
        result.put("price", product.getPrice());
        result.put("stock", product.getStock());
        result.put("categoryId", product.getCategoryId());
        result.put("sellerId", product.getSellerId());
        result.put("latitude", product.getLatitude());
        result.put("longitude", product.getLongitude());
        result.put("status", product.getStatus());
        result.put("createdAt", product.getCreatedAt());
        
        // 加载卖家信息
        if (product.getSellerId() != null) {
            userService.findById(product.getSellerId()).ifPresent(seller -> {
                Map<String, Object> sellerInfo = new HashMap<>();
                sellerInfo.put("id", seller.getId());
                sellerInfo.put("nickname", seller.getNickname());
                sellerInfo.put("avatarUrl", seller.getAvatarUrl());
                result.put("seller", sellerInfo);
            });
        }
        
        // 加载分类信息
        if (product.getCategoryId() != null) {
            categoryService.findById(product.getCategoryId()).ifPresent(category -> {
                result.put("categoryName", category.getName());
            });
        }
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 附近商品结果（包含距离信息）
     */
    public record NearbyProductResult(
            Product product,
            Double distanceKm  // 距离（公里）
    ) {}

    /**
     * 使用Haversine公式计算两点间距离（公里）
     * @param lat1 第一个点的纬度
     * @param lng1 第一个点的经度
     * @param lat2 第二个点的纬度
     * @param lng2 第二个点的经度
     * @return 距离（公里）
     */
    private double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final int R = 6371; // 地球半径（公里）
        
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }

    /**
     * 查询附近商品（使用Haversine公式计算距离）
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> nearby(@RequestParam("lat") double lat,
                                                                        @RequestParam("lng") double lng,
                                                                        @RequestParam(value = "radiusKm", defaultValue = "3") double radiusKm) {
        log.debug("查询附近商品，纬度: {}, 经度: {}, 半径: {}km", lat, lng, radiusKm);
        
        List<Product> all = productService.findAll();
        
        // 使用Haversine公式计算距离，过滤并排序
        List<Map<String, Object>> result = all.stream()
                .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                .map(p -> {
                    double distance = calculateDistance(lat, lng, p.getLatitude(), p.getLongitude());
                    return Map.of(
                            "product", p,
                            "distanceKm", distance
                    );
                })
                .filter(entry -> (Double) entry.get("distanceKm") <= radiusKm)
                .sorted((a, b) -> Double.compare((Double) a.get("distanceKm"), (Double) b.get("distanceKm")))
                .map(entry -> {
                    Map<String, Object> item = new HashMap<>();
                    Product product = (Product) entry.get("product");
                    
                    // 解析图片URL
                    List<String> imageUrls = decodeImageUrls(product.getCoverUrl());
                    
                    item.put("id", product.getId());
                    item.put("name", product.getName());
                    item.put("description", product.getDescription());
                    item.put("coverUrl", imageUrls.isEmpty() ? null : imageUrls.get(0));
                    item.put("imageUrls", imageUrls);
                    item.put("price", product.getPrice());
                    item.put("stock", product.getStock());
                    item.put("categoryId", product.getCategoryId());
                    item.put("sellerId", product.getSellerId());
                    item.put("latitude", product.getLatitude());
                    item.put("longitude", product.getLongitude());
                    item.put("status", product.getStatus());
                    item.put("createdAt", product.getCreatedAt());
                    item.put("distanceKm", entry.get("distanceKm"));
                    
                    return item;
                })
                .toList();
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    /**
     * 发布商品
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Product>> publish(@Valid @RequestBody PublishRequest req, Authentication auth) {
        Long sellerId = testAuthHelper.getUserId(auth);
        
        log.info("发布商品，分类ID: {}, 卖家ID: {}", req.categoryId(), sellerId);
        
        // 验证分类是否存在
        categoryService.findById(req.categoryId())
            .orElseThrow(() -> new IllegalArgumentException("分类不存在"));
        
        // 如果有描述，进行内容审核
        if (req.description() != null && !req.description().trim().isEmpty()) {
            moderationService.assertCleanText(req.description());
        }
        
        Product product = new Product();
        // 如果没有提供名称，使用分类名称作为默认名称
        if (req.name() == null || req.name().trim().isEmpty()) {
            String categoryName = categoryService.findById(req.categoryId())
                .map(c -> c.getName())
                .orElse("商品");
            product.setName(categoryName);
        } else {
            moderationService.assertCleanText(req.name());
            product.setName(req.name());
        }
        
        product.setDescription(req.description());
        // 优先使用imageUrls，如果为空则使用coverUrl
        if (req.imageUrls() != null && !req.imageUrls().isEmpty()) {
            product.setCoverUrl(encodeImageUrls(req.imageUrls()));
        } else if (req.coverUrl() != null && !req.coverUrl().isEmpty()) {
            product.setCoverUrl(req.coverUrl());
        }
        product.setPrice(req.price());
        product.setCategoryId(req.categoryId());
        product.setSellerId(sellerId);
        product.setLatitude(req.latitude());
        product.setLongitude(req.longitude());
        return ResponseEntity.ok(ApiResponse.success(productService.save(product)));
    }
}
