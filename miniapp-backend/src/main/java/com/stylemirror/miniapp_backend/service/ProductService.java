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
 * 负责商品的CRUD操作，集成Redis缓存
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {
    private final ProductMapper productMapper;
    private final CacheService cacheService;

    /**
     * 查询所有商品
     */
    public List<Product> findAll() {
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        // 只返回已发布的商品
        wrapper.eq("status", "PUBLISHED");
        wrapper.orderByDesc("created_at");
        return productMapper.selectList(wrapper);
    }

    /**
     * 分页查询商品列表（管理端使用）
     * 
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @param keyword 搜索关键词（商品名称、描述）
     * @param status 状态筛选（PUBLISHED、PENDING、REJECTED、OFFLINE）
     * @param categoryId 分类ID筛选
     * @return 分页响应
     */
    public PageResponse<Product> findPageForAdmin(int page, int size, String keyword, String status, Long categoryId) {
        Page<Product> pageObj = new Page<>(page, size);
        QueryWrapper<Product> wrapper = new QueryWrapper<>();
        
        // 关键词搜索：商品名称或描述
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like("name", keyword)
                    .or()
                    .like("description", keyword));
        }
        
        // 状态筛选
        if (StringUtils.hasText(status)) {
            wrapper.eq("status", status);
        }
        
        // 分类筛选
        if (categoryId != null) {
            wrapper.eq("category_id", categoryId);
        }
        
        // 按创建时间倒序
        wrapper.orderByDesc("created_at");
        
        Page<Product> result = productMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
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
        
        // 只查询已发布的商品
        wrapper.eq("status", "PUBLISHED");
        
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
     * 根据ID查询商品（带缓存）
     */
    public Optional<Product> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }

        // 先从缓存获取
        String cacheKey = cacheService.getProductKey(id);
        Product cachedProduct = cacheService.get(cacheKey, Product.class);
        if (cachedProduct != null) {
            log.debug("从缓存获取商品: ID={}", id);
            return Optional.of(cachedProduct);
        }

        // 缓存未命中，从数据库查询
        Product product = productMapper.selectById(id);
        if (product != null) {
            // 写入缓存
            cacheService.set(cacheKey, product);
            log.debug("从数据库获取商品并写入缓存: ID={}", id);
        }
        return Optional.ofNullable(product);
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
        // 只查询已发布的商品
        wrapper.eq("status", "PUBLISHED");
        
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
        // 只查询已发布的商品
        wrapper.eq("status", "PUBLISHED");
        wrapper.orderByDesc("created_at");
        Page<Product> pageObj = new Page<>(page, size);
        Page<Product> result = productMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 保存商品（新增或更新，同步更新缓存）
     */
    @Transactional(rollbackFor = Exception.class)
    public Product save(Product product) {
        boolean isNew = product.getId() == null;
        
        if (isNew) {
            productMapper.insert(product);
            log.info("新增商品，ID: {}, 名称: {}", product.getId(), product.getName());
        } else {
            productMapper.updateById(product);
            log.info("更新商品，ID: {}, 名称: {}", product.getId(), product.getName());
            
            // 删除旧缓存
            String cacheKey = cacheService.getProductKey(product.getId());
            cacheService.delete(cacheKey);
        }
        
        // 写入新缓存
        if (product.getId() != null) {
            String cacheKey = cacheService.getProductKey(product.getId());
            cacheService.set(cacheKey, product);
            log.debug("更新商品缓存: ID={}", product.getId());
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
     * 更新商品信息（仅限卖家本人，同步更新缓存）
     */
    @Transactional(rollbackFor = Exception.class)
    public Product updateProduct(Long productId, Long sellerId, Product updateData) {
        // 先从缓存获取，缓存未命中再从数据库查询
        Product product = findById(productId).orElse(null);
        if (product == null) {
            // 如果缓存也没有，从数据库查询
            product = productMapper.selectById(productId);
        }
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
        if (updateData.getLatitude() != null) {
            product.setLatitude(updateData.getLatitude());
        }
        if (updateData.getLongitude() != null) {
            product.setLongitude(updateData.getLongitude());
        }
        
        productMapper.updateById(product);
        log.info("更新商品，ID: {}, 卖家ID: {}", productId, sellerId);
        
        // 更新缓存
        String cacheKey = cacheService.getProductKey(productId);
        cacheService.set(cacheKey, product);
        log.debug("更新商品缓存: ID={}", productId);
        
        return product;
    }

    /**
     * 上下架商品（仅限卖家本人，同步更新缓存）
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateStatus(Long productId, Long sellerId, String status) {
        // 先从缓存获取，缓存未命中再从数据库查询
        Product product = findById(productId).orElse(null);
        if (product == null) {
            // 如果缓存也没有，从数据库查询
            product = productMapper.selectById(productId);
        }
        if (product == null) {
            throw new IllegalArgumentException("商品不存在");
        }
        if (!product.getSellerId().equals(sellerId)) {
            throw new IllegalArgumentException("无权修改该商品");
        }
        
        product.setStatus(status);
        productMapper.updateById(product);
        log.info("更新商品状态，ID: {}, 卖家ID: {}, 状态: {}", productId, sellerId, status);
        
        // 更新缓存
        String cacheKey = cacheService.getProductKey(productId);
        cacheService.set(cacheKey, product);
        log.debug("更新商品缓存: ID={}", productId);
    }

    /**
     * 删除商品缓存
     */
    public void evictProductCache(Long productId) {
        if (productId != null) {
            String cacheKey = cacheService.getProductKey(productId);
            cacheService.delete(cacheKey);
            log.debug("删除商品缓存: ID={}", productId);
        }
    }
}

