package com.stylemirror.miniapp_backend.service;

import com.stylemirror.miniapp_backend.dto.ExcelOrderDTO;
import lombok.extern.slf4j.Slf4j;

import java.util.*;
import java.util.concurrent.*;

/**
 * Excel 订单任务执行器
 * 实现双层线程池架构：
 * - 外层 FixedThreadPool：调度分片任务，线程数 = CPU核心数 × 2
 * - 内层 ForkJoinPool：并行处理单个分片内的数据
 */
@Slf4j
public class ExcelOrderTaskExecutor {

    // CPU 核心数
    private static final int CPU_CORES = Runtime.getRuntime().availableProcessors();

    // 外层 FixedThreadPool：线程数 = CPU核心数 × 2
    private final ExecutorService fixedThreadPool;

    // 内层 ForkJoinPool：线程数 = CPU核心数
    private final ForkJoinPool forkJoinPool;

    // 任务计数器：记录提交的任务数
    private final CountDownLatch taskLatch;

    // 结果汇总队列
    private final ConcurrentLinkedQueue<ExcelOrderDTO> resultQueue;

    // 待处理的批次任务队列
    private final BlockingQueue<List<ExcelOrderDTO>> batchQueue;

    private final int expectedBatches;

    private volatile boolean shutdown = false;

    public ExcelOrderTaskExecutor() {
        this.fixedThreadPool = Executors.newFixedThreadPool(CPU_CORES * 2);
        this.forkJoinPool = new ForkJoinPool(CPU_CORES);
        this.resultQueue = new ConcurrentLinkedQueue<>();
        this.batchQueue = new LinkedBlockingQueue<>(CPU_CORES * 4); // 背压控制
        this.expectedBatches = 0;
        this.taskLatch = new CountDownLatch(1);

        log.info("ExcelOrderTaskExecutor 初始化: CPU核心数={}, FixedThreadPool线程数={}, ForkJoinPool线程数={}",
                CPU_CORES, CPU_CORES * 2, CPU_CORES);
    }

    /**
     * 提交批次任务
     */
    public void submitBatchTask(List<ExcelOrderDTO> batch, ExcelOrderProcessorService.ExcelImportResult result) {
        try {
            // 提交到外层 FixedThreadPool
            fixedThreadPool.submit(() -> processBatchWithForkJoin(batch, result));
        } catch (RejectedExecutionException e) {
            log.error("批次任务提交失败，线程池已关闭", e);
            result.incrementFailCount();
        }
    }

    /**
     * 使用 ForkJoinPool 处理单个分片
     */
    private void processBatchWithForkJoin(List<ExcelOrderDTO> batch, ExcelOrderProcessorService.ExcelImportResult result) {
        long startTime = System.currentTimeMillis();
        int batchSize = batch.size();

        try {
            // 使用 parallelStream + ForkJoinPool 并行处理
            forkJoinPool.execute(() ->
                batch.parallelStream().forEach(order -> {
                    try {
                        // 这里可以执行具体的订单数据处理逻辑
                        // 例如：数据验证、数据转换、数据聚合等
                        processOrderData(order);
                        resultQueue.offer(order);
                        result.incrementSuccessCount();
                        result.incrementTotalCount();
                    } catch (Exception e) {
                        log.error("订单处理失败: {}", order, e);
                        result.incrementFailCount();
                        result.incrementTotalCount();
                    }
                })
            );

            long elapsed = System.currentTimeMillis() - startTime;
            log.debug("批次处理完成: 数量={}, 耗时={}ms", batchSize, elapsed);

        } catch (Exception e) {
            log.error("分片处理异常", e);
            result.incrementFailCount();
        }
    }

    /**
     * 处理订单数据的具体逻辑
     * 可以根据需要扩展为：数据验证、转换、聚合等操作
     */
    private void processOrderData(ExcelOrderDTO order) {
        // 示例：可以在这里添加具体的数据处理逻辑
        // 1. 数据验证
        // 2. 数据转换
        // 3. 数据聚合（按用户ID、状态等分组统计）
        // 4. 数据去重
        // 5. 业务规则检查等
    }

    /**
     * 等待所有任务完成
     */
    public void awaitCompletion() {
        try {
            // 关闭外层 FixedThreadPool 的新任务提交
            fixedThreadPool.shutdown();

            // 等待所有任务完成（最长等待 10 分钟）
            boolean completed = fixedThreadPool.awaitTermination(10, TimeUnit.MINUTES);
            if (!completed) {
                log.warn("任务等待超时，强制关闭");
                fixedThreadPool.shutdownNow();
            }

            // 确保 ForkJoinPool 任务也完成
            forkJoinPool.awaitQuiescence(10, TimeUnit.MINUTES);

            log.info("所有批次处理完成，结果数量: {}", resultQueue.size());

        } catch (InterruptedException e) {
            log.error("等待任务完成时被中断", e);
            Thread.currentThread().interrupt();
        }
    }

    /**
     * 关闭执行器
     */
    public void shutdown() {
        if (!shutdown) {
            shutdown = true;
            fixedThreadPool.shutdownNow();
            forkJoinPool.shutdown();
            log.info("ExcelOrderTaskExecutor 已关闭");
        }
    }

    /**
     * 获取处理结果队列
     */
    public Collection<ExcelOrderDTO> getResults() {
        return new ArrayList<>(resultQueue);
    }

    /**
     * 获取结果队列大小
     */
    public int getResultSize() {
        return resultQueue.size();
    }
}
