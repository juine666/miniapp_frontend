package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.OrderItem;
import org.apache.ibatis.annotations.Mapper;

/**
 * 订单项Mapper接口
 */
@Mapper
public interface OrderItemMapper extends BaseMapper<OrderItem> {}

