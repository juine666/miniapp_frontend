package com.stylemirror.miniapp_backend.example;

import com.alibaba.excel.EasyExcel;
import com.stylemirror.miniapp_backend.dto.ExcelOrderDTO;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * 生成测试 Excel 文件的工具类
 * 
 * 使用方式：
 * 1. 执行 main 方法生成测试 Excel 文件
 * 2. 使用生成的 Excel 文件调用 POST /api/excel/import-orders 接口
 * 3. 在日志中观察处理性能
 */
public class ExcelTestDataGenerator {

    public static void main(String[] args) throws IOException {
        // 生成测试数据
        generateTestExcel("订单数据_小规模.xlsx", 1000);
        generateTestExcel("订单数据_中规模.xlsx", 10000);
        generateTestExcel("订单数据_大规模.xlsx", 100000);
        
        System.out.println("测试 Excel 文件已生成完毕");
    }

    /**
     * 生成指定数量的测试数据
     */
    private static void generateTestExcel(String fileName, int rowCount) throws IOException {
        List<ExcelOrderDTO> dataList = new ArrayList<>();

        for (int i = 1; i <= rowCount; i++) {
            ExcelOrderDTO order = new ExcelOrderDTO();
            order.setUserId((long) (i % 1000) + 1);  // 用户ID：1-1000
            order.setOutTradeNo("ORD" + String.format("%010d", i));  // 订单号：ORD0000000001 等
            order.setTotalAmount(BigDecimal.valueOf(Math.random() * 10000 + 10).setScale(2, BigDecimal.ROUND_HALF_UP));
            
            // 状态随机分配
            String[] statuses = {"CREATED", "PAID", "SHIPPED", "DELIVERED", "CANCELED"};
            order.setStatus(statuses[i % statuses.length]);
            
            dataList.add(order);
        }

        // 使用 EasyExcel 写入文件
        String filePath = System.getProperty("user.home") + "/Desktop/" + fileName;
        EasyExcel.write(filePath, ExcelOrderDTO.class)
                .sheet("订单数据")
                .doWrite(dataList);

        System.out.println("生成测试文件: " + filePath + " (共 " + rowCount + " 条记录)");
    }
}
