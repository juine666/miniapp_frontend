package com.stylemirror.miniapp_backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.Order;
import com.stylemirror.miniapp_backend.domain.OrderItem;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.repository.OrderItemMapper;
import com.stylemirror.miniapp_backend.repository.OrderMapper;
import com.stylemirror.miniapp_backend.repository.ProductMapper;
import com.stylemirror.miniapp_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 我的订单控制器
 * 负责用户订单相关的查询
 */
@RestController
@RequestMapping("/api/my/orders")
@RequiredArgsConstructor
@Slf4j
public class MyOrderController {
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final ProductMapper productMapper;
    private final UserService userService;

    /**
     * 获取我买到的商品列表（分页）
     */
    @GetMapping("/bought")
    public ResponseEntity<ApiResponse<PageResponse<Product>>> getBoughtProducts(
            Authentication auth,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Long userId = getUserId(auth);
        log.debug("查询我买到的商品，用户ID: {}, 页码: {}, 每页: {}", userId, page, size);
        if (size > 50) size = 50;
        
        // 查询我的订单（分页）
        QueryWrapper<Order> orderWrapper = new QueryWrapper<>();
        orderWrapper.eq("user_id", userId);
        orderWrapper.orderByDesc("created_at");
        Page<Order> orderPage = new Page<>(page, size);
        Page<Order> ordersResult = orderMapper.selectPage(orderPage, orderWrapper);
        
        if (ordersResult.getRecords().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(PageResponse.of(List.of(), page, size, 0)));
        }
        
        // 获取订单中的商品ID列表
        List<Long> orderIds = ordersResult.getRecords().stream().map(Order::getId).collect(Collectors.toList());
        
        QueryWrapper<OrderItem> itemWrapper = new QueryWrapper<>();
        itemWrapper.in("order_id", orderIds);
        List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
        
        // 获取商品详情
        List<Long> productIds = items.stream().map(OrderItem::getProductId).distinct().collect(Collectors.toList());
        if (productIds.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(PageResponse.of(List.of(), page, size, 0)));
        }
        
        QueryWrapper<Product> productWrapper = new QueryWrapper<>();
        productWrapper.in("id", productIds);
        List<Product> products = productMapper.selectList(productWrapper);
        
        // 注意：这里的分页总数是基于订单数，不是商品数（因为一个订单可能有多个商品）
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(products, page, size, ordersResult.getTotal())));
    }

    /**
     * 获取我卖出的商品列表（已有人下单的商品，分页）
     */
    @GetMapping("/sold")
    public ResponseEntity<ApiResponse<PageResponse<Product>>> getSoldProducts(
            Authentication auth,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Long userId = getUserId(auth);
        log.debug("查询我卖出的商品，用户ID: {}, 页码: {}, 每页: {}", userId, page, size);
        if (size > 50) size = 50;
        
        // 查询我发布的商品中已被下单的
        QueryWrapper<Product> productWrapper = new QueryWrapper<>();
        productWrapper.eq("seller_id", userId);
        List<Product> myProducts = productMapper.selectList(productWrapper);
        
        if (myProducts.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(PageResponse.of(List.of(), page, size, 0)));
        }
        
        // 查询哪些商品已被下单
        List<Long> productIds = myProducts.stream().map(Product::getId).collect(Collectors.toList());
        QueryWrapper<OrderItem> itemWrapper = new QueryWrapper<>();
        itemWrapper.in("product_id", productIds);
        List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
        
        // 获取已被下单的商品ID
        List<Long> soldProductIds = items.stream()
                .map(OrderItem::getProductId)
                .distinct()
                .collect(Collectors.toList());
        
        if (soldProductIds.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(PageResponse.of(List.of(), page, size, 0)));
        }
        
        // 分页返回已卖出的商品
        QueryWrapper<Product> soldWrapper = new QueryWrapper<>();
        soldWrapper.in("id", soldProductIds);
        soldWrapper.orderByDesc("created_at");
        Page<Product> pageObj = new Page<>(page, size);
        Page<Product> result = productMapper.selectPage(pageObj, soldWrapper);
        
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal())));
    }

    /**
     * 获取当前用户ID（真机测试必须登录）
     */
    private Long getUserId(Authentication auth) {
        if (auth == null) {
            throw new IllegalArgumentException("请先登录");
        }
        return userService.findByOpenid(auth.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }
}

