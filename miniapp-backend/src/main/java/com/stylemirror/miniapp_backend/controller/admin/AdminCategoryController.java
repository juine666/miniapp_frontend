package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.Category;
import com.stylemirror.miniapp_backend.service.CategoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理员分类控制器
 * 负责分类的增删改查管理
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
     * 查询所有分类列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Category>>> list() {
        log.debug("查询所有分类列表");
        return ResponseEntity.ok(ApiResponse.success(categoryService.findAll()));
    }

    /**
     * 创建分类
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Category>> create(@Valid @RequestBody UpsertRequest req) {
        log.info("创建分类，名称: {}", req.name());
        categoryService.findByName(req.name()).ifPresent(c -> {
            throw new IllegalArgumentException("分类已存在");
        });
        Category category = new Category();
        category.setName(req.name());
        category.setDescription(req.description());
        return ResponseEntity.ok(ApiResponse.success(categoryService.save(category)));
    }

    /**
     * 更新分类
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Category>> update(@PathVariable Long id, @Valid @RequestBody UpsertRequest req) {
        log.info("更新分类，ID: {}, 名称: {}", id, req.name());
        Category category = categoryService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("分类不存在"));
        category.setName(req.name());
        category.setDescription(req.description());
        return ResponseEntity.ok(ApiResponse.success(categoryService.save(category)));
    }

    /**
     * 删除分类
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        log.info("删除分类，ID: {}", id);
        categoryService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success());
    }
}










