自动生成代码（基于 Spring Boot + JDK 17 + EasyExcel + ForkJoinPool + FixedThreadPool 结构）。要添加一个文件解析功能

{
  "name": "ExcelHighPerformanceProcessing",
  "description": "单文件分片读取 + 双层线程池（EasyExcel + FixedThreadPool + ForkJoinPool）高性能数据处理架构",
  "rules": [
    {
      "when": "developer asks to process large Excel file",
      "then": [
        "使用 EasyExcel 实现流式（SAX 模式）读取 Excel，每次只加载少量数据到内存。",
        "每读取 1000 行数据后，封装成一个 List<List<String>> 批次对象。",
        "在读取过程中，将每个批次任务提交到外层 FixedThreadPool 执行，以异步方式处理，避免阻塞主线程。",
        "FixedThreadPool 用于控制并发任务数，建议线程数 = CPU核心数 × 2。",
        "每个分片任务内部再使用 ForkJoinPool 并行处理（数据校验、聚合、计算等），提升 CPU 利用率。",
        "ForkJoinPool 线程数建议为 CPU 核心数，内部可使用 parallelStream。",
        "主线程持续读取 Excel，不等待分片计算结果（异步执行），读取完成后等待所有任务结束。",
        "处理完每个分片后，将结果写入 ConcurrentLinkedQueue 或 ConcurrentHashMap 汇总。",
        "异常处理：每个分片任务独立 try-catch，确保不会影响主线程读取。",
        "优化建议：可增加任务队列容量限制（BlockingQueue）实现背压，防止分片过多导致内存堆积。",
        "整体架构：EasyExcel 流式读取 → 分片缓存 → FixedThreadPool 调度 → ForkJoinPool 并行计算 → 结果汇总。"
      ]
    },
    {
      "when": "developer requests code generation",
      "then": [
        "生成 Spring Boot 兼容的 Java 类结构。",
        "定义 ExcelProcessorService：负责分片读取逻辑（EasyExcel + listener）。",
        "定义 ExcelTaskExecutor：封装 FixedThreadPool 和 ForkJoinPool 管理。",
        "每个批次任务调用 ForkJoinPool.submit(() -> batch.parallelStream().forEach(...))。",
        "读取结束后调用 executor.awaitTermination() 等待所有任务结束。",
        "日志打印分片数量、总耗时、每批耗时，用于性能评估。"
      ]
    },
    {
      "when": "developer asks about performance tuning",
      "then": [
        "建议批次大小 500~1000 行之间。",
        "建议 ForkJoinPool 与 CPU 核心数一致（例如8核 → 8线程）。",
        "FixedThreadPool 建议为 CPU核心数 × 2。",
        "避免嵌套使用多层池 submit().get() 阻塞，可使用 CompletionService 异步汇总。",
        "对于多文件导入任务，可在外层再套一层 FixedThreadPool 控制文件并发数。"
      ]
    }
  ]
}
