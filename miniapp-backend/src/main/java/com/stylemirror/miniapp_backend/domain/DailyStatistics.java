package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 日统计汇总实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("daily_statistics")
public class DailyStatistics {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("statistic_date")
    private LocalDate statisticDate;
    
    @TableField("total_views")
    private Integer totalViews; // 总浏览次数
    
    @TableField("total_sales_amount")
    private BigDecimal totalSalesAmount; // 总销售额
    
    @TableField("total_sales_count")
    private Integer totalSalesCount; // 总销售笔数
    
    @TableField("total_repurchase")
    private Integer totalRepurchase; // 总复购人数
    
    @TableField("active_products")
    private Integer activeProducts; // 活跃商品数
    
    @TableField("new_users")
    private Integer newUsers; // 新增用户
    
    @TableField("created_at")
    private LocalDateTime createdAt;
    
    @TableField("updated_at")
    private LocalDateTime updatedAt;
}
