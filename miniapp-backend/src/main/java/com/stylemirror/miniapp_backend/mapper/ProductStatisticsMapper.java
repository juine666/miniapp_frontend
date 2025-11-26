package com.stylemirror.miniapp_backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.ProductStatistics;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
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
        SELECT p.product_id, p.product_name, p.category_id, p.category_name,
               SUM(p.views) as views, SUM(p.repurchase_count) as repurchase_count,
               SUM(p.sales_amount) as sales_amount, SUM(p.sales_count) as sales_count,
               MAX(p.statistic_date) as statistic_date,
               MAX(p.created_at) as created_at, MAX(p.updated_at) as updated_at
        FROM product_statistics p
        WHERE p.statistic_date >= #{startDate} AND p.statistic_date <= #{endDate}
        GROUP BY p.product_id, p.product_name, p.category_id, p.category_name
        ORDER BY SUM(p.sales_amount) DESC
        LIMIT #{limit}
        """)
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "productId", column = "product_id"),
        @Result(property = "productName", column = "product_name"),
        @Result(property = "categoryId", column = "category_id"),
        @Result(property = "categoryName", column = "category_name"),
        @Result(property = "views", column = "views"),
        @Result(property = "repurchaseCount", column = "repurchase_count"),
        @Result(property = "salesAmount", column = "sales_amount"),
        @Result(property = "salesCount", column = "sales_count"),
        @Result(property = "statisticDate", column = "statistic_date"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<ProductStatistics> getTopProductsByDateRange(String startDate, String endDate, int limit);
}
