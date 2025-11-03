package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@TableName("products")
@Getter
@Setter
public class Product {
    @TableId(type = IdType.AUTO)
    private Long id;

    private String name;
    private String description;
    private String coverUrl;
    private BigDecimal price;
    private Integer stock = 0;

    private Long categoryId;
    private Long sellerId;

    private Double latitude;
    private Double longitude;
    private String status = "PUBLISHED"; // PENDING, PUBLISHED, REJECTED, OFFLINE
    private Instant createdAt = Instant.now();
}


