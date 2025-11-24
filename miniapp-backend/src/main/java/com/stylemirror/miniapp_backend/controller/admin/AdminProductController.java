package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.service.ProductService;
import com.stylemirror.miniapp_backend.util.OssUploadUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

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
    private final OssUploadUtil ossUploadUtil;
    
    @Value("${oss.publicBaseUrl:https://twoshop.oss-cn-shenzhen.aliyuncs.com}")
    private String ossPublicBaseUrl;

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
            @PathVariable("id") Long id, 
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
     * 创建/上传商品
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Product>> createProduct(
            @RequestParam("name") String name,
            @RequestParam("price") String price,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "categoryId", defaultValue = "1") Long categoryId,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        try {
            log.info("创建商品，名称: {}, 价格: {}, 分类ID: {}", name, price, categoryId);
            
            Product product = new Product();
            product.setName(name);
            product.setPrice(new java.math.BigDecimal(price));
            product.setDescription(description);
            product.setCategoryId(categoryId);
            product.setStatus("PENDING"); // 默认待审核
            
            // 处理图片上传（如果提供）
            if (image != null && !image.isEmpty()) {
                try {
                    String imageUrl = ossUploadUtil.uploadFile(image);
                    if (imageUrl != null) {
                        product.setCoverUrl("[\"" + imageUrl + "\"]");
                        log.info("商品图片已上传: {}", imageUrl);
                    }
                } catch (Exception uploadError) {
                    log.error("图片上传失败", uploadError);
                    throw new RuntimeException("图片上传失败: " + uploadError.getMessage());
                }
            }
            
            Product saved = productService.save(product);
            log.info("商品创建成功，ID: {}", saved.getId());
            return ResponseEntity.ok(ApiResponse.success(saved));
        } catch (Exception e) {
            log.error("创建商品失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "创建商品失败: " + e.getMessage()));
        }
    }
    
    /**
     * 编辑商品
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> updateProduct(
            @PathVariable("id") Long id,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "price", required = false) String price,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "image", required = false) MultipartFile image) {
        
        try {
            log.info("更新商品，ID: {}", id);
            
            Product product = productService.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("商品不存在，ID: " + id));
            
            if (name != null && !name.isEmpty()) {
                product.setName(name);
            }
            if (price != null && !price.isEmpty()) {
                product.setPrice(new java.math.BigDecimal(price));
            }
            if (description != null) {
                product.setDescription(description);
            }
            
            // 处理图片上传（如果提供）
            if (image != null && !image.isEmpty()) {
                try {
                    String imageUrl = ossUploadUtil.uploadFile(image);
                    if (imageUrl != null) {
                        product.setCoverUrl("[\"" + imageUrl + "\"]");
                        log.info("商品图片已更新: {}", imageUrl);
                    }
                } catch (Exception uploadError) {
                    log.error("图片上传失败", uploadError);
                    throw new RuntimeException("图片上传失败: " + uploadError.getMessage());
                }
            }
            
            Product updated = productService.save(product);
            log.info("商品更新成功，ID: {}", updated.getId());
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (Exception e) {
            log.error("更新商品失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "更新商品失败: " + e.getMessage()));
        }
    }
    
    private boolean isValidStatus(String status) {
        return "PUBLISHED".equals(status) 
                || "PENDING".equals(status) 
                || "REJECTED".equals(status) 
                || "OFFLINE".equals(status);
    }
}
