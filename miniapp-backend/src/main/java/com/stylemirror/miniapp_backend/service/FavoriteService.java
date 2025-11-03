package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Favorite;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.repository.FavoriteMapper;
import com.stylemirror.miniapp_backend.repository.ProductMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 收藏服务类
 * 负责用户收藏商品的增删查操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteService {
    private final FavoriteMapper favoriteMapper;
    private final ProductMapper productMapper;

    /**
     * 添加收藏
     */
    @Transactional(rollbackFor = Exception.class)
    public void addFavorite(Long userId, Long productId) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.eq("product_id", productId);
        Favorite exist = favoriteMapper.selectOne(wrapper);
        if (exist != null) {
            throw new IllegalArgumentException("已收藏该商品");
        }
        
        Favorite favorite = new Favorite();
        favorite.setUserId(userId);
        favorite.setProductId(productId);
        favoriteMapper.insert(favorite);
        log.info("添加收藏，用户ID: {}, 商品ID: {}", userId, productId);
    }

    /**
     * 取消收藏
     */
    @Transactional(rollbackFor = Exception.class)
    public void removeFavorite(Long userId, Long productId) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.eq("product_id", productId);
        favoriteMapper.delete(wrapper);
        log.info("取消收藏，用户ID: {}, 商品ID: {}", userId, productId);
    }

    /**
     * 检查是否已收藏
     */
    public boolean isFavorited(Long userId, Long productId) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.eq("product_id", productId);
        return favoriteMapper.selectCount(wrapper) > 0;
    }

    /**
     * 查询用户的收藏列表
     */
    public List<Product> getFavoriteProducts(Long userId) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.orderByDesc("created_at");
        List<Favorite> favorites = favoriteMapper.selectList(wrapper);
        
        return favorites.stream()
                .map(f -> productMapper.selectById(f.getProductId()))
                .filter(p -> p != null)
                .collect(Collectors.toList());
    }

    /**
     * 分页查询用户的收藏列表
     */
    public PageResponse<Product> getFavoriteProducts(Long userId, int page, int size) {
        QueryWrapper<Favorite> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.orderByDesc("created_at");
        
        Page<Favorite> pageObj = new Page<>(page, size);
        Page<Favorite> result = favoriteMapper.selectPage(pageObj, wrapper);
        
        List<Product> products = result.getRecords().stream()
                .map(f -> productMapper.selectById(f.getProductId()))
                .filter(p -> p != null)
                .collect(Collectors.toList());
        
        return PageResponse.of(products, (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }
}

