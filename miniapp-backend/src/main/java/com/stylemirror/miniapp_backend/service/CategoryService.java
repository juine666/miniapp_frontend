package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.stylemirror.miniapp_backend.domain.Category;
import com.stylemirror.miniapp_backend.repository.CategoryMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

