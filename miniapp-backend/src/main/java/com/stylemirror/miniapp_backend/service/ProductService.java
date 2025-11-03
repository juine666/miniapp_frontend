package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.repository.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

/**
 * 商品服务类
 * 负责商品的CRUD操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ProductMapper productMapper;

    /**
     * 查询所有商品
     */
    public List<Product> findAll() {
        return productMapper.selectList(null);
    }

    /**
     * 分页查询所有商品
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序字段：latest（最新）、price（价格）
     * @param sortOrder 排序方向：asc（升序）、desc（降序）
     */
    public PageResponse<Product> findAll(int page, int size, String sortBy, String sortOrder) {
        Page<Product> pageObj = new Page<>(page, size);
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        
        // 设置排序 - 使用数据库字段名
        if ("price".equals(sortBy)) {
            if ("asc".equalsIgnoreCase(sortOrder)) {
                wrapper.orderByAsc("price");
            } else {
                wrapper.orderByDesc("price");
            }
        } else {
            // 默认按最新排序（created_at降序）
            wrapper.orderByDesc("created_at");
        }
        
        Page<Product> result = productMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 分页查询所有商品（默认排序）
     */
    public PageResponse<Product> findAll(int page, int size) {
        return findAll(page, size, "latest", "desc");
    }

    /**
     * 根据ID查询商品
     */
    public Optional<Product> findById(Long id) {
        return Optional.ofNullable(productMapper.selectById(id));
    }

    /**
     * 根据分类ID查询商品
     */
    public List<Product> findByCategoryId(Long categoryId) {
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        wrapper.eq("category_id", categoryId);
        return productMapper.selectList(wrapper);
    }

    /**
     * 分页查询分类商品
     * @param categoryId 分类ID
     * @param page 页码
     * @param size 每页数量
     * @param sortBy 排序字段：latest（最新）、price（价格）
     * @param sortOrder 排序方向：asc（升序）、desc（降序）
     */
    public PageResponse<Product> findByCategoryId(Long categoryId, int page, int size, String sortBy, String sortOrder) {
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        wrapper.eq("category_id", categoryId);
        
        // 设置排序 - 使用数据库字段名
        if ("price".equals(sortBy)) {
            if ("asc".equalsIgnoreCase(sortOrder)) {
                wrapper.orderByAsc("price");
            } else {
                wrapper.orderByDesc("price");
            }
        } else {
            // 默认按最新排序（created_at降序）
            wrapper.orderByDesc("created_at");
        }
        
        Page<Product> pageObj = new Page<>(page, size);
        Page<Product> result = productMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 分页查询分类商品（默认排序）
     */
    public PageResponse<Product> findByCategoryId(Long categoryId, int page, int size) {
        return findByCategoryId(categoryId, page, size, "latest", "desc");
    }

    /**
     * 根据名称模糊查询商品（忽略大小写）
     */
    public List<Product> findByNameContainingIgnoreCase(String keyword) {
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like("name", keyword);
        }
        return productMapper.selectList(wrapper);
    }

    /**
     * 分页搜索商品
     */
    public PageResponse<Product> search(String keyword, int page, int size) {
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like("name", keyword);
        }
        wrapper.orderByDesc("created_at");
        Page<Product> pageObj = new Page<>(page, size);
        Page<Product> result = productMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 保存商品（新增或更新）
     */
    @Transactional(rollbackFor = Exception.class)
    public Product save(Product product) {
        if (product.getId() == null) {
            productMapper.insert(product);
            log.info("新增商品，ID: {}, 名称: {}", product.getId(), product.getName());
        } else {
            productMapper.updateById(product);
            log.info("更新商品，ID: {}, 名称: {}", product.getId(), product.getName());
        }
        return product;
    }

    /**
     * 根据卖家ID查询商品列表
     */
    public List<Product> findBySellerId(Long sellerId) {
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        wrapper.eq("seller_id", sellerId);  // 使用数据库字段名
        wrapper.orderByDesc("created_at");  // 使用数据库字段名
        return productMapper.selectList(wrapper);
    }

    /**
     * 分页查询卖家商品
     */
    public PageResponse<Product> findBySellerId(Long sellerId, int page, int size) {
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        wrapper.eq("seller_id", sellerId);  // 使用数据库字段名
        wrapper.orderByDesc("created_at");  // 使用数据库字段名
        Page<Product> pageObj = new Page<>(page, size);
        Page<Product> result = productMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 更新商品信息（仅限卖家本人）
     */
    @Transactional(rollbackFor = Exception.class)
    public Product updateProduct(Long productId, Long sellerId, Product updateData) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new IllegalArgumentException("商品不存在");
        }
        if (!product.getSellerId().equals(sellerId)) {
            throw new IllegalArgumentException("无权修改该商品");
        }
        
        // 只更新允许修改的字段
        if (updateData.getCoverUrl() != null) {
            product.setCoverUrl(updateData.getCoverUrl());
        }
        if (updateData.getPrice() != null) {
            product.setPrice(updateData.getPrice());
        }
        if (updateData.getDescription() != null) {
            product.setDescription(updateData.getDescription());
        }
        if (updateData.getName() != null) {
            product.setName(updateData.getName());
        }
        if (updateData.getCategoryId() != null) {
            product.setCategoryId(updateData.getCategoryId());
        }
        
        productMapper.updateById(product);
        log.info("更新商品，ID: {}, 卖家ID: {}", productId, sellerId);
        return product;
    }

    /**
     * 上下架商品（仅限卖家本人）
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long productId, Long sellerId, String status) {
        Product product = productMapper.selectById(productId);
        if (product == null) {
            throw new IllegalArgumentException("商品不存在");
        }
        if (!product.getSellerId().equals(sellerId)) {
            throw new IllegalArgumentException("无权修改该商品");
        }
        
        product.setStatus(status);
        productMapper.updateById(product);
        log.info("更新商品状态，ID: {}, 卖家ID: {}, 状态: {}", productId, sellerId, status);
    }
}

