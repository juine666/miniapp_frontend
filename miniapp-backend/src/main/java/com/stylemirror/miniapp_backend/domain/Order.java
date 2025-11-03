package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@TableName("orders")
@Getter
@Setter
public class Order {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private BigDecimal totalAmount;
    private String status = "CREATED"; // CREATED, PAID, CANCELED, REFUNDED
    private String outTradeNo;
    private String prepayId;
    private Instant createdAt = Instant.now();
}


