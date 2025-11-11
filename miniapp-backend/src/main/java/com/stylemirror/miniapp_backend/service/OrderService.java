package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.Order;
import com.stylemirror.miniapp_backend.repository.OrderMapper;
import org.springframework.stereotype.Service;

/**
 * 订单服务
 */
@Service
public class OrderService extends ServiceImpl<OrderMapper, Order> implements IService<Order> {

}
