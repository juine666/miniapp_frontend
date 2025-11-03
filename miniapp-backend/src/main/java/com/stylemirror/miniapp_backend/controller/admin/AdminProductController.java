package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员商品控制器
 * 负责商品的管理操作
 */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@Slf4j
public class AdminProductController {
    private final ProductService productService;

    /**
     * 查询所有商品列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> list() {
        log.debug("查询所有商品列表");
        return ResponseEntity.ok(ApiResponse.success(productService.findAll()));
    }

    /**
     * 设置商品状态
     */
    @PutMapping("/{id}/status/{status}")
    public ResponseEntity<ApiResponse<Product>> setStatus(@PathVariable Long id, @PathVariable String status) {
        log.info("设置商品状态，ID: {}, 状态: {}", id, status);
        Product product = productService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("商品不存在"));
        product.setStatus(status);
        return ResponseEntity.ok(ApiResponse.success(productService.save(product)));
    }
}
