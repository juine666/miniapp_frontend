package com.stylemirror.miniapp_backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.ContactInfo;
import com.stylemirror.miniapp_backend.domain.Order;
import com.stylemirror.miniapp_backend.domain.OrderItem;
import com.stylemirror.miniapp_backend.domain.Product;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.repository.OrderItemMapper;
import com.stylemirror.miniapp_backend.repository.OrderMapper;
import com.stylemirror.miniapp_backend.repository.ProductMapper;
import com.stylemirror.miniapp_backend.repository.UserMapper;
import com.stylemirror.miniapp_backend.service.ContactInfoService;
import com.stylemirror.miniapp_backend.service.WeChatPayService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@Validated
public class OrderController {
    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final ProductMapper productMapper;
    private final UserMapper userMapper;
    private final ContactInfoService contactInfoService;
    private final WeChatPayService weChatPayService;
    private final com.stylemirror.miniapp_backend.common.TestAuthHelper testAuthHelper;

    public OrderController(OrderMapper orderMapper, OrderItemMapper orderItemMapper, ProductMapper productMapper, UserMapper userMapper, ContactInfoService contactInfoService, WeChatPayService weChatPayService, com.stylemirror.miniapp_backend.common.TestAuthHelper testAuthHelper) {
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.productMapper = productMapper;
        this.userMapper = userMapper;
        this.contactInfoService = contactInfoService;
        this.weChatPayService = weChatPayService;
        this.testAuthHelper = testAuthHelper;
    }

    public record CreateOrderRequest(@NotNull Long productId, @Min(1) int quantity) {}

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<OrderDTO>>> list(
            Authentication auth,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        Long userId = getUserId(auth);
        if (size > 50) size = 50;
        
        QueryWrapper<Order> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        wrapper.orderByDesc("created_at");
        
        Page<Order> pageObj = new Page<>(page, size);
        Page<Order> ordersPage = orderMapper.selectPage(pageObj, wrapper);
        
        List<OrderDTO> result = ordersPage.getRecords().stream().map(order -> {
            OrderDTO dto = new OrderDTO();
            dto.setId(order.getId());
            dto.setTotalAmount(order.getTotalAmount());
            dto.setStatus(order.getStatus());
            dto.setCreatedAt(order.getCreatedAt());
            
            // 获取订单中的商品
            QueryWrapper<OrderItem> itemWrapper = new QueryWrapper<>();
            itemWrapper.eq("order_id", order.getId());
            List<OrderItem> items = orderItemMapper.selectList(itemWrapper);
            if (!items.isEmpty()) {
                Product product = productMapper.selectById(items.get(0).getProductId());
                dto.setProduct(product);
                
                // 获取卖家的联系方式
                if (product != null && product.getSellerId() != null) {
                    contactInfoService.findByUserId(product.getSellerId()).ifPresent(contactInfo -> {
                        dto.setSellerContact(contactInfo);
                    });
                }
            }
            return dto;
        }).toList();
        
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(result, page, size, ordersPage.getTotal())));
    }
    
    public static class OrderDTO {
        private Long id;
        private BigDecimal totalAmount;
        private String status;
        private Instant createdAt;
        private Product product;
        private ContactInfo sellerContact;
        
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Instant getCreatedAt() { return createdAt; }
        public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
        public Product getProduct() { return product; }
        public void setProduct(Product product) { this.product = product; }
        public ContactInfo getSellerContact() { return sellerContact; }
        public void setSellerContact(ContactInfo sellerContact) { this.sellerContact = sellerContact; }
    }
    
    private Long getUserId(Authentication auth) {
        return testAuthHelper.getUserId(auth);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> create(@Valid @RequestBody CreateOrderRequest req, Authentication auth) {
        Long userId = getUserId(auth);
        User buyer = userMapper.selectById(userId);
        if (buyer == null) throw new IllegalArgumentException("用户不存在");
        Product product = productMapper.selectById(req.productId());
        if (product == null) throw new IllegalArgumentException("商品不存在");
        if (product.getSellerId() != null && product.getSellerId().equals(buyer.getId())) {
            throw new IllegalArgumentException("不能购买自己的商品");
        }
        Order order = new Order();
        order.setUserId(buyer.getId());
        order.setTotalAmount(product.getPrice().multiply(BigDecimal.valueOf(req.quantity())));
        order.setStatus("CREATED");
        orderMapper.insert(order);

        OrderItem item = new OrderItem();
        item.setOrderId(order.getId());
        item.setProductId(product.getId());
        item.setQuantity(req.quantity());
        item.setUnitPrice(product.getPrice());
        orderItemMapper.insert(item);

        return ResponseEntity.ok(ApiResponse.success(order));
    }

    @PostMapping("/{orderId}/pay")
    public ResponseEntity<ApiResponse<java.util.Map<String, String>>> pay(@PathVariable("orderId") Long orderId, Authentication auth) {
        Long userId = getUserId(auth);
        User buyer = userMapper.selectById(userId);
        if (buyer == null) throw new IllegalArgumentException("用户不存在");
        Order order = orderMapper.selectById(orderId);
        if (order == null) throw new IllegalArgumentException("订单不存在");
        if (!order.getUserId().equals(buyer.getId())) {
            throw new IllegalArgumentException("无权支付该订单");
        }
        if (!"CREATED".equals(order.getStatus())) {
            throw new IllegalArgumentException("订单状态不正确，无法支付");
        }
        java.util.Map<String, String> params = weChatPayService.createJsapiOrder(order.getId(), buyer.getOpenid());
        return ResponseEntity.ok(ApiResponse.success(params));
    }
    
    /**
     * 确认支付成功（用于测试或前端主动调用）
     * 在生产环境中，应该通过微信支付回调来更新订单状态
     */
    @PostMapping("/{orderId}/confirm-pay")
    public ResponseEntity<ApiResponse<Order>> confirmPay(@PathVariable("orderId") Long orderId, Authentication auth) {
        Long userId = getUserId(auth);
        User buyer = userMapper.selectById(userId);
        if (buyer == null) throw new IllegalArgumentException("用户不存在");
        Order order = orderMapper.selectById(orderId);
        if (order == null) throw new IllegalArgumentException("订单不存在");
        if (!order.getUserId().equals(buyer.getId())) {
            throw new IllegalArgumentException("无权操作该订单");
        }
        if (!"CREATED".equals(order.getStatus())) {
            throw new IllegalArgumentException("订单状态不正确");
        }
        
        // 更新订单状态为已支付
        order.setStatus("PAID");
        orderMapper.updateById(order);
        
        return ResponseEntity.ok(ApiResponse.success(order));
    }
}


