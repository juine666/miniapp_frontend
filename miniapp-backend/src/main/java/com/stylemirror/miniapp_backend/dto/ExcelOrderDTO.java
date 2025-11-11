package com.stylemirror.miniapp_backend.dto;

import com.alibaba.excel.annotation.ExcelProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Excel 订单导入数据模型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExcelOrderDTO {

    @ExcelProperty(value = "用户ID", index = 0)
    private Long userId;

    @ExcelProperty(value = "订单号", index = 1)
    private String outTradeNo;

    @ExcelProperty(value = "订单金额", index = 2)
    private BigDecimal totalAmount;

    @ExcelProperty(value = "订单状态", index = 3)
    private String status;
}
