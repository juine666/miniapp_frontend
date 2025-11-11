package com.stylemirror.miniapp_backend.dto;

import lombok.Data;

/**
 * Excel 订单导入统计结果
 */
@Data
public class ExcelImportResultDTO {

    private int totalCount;
    private int successCount;
    private int failCount;
    private int totalBatches;
    private long totalTimeMs;
    private String error;

    public ExcelImportResultDTO() {
        this.totalCount = 0;
        this.successCount = 0;
        this.failCount = 0;
        this.totalBatches = 0;
        this.totalTimeMs = 0;
    }

    public String getDescription() {
        return String.format("批次数: %d, 总数: %d, 成功: %d, 失败: %d, 耗时: %d ms",
                totalBatches, totalCount, successCount, failCount, totalTimeMs);
    }
}
