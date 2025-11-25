package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.DailyStatistics;
import com.stylemirror.miniapp_backend.domain.ProductStatistics;
import com.stylemirror.miniapp_backend.mapper.DailyStatisticsMapper;
import com.stylemirror.miniapp_backend.mapper.ProductStatisticsMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 统计数据 Service
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StatisticsService {
    
    private final DailyStatisticsMapper dailyStatisticsMapper;
    private final ProductStatisticsMapper productStatisticsMapper;
    private final JdbcTemplate jdbcTemplate;
    
    /**
     * 获取仪表板数据
     */
    public Map<String, Object> getDashboardData(String timeRange) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;
        int days;
        
        switch (timeRange) {
            case "week":
                startDate = endDate.minusDays(7);
                days = 7;
                break;
            case "month":
                startDate = endDate.minusDays(30);
                days = 30;
                break;
            case "year":
                startDate = endDate.minusDays(365);
                days = 365;
                break;
            default:
                startDate = endDate.minusDays(7);
                days = 7;
        }
        
        log.info("查询统计数据，起始日期: {}, 结束日期: {}", startDate, endDate);
        
        // 获取日统计数据
        List<DailyStatistics> dailyStats = dailyStatisticsMapper.getStatisticsByDateRange(startDate, endDate);
        log.info("查询到 {} 条日统计数据", dailyStats.size());
        
        // 如果没有查询到数据，返回测试数据
        if (dailyStats.isEmpty()) {
            log.warn("未查询到日期范围内的统计数据，返回测试数据");
            return getTestDashboardData(days);
        }
        
        if (!dailyStats.isEmpty()) {
            log.info("第一条数据: 日期={}, 浏览量={}", dailyStats.get(0).getStatisticDate(), dailyStats.get(0).getTotalViews());
        }
        
        Map<String, Object> result = new HashMap<>();
        
        // 计算汇总统计
        long totalViews = dailyStats.stream().mapToLong(d -> d.getTotalViews() != null ? d.getTotalViews() : 0).sum();
        BigDecimal totalSalesAmount = dailyStats.stream()
                .map(d -> d.getTotalSalesAmount() != null ? d.getTotalSalesAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long totalRepurchase = dailyStats.stream().mapToLong(d -> d.getTotalRepurchase() != null ? d.getTotalRepurchase() : 0).sum();
        
        result.put("totalViews", totalViews);
        result.put("totalSalesAmount", totalSalesAmount.doubleValue());
        result.put("totalRepurchase", totalRepurchase);
        result.put("totalProducts", 156);
        
        // 准备趋势数据
        List<Map<String, Object>> viewsTrend = dailyStats.stream()
                .map(d -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("date", d.getStatisticDate().toString());
                    m.put("views", d.getTotalViews());
                    return m;
                })
                .collect(Collectors.toList());
        
        List<Map<String, Object>> salesTrend = dailyStats.stream()
                .map(d -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("date", d.getStatisticDate().toString());
                    m.put("sales", d.getTotalSalesAmount() != null ? d.getTotalSalesAmount().doubleValue() : 0);
                    return m;
                })
                .collect(Collectors.toList());
        
        List<Map<String, Object>> repurchaseTrend = dailyStats.stream()
                .map(d -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("date", d.getStatisticDate().toString());
                    m.put("repurchase", d.getTotalRepurchase());
                    return m;
                })
                .collect(Collectors.toList());
        
        result.put("viewsTrend", viewsTrend);
        result.put("salesTrend", salesTrend);
        result.put("repurchaseTrend", repurchaseTrend);
        
        // 获取热销商品
        List<ProductStatistics> topProducts = productStatisticsMapper.getTopProductsByDateRange(startDate, endDate, 5);
        List<Map<String, Object>> topProductsList = topProducts.stream()
                .map(p -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", p.getProductId());
                    m.put("name", p.getProductName());
                    m.put("views", p.getViews());
                    m.put("sales", p.getSalesAmount() != null ? p.getSalesAmount().doubleValue() : 0);
                    m.put("repurchase", p.getRepurchaseCount());
                    return m;
                })
                .collect(Collectors.toList());
        
        result.put("topProducts", topProductsList);
        
        // 分类统计 - 查询真实数据
        String categorySql = "SELECT c.name, COUNT(p.id) as count " +
                "FROM categories c " +
                "LEFT JOIN products p ON c.id = p.category_id " +
                "WHERE p.status = 'PUBLISHED' " +
                "GROUP BY c.id, c.name " +
                "HAVING count > 0 " +
                "ORDER BY count DESC";
        
        List<Map<String, Object>> categoryStats = jdbcTemplate.queryForList(categorySql)
                .stream()
                .map(row -> {
                    Map<String, Object> stat = new HashMap<>();
                    stat.put("name", row.get("name"));
                    stat.put("value", ((Number) row.get("count")).intValue());
                    return stat;
                })
                .collect(Collectors.toList());
        
        // 如果没有真实数据，返回测试数据
        if (categoryStats.isEmpty()) {
            categoryStats = List.of(
                    Map.of("name", "女装", "value", 45),
                    Map.of("name", "男装", "value", 38),
                    Map.of("name", "鞋类", "value", 32),
                    Map.of("name", "配饰", "value", 28),
                    Map.of("name", "其他", "value", 13)
            );
        }
        
        result.put("categoryStats", categoryStats);
        
        return result;
    }
    
    /**
     * 返回测试数据（当数据库中没有数据时）
     */
    private Map<String, Object> getTestDashboardData(int days) {
        Map<String, Object> result = new HashMap<>();
        
        // 模拟最近N天的数据，展现明显起伏
        List<Map<String, Object>> viewsTrend = new java.util.ArrayList<>();
        List<Map<String, Object>> salesTrend = new java.util.ArrayList<>();
        List<Map<String, Object>> repurchaseTrend = new java.util.ArrayList<>();
        
        // 准备30天的完整数据
        int[] allViews = {
            520, 680, 750, 820, 690, 950, 880, 760, 640, 720,
            810, 920, 850, 780, 660, 800, 940, 870, 750, 820,
            900, 780, 650, 720, 880, 960, 830, 770, 690, 850
        };
        int[] allSales = {
            5800, 7200, 8100, 8900, 7300, 9800, 9200, 8100, 6900, 7600,
            8500, 9500, 8800, 8200, 7100, 8400, 9600, 9000, 7900, 8600,
            9300, 8100, 6800, 7500, 9100, 9900, 8700, 8000, 7200, 8800
        };
        int[] allRepurchase = {
            35, 48, 56, 62, 45, 68, 60, 52, 38, 50,
            58, 65, 61, 54, 42, 57, 70, 63, 55, 59,
            66, 53, 40, 49, 64, 72, 60, 55, 44, 62
        };
        
        long totalViews = 0;
        double totalSalesAmount = 0;
        long totalRepurchase = 0;
        
        // 根据天数截取数据
        int startIdx = Math.max(0, 30 - days);
        LocalDate today = LocalDate.now();
        
        for (int i = 0; i < days && (startIdx + i) < 30; i++) {
            LocalDate date = today.minusDays(days - 1 - i);
            String dateStr = date.toString().substring(5); // MM-dd 格式
            
            int dataIdx = startIdx + i;
            totalViews += allViews[dataIdx];
            totalSalesAmount += allSales[dataIdx];
            totalRepurchase += allRepurchase[dataIdx];
            
            Map<String, Object> viewData = new HashMap<>();
            viewData.put("date", dateStr);
            viewData.put("views", allViews[dataIdx]);
            viewsTrend.add(viewData);
            
            Map<String, Object> salesData = new HashMap<>();
            salesData.put("date", dateStr);
            salesData.put("sales", allSales[dataIdx]);
            salesTrend.add(salesData);
            
            Map<String, Object> repurchaseData = new HashMap<>();
            repurchaseData.put("date", dateStr);
            repurchaseData.put("repurchase", allRepurchase[dataIdx]);
            repurchaseTrend.add(repurchaseData);
        }
        
        result.put("totalViews", totalViews);
        result.put("totalSalesAmount", totalSalesAmount);
        result.put("totalRepurchase", totalRepurchase);
        result.put("totalProducts", 156);
        result.put("viewsTrend", viewsTrend);
        result.put("salesTrend", salesTrend);
        result.put("repurchaseTrend", repurchaseTrend);
        
        // 热销商品
        result.put("topProducts", List.of(
            Map.of("id", 1, "name", "女装连衣裙", "views", 1200, "sales", 15000.00, "repurchase", 85),
            Map.of("id", 2, "name", "男士T恤", "views", 980, "sales", 9800.00, "repurchase", 65),
            Map.of("id", 3, "name", "运动鞋", "views", 1500, "sales", 22500.00, "repurchase", 120),
            Map.of("id", 4, "name", "牛仔裤", "views", 820, "sales", 8200.00, "repurchase", 50),
            Map.of("id", 5, "name", "休闲外套", "views", 950, "sales", 14250.00, "repurchase", 75)
        ));
        
        // 分类统计
        result.put("categoryStats", List.of(
            Map.of("name", "女装", "value", 45),
            Map.of("name", "男装", "value", 38),
            Map.of("name", "鞋类", "value", 32),
            Map.of("name", "配饰", "value", 28),
            Map.of("name", "其他", "value", 13)
        ));
        
        return result;
    }
}
