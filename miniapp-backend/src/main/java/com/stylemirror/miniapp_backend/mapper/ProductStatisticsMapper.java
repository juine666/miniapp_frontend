package com.stylemirror.miniapp_backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.ProductStatistics;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import java.time.LocalDate;
import java.util.List;

/**
 * 产品统计 Mapper
 */
@Mapper
public interface ProductStatisticsMapper extends BaseMapper<ProductStatistics> {
    
    /**
     * 获取指定日期范围内的热销商品
     */
    @Select("""
        SELECT * FROM product_statistics 
        WHERE statistic_date >= #{startDate} AND statistic_date <= #{endDate}
        GROUP BY product_id
        ORDER BY SUM(sales_amount) DESC
        LIMIT #{limit}
        """)
    List<ProductStatistics> getTopProductsByDateRange(LocalDate startDate, LocalDate endDate, int limit);
}
