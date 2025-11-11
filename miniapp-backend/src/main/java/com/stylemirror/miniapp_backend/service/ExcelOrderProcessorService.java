package com.stylemirror.miniapp_backend.service;

import com.alibaba.excel.EasyExcel;
import com.alibaba.excel.read.listener.ReadListener;
import com.alibaba.excel.context.AnalysisContext;
import com.stylemirror.miniapp_backend.dto.ExcelOrderDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.*;
import java.util.concurrent.*;

/**
 * Excel 订单处理服务
 * 使用 EasyExcel 流式读取 + 双层线程池（FixedThreadPool + ForkJoinPool）实现高性能批量导入
 */
@Slf4j
@Service
public class ExcelOrderProcessorService {

    private final ExcelOrderTaskExecutor taskExecutor;

    // 批次大小
    private static final int BATCH_SIZE = 1000;

    public ExcelOrderProcessorService() {
        // 初始化双层线程池执行器
        this.taskExecutor = new ExcelOrderTaskExecutor();
    }

    /**
     * 处理 Excel 订单导入
     *
     * @param inputStream Excel 文件输入流
     * @return 处理结果统计信息
     */
    public ExcelImportResult processOrderExcel(InputStream inputStream) {
        long startTime = System.currentTimeMillis();
        ExcelImportResult result = new ExcelImportResult();
        List<List<ExcelOrderDTO>> batches = new ArrayList<>();
        List<ExcelOrderDTO> currentBatch = new ArrayList<>();

        try {
            // EasyExcel 流式读取监听器
            EasyExcel.read(inputStream, ExcelOrderDTO.class, new ReadListener<ExcelOrderDTO>() {
                @Override
                public void invoke(ExcelOrderDTO data, AnalysisContext context) {
                    // 数据校验
                    if (validateOrder(data)) {
                        currentBatch.add(data);
                        // 达到批次大小，提交任务
                        if (currentBatch.size() >= BATCH_SIZE) {
                            batches.add(new ArrayList<>(currentBatch));
                            currentBatch.clear();
                        }
                    } else {
                        result.incrementFailCount();
                    }
                }

                @Override
                public void doAfterAllAnalysed(AnalysisContext context) {
                    // 处理最后一个不足批次的数据
                    if (!currentBatch.isEmpty()) {
                        batches.add(new ArrayList<>(currentBatch));
                    }
                    log.info("Excel 读取完成，共分片 {} 个批次", batches.size());
                }
            }).sheet(0).doRead();

            result.setTotalBatches(batches.size());

            // 使用 FixedThreadPool 调度批次任务
            for (List<ExcelOrderDTO> batch : batches) {
                taskExecutor.submitBatchTask(batch, result);
            }

            // 等待所有任务完成
            taskExecutor.awaitCompletion();

            long endTime = System.currentTimeMillis();
            result.setTotalTimeMs(endTime - startTime);
            result.setSuccessCount(result.getTotalCount() - result.getFailCount());

            log.info("Excel 订单导入完成: 总数={}, 成功={}, 失败={}, 耗时={}ms",
                    result.getTotalCount(), result.getSuccessCount(), result.getFailCount(), result.getTotalTimeMs());

            return result;

        } catch (Exception e) {
            log.error("Excel 订单导入失败", e);
            result.setError(e.getMessage());
            return result;
        } finally {
            taskExecutor.shutdown();
        }
    }

    /**
     * 订单数据校验
     */
    private boolean validateOrder(ExcelOrderDTO order) {
        if (order.getUserId() == null || order.getUserId() <= 0) {
            log.warn("订单校验失败: 用户ID无效");
            return false;
        }
        if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            log.warn("订单校验失败: 金额无效");
            return false;
        }
        if (order.getOutTradeNo() == null || order.getOutTradeNo().trim().isEmpty()) {
            log.warn("订单校验失败: 订单号为空");
            return false;
        }
        return true;
    }

    /**
     * Excel 导入结果统计
     */
    public static class ExcelImportResult {
        private int totalCount;
        private int successCount;
        private int failCount;
        private int totalBatches;
        private long totalTimeMs;
        private String error;

        public ExcelImportResult() {
            this.totalCount = 0;
            this.successCount = 0;
            this.failCount = 0;
            this.totalBatches = 0;
            this.totalTimeMs = 0;
        }

        public synchronized void incrementTotalCount() {
            this.totalCount++;
        }

        public synchronized void incrementSuccessCount() {
            this.successCount++;
        }

        public synchronized void incrementFailCount() {
            this.failCount++;
        }

        // Getters and Setters
        public int getTotalCount() { return totalCount; }
        public void setTotalCount(int totalCount) { this.totalCount = totalCount; }

        public int getSuccessCount() { return successCount; }
        public void setSuccessCount(int successCount) { this.successCount = successCount; }

        public int getFailCount() { return failCount; }
        public void setFailCount(int failCount) { this.failCount = failCount; }

        public int getTotalBatches() { return totalBatches; }
        public void setTotalBatches(int totalBatches) { this.totalBatches = totalBatches; }

        public long getTotalTimeMs() { return totalTimeMs; }
        public void setTotalTimeMs(long totalTimeMs) { this.totalTimeMs = totalTimeMs; }

        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
    }
}
