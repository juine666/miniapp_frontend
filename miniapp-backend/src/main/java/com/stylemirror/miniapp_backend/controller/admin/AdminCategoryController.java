package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Category;
import com.stylemirror.miniapp_backend.service.CategoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 管理员分类控制器
 * 负责分类的增删改查管理
 * 
 * @author StyleMirror Team
 */
@RestController
@RequestMapping("/api/admin/categories")
@Validated
@RequiredArgsConstructor
@Slf4j
public class AdminCategoryController {
    private final CategoryService categoryService;

    /**
     * 分类创建/更新请求
     */
    public record UpsertRequest(@NotBlank String name, String description) {}

    /**
     * 分页查询分类列表
     * 
     * @param page 页码（从0开始，默认0）
     * @param size 每页大小（默认20，最大100）
     * @param keyword 搜索关键词（名称、描述）
     * @return 分页分类列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<Category>>> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "keyword", required = false) String keyword) {
        
        // 限制每页最大数量
        if (size > 100) {
            size = 100;
        }
        
        log.debug("查询分类列表，页码: {}, 每页: {}, 关键词: {}", page, size, keyword);
        
        PageResponse<Category> pageResponse = categoryService.findPage(page, size, keyword);
        return ResponseEntity.ok(ApiResponse.success(pageResponse));
    }

    /**
     * 创建分类
     * 
     * @param req 分类创建请求
     * @return 创建的分类信息
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Category>> create(@Valid @RequestBody UpsertRequest req) {
        log.info("创建分类，名称: {}", req.name());
        
        // 检查分类名称是否已存在
        categoryService.findByName(req.name()).ifPresent(c -> {
            log.warn("分类名称已存在: {}", req.name());
            throw new IllegalArgumentException("分类名称已存在: " + req.name());
        });
        
        Category category = new Category();
        category.setName(req.name());
        category.setDescription(req.description());
        Category saved = categoryService.save(category);
        
        log.info("分类创建成功，ID: {}, 名称: {}", saved.getId(), saved.getName());
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    /**
     * 更新分类
     * 
     * @param id 分类ID
     * @param req 分类更新请求
     * @return 更新后的分类信息
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> update(
            @PathVariable("id") Long id, 
            @Valid @RequestBody UpsertRequest req) {
        
        log.info("更新分类，ID: {}, 名称: {}", id, req.name());
        
        Category category = categoryService.findById(id)
                .orElseThrow(() -> {
                    log.warn("分类不存在，ID: {}", id);
                    return new IllegalArgumentException("分类不存在，ID: " + id);
                });
        
        // 如果名称变更，检查新名称是否已存在
        if (!category.getName().equals(req.name())) {
            categoryService.findByName(req.name()).ifPresent(c -> {
                log.warn("分类名称已存在: {}", req.name());
                throw new IllegalArgumentException("分类名称已存在: " + req.name());
            });
        }
        
        category.setName(req.name());
        category.setDescription(req.description());
        Category updated = categoryService.save(category);
        
        log.info("分类更新成功，ID: {}, 名称: {}", updated.getId(), updated.getName());
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    /**
     * 删除分类
     * 
     * @param id 分类ID
     * @return 删除结果
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") Long id) {
        log.info("删除分类，ID: {}", id);
        
        // 检查分类是否存在
        categoryService.findById(id)
                .orElseThrow(() -> {
                    log.warn("分类不存在，无法删除，ID: {}", id);
                    return new IllegalArgumentException("分类不存在，ID: " + id);
                });
        
        categoryService.deleteById(id);
        log.info("分类删除成功，ID: {}", id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}










