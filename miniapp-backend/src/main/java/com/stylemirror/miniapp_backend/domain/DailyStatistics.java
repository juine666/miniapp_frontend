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
 * 日统计汇总实体
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@TableName("daily_statistics")
public class DailyStatistics {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private LocalDate statisticDate;
    private Integer totalViews; // 总浏览次数
    private BigDecimal totalSalesAmount; // 总销售额
    private Integer totalSalesCount; // 总销售笔数
    private Integer totalRepurchase; // 总复购人数
    private Integer activeProducts; // 活跃商品数
    private Integer newUsers; // 新增用户
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
