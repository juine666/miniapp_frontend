package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Category;
import com.stylemirror.miniapp_backend.repository.CategoryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

/**
 * 分类服务类
 * 负责分类的CRUD操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CategoryService {
    private final CategoryMapper categoryMapper;

    /**
     * 查询所有分类
     */
    public List<Category> findAll() {
        return categoryMapper.selectList(null);
    }

    /**
     * 分页查询分类列表（管理端使用）
     * 
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @param keyword 搜索关键词（名称、描述）
     * @return 分页响应
     */
    public PageResponse<Category> findPage(int page, int size, String keyword) {
        Page<Category> pageObj = new Page<>(page, size);
        QueryWrapper<Category> wrapper = new QueryWrapper<>();
        
        // 关键词搜索：名称或描述
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like("name", keyword)
                    .or()
                    .like("description", keyword));
        }
        
        // 按创建时间倒序
        wrapper.orderByDesc("created_at");
        
        Page<Category> result = categoryMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 根据ID查询分类
     */
    public Optional<Category> findById(Long id) {
        return Optional.ofNullable(categoryMapper.selectById(id));
    }

    /**
     * 根据名称查询分类
     */
    public Optional<Category> findByName(String name) {
        QueryWrapper<Category> wrapper = new QueryWrapper<>();
        wrapper.eq("name", name);
        return Optional.ofNullable(categoryMapper.selectOne(wrapper));
    }

    /**
     * 保存分类（新增或更新）
     */
    @Transactional(rollbackFor = Exception.class)
    public Category save(Category category) {
        if (category.getId() == null) {
            categoryMapper.insert(category);
            log.info("新增分类，ID: {}, 名称: {}", category.getId(), category.getName());
        } else {
            categoryMapper.updateById(category);
            log.info("更新分类，ID: {}, 名称: {}", category.getId(), category.getName());
        }
        return category;
    }

    /**
     * 根据ID删除分类
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteById(Long id) {
        categoryMapper.deleteById(id);
        log.info("删除分类，ID: {}", id);
    }
}

