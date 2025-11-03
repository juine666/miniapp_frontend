package com.stylemirror.miniapp_backend.controller;

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
 * 分类控制器
 * 负责分类的查询和创建
 */
@RestController
@RequestMapping("/api/categories")
@Validated
@RequiredArgsConstructor
@Slf4j
public class CategoryController {
    private final CategoryService categoryService;

    /**
     * 分类创建请求
     */
    public record CreateCategoryRequest(@NotBlank String name, String description) {}

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
    public ResponseEntity<ApiResponse<Category>> create(@Valid @RequestBody CreateCategoryRequest req) {
        log.info("创建分类，名称: {}", req.name());
        categoryService.findByName(req.name()).ifPresent(c -> {
            throw new IllegalArgumentException("分类已存在");
        });
        Category category = new Category();
        category.setName(req.name());
        category.setDescription(req.description());
        return ResponseEntity.ok(ApiResponse.success(categoryService.save(category)));
    }
}
