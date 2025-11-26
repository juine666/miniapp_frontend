package com.stylemirror.miniapp_backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.DailyStatistics;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import java.time.LocalDate;
import java.util.List;

/**
 * 日统计 Mapper
 */
@Mapper
public interface DailyStatisticsMapper extends BaseMapper<DailyStatistics> {
    
    /**
     * 获取指定日期范围内的统计数据
     */
    @Select("SELECT id, statistic_date, total_views, total_sales_amount, " +
            "total_sales_count, total_repurchase, active_products, new_users, " +
            "created_at, updated_at " +
            "FROM daily_statistics " +
            "WHERE statistic_date >= #{startDate} AND statistic_date <= #{endDate} " +
            "ORDER BY statistic_date ASC " +
            "LIMIT 100")
    @Results({
        @Result(property = "id", column = "id"),
        @Result(property = "statisticDate", column = "statistic_date"),
        @Result(property = "totalViews", column = "total_views"),
        @Result(property = "totalSalesAmount", column = "total_sales_amount"),
        @Result(property = "totalSalesCount", column = "total_sales_count"),
        @Result(property = "totalRepurchase", column = "total_repurchase"),
        @Result(property = "activeProducts", column = "active_products"),
        @Result(property = "newUsers", column = "new_users"),
        @Result(property = "createdAt", column = "created_at"),
        @Result(property = "updatedAt", column = "updated_at")
    })
    List<DailyStatistics> getStatisticsByDateRange(String startDate, String endDate);
}
