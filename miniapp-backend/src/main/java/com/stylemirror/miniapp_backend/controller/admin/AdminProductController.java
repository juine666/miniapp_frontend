package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 管理员商品控制器
 * 负责商品的管理操作，包括查询、审核、状态管理等
 * 
 * @author StyleMirror Team
 */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@Slf4j
public class AdminProductController {
    private final ProductService productService;

    /**
     * 分页查询商品列表
     * 
     * @param page 页码（从0开始，默认0）
     * @param size 每页大小（默认20，最大100）
     * @param keyword 搜索关键词（商品名称、描述）
     * @param status 状态筛选（PUBLISHED、PENDING、REJECTED、OFFLINE）
     * @param categoryId 分类ID筛选
     * @return 分页商品列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Product>>> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "categoryId", required = false) Long categoryId) {
        
        // 限制每页最大数量
        if (size > 100) {
            size = 100;
        }
        
        log.debug("查询商品列表，页码: {}, 每页: {}, 关键词: {}, 状态: {}, 分类ID: {}", 
                page, size, keyword, status, categoryId);
        
        PageResponse<Product> pageResponse = productService.findPageForAdmin(page, size, keyword, status, categoryId);
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    /**
     * 设置商品状态
     * 
     * @param id 商品ID
     * @param status 状态值（PUBLISHED、PENDING、REJECTED、OFFLINE）
     * @return 更新后的商品信息
     */
    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<ApiResponse<Product>> setStatus(
            @PathVariable Long id, 
            @PathVariable String status) {
        
        // 验证状态值
        if (!isValidStatus(status)) {
            log.warn("无效的商品状态: {}", status);
            throw new IllegalArgumentException("无效的商品状态: " + status + 
                    "，有效值：PUBLISHED、PENDING、REJECTED、OFFLINE");
        }
        
        log.info("设置商品状态，ID: {}, 状态: {}", id, status);
        Product product = productService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在，ID: " + id));
        
        // 更新商品状态
        productService.updateStatus(id, product.getSellerId(), status);
        
        // 重新查询更新后的商品（清除缓存后获取最新数据）
        Product updated = productService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在，ID: " + id));
        
        log.info("商品状态更新成功，ID: {}, 状态: {}", updated.getId(), updated.getStatus());
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * 验证状态值是否有效
     * 
     * @param status 状态值
     * @return 是否有效
     */
    private boolean isValidStatus(String status) {
        return "PUBLISHED".equals(status) 
                || "PENDING".equals(status) 
                || "REJECTED".equals(status) 
                || "OFFLINE".equals(status);
    }
}
