package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 产品统计实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("product_statistics")
public class ProductStatistics {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long productId;
    private String productName;
    private Long categoryId;
    private String categoryName;
    
    private Integer views; // 浏览次数
    private Integer repurchaseCount; // 复购人数
    private BigDecimal salesAmount; // 销售额
    private Integer salesCount; // 销售笔数
    
    private LocalDate statisticDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
