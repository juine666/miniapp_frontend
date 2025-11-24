package com.stylemirror.miniapp_backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.DailyStatistics;
import org.apache.ibatis.annotations.Mapper;
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
    @Select("SELECT * FROM daily_statistics WHERE statistic_date >= #{startDate} AND statistic_date <= #{endDate} ORDER BY statistic_date ASC")
    List<DailyStatistics> getStatisticsByDateRange(LocalDate startDate, LocalDate endDate);
}
