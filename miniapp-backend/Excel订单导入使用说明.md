# Excel 订单高性能导入说明

## 功能概述

本模块实现了基于 **Spring Boot 3.1.5 + EasyExcel 3.3.2 + 双层线程池** 的高性能 Excel 订单批量导入功能。

## 核心架构

### 1. 分层设计

```
用户上传 Excel 文件
    ↓
EasyExcel 流式读取（SAX模式，每次只加载少量数据到内存）
    ↓
每读取 1000 行数据后封装成一个批次任务
    ↓
外层 FixedThreadPool 异步调度批次（线程数 = CPU核心数 × 2）
    ↓
内层 ForkJoinPool 并行处理单个批次内的订单数据（线程数 = CPU核心数）
    ↓
ConcurrentLinkedQueue 汇总结果
```

### 2. 关键类说明

| 类名 | 职责 |
|------|------|
| `ExcelOrderProcessorService` | 主服务类，负责 Excel 读取与分片管理 |
| `ExcelOrderTaskExecutor` | 双层线程池执行器，管理 FixedThreadPool 和 ForkJoinPool |
| `ExcelOrderDTO` | 订单数据传输对象，定义 Excel 列映射 |
| `ExcelImportController` | 提供 HTTP 接口接收文件上传 |
| `OrderService` | 订单业务服务层 |

## 使用方式

### 1. API 接口

**上传 Excel 文件导入订单**

```
POST /api/excel/import-orders
Content-Type: multipart/form-data

参数:
  - file: Excel 文件（.xlsx 或 .xls 格式）

响应示例:
{
  "code": 0,
  "message": "ok",
  "data": {
    "totalCount": 5000,
    "successCount": 4950,
    "failCount": 50,
    "totalBatches": 5,
    "totalTimeMs": 2345,
    "error": null
  }
}
```

### 2. Excel 文件格式

需要以下列结构（无header行时自动解析，有header行时跳过第一行）：

| 列 | 含义 | 类型 | 示例 |
|----|------|------|------|
| 0 | 用户ID | Long | 123 |
| 1 | 订单号 | String | ORD202411001 |
| 2 | 订单金额 | BigDecimal | 99.99 |
| 3 | 订单状态 | String | PAID |

### 3. 集成到项目

已自动集成到项目中，无需额外配置。

**依赖已添加到 pom.xml：**
```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>easyexcel</artifactId>
    <version>3.3.2</version>
</dependency>
```

## 性能特点

### 1. 内存管理

- **流式读取**：EasyExcel 使用 SAX 模式，不会一次性加载整个文件到内存
- **分片处理**：每个批次 1000 行，可根据内存大小调整
- **背压控制**：BlockingQueue 限制任务队列容量，防止内存堆积

### 2. 并发处理

- **外层 FixedThreadPool**：CPU核心数 × 2 个线程，最多同时处理 N 个批次
- **内层 ForkJoinPool**：CPU核心数 个线程，使用 parallelStream 充分利用多核 CPU
- **异步调度**：主线程持续读取文件，不等待批次处理完成，充分发挥 I/O 和 CPU 并行度

### 3. 容错机制

- **分片隔离**：单个批次异常不影响其他批次处理
- **任务级异常捕获**：每个订单异常单独记录，不中断整个流程
- **超时控制**：awaitTermination 设置 10 分钟超时，防止无限等待

## 性能调优参数

在 `ExcelOrderTaskExecutor` 类中修改以下常量：

```java
// CPU 核心数（自动检测，无需修改）
private static final int CPU_CORES = Runtime.getRuntime().availableProcessors();

// 外层 FixedThreadPool 线程数
Executors.newFixedThreadPool(CPU_CORES * 2);  // 改为其他值如 CPU_CORES 或 CPU_CORES * 4

// 内层 ForkJoinPool 线程数
new ForkJoinPool(CPU_CORES);  // 改为其他值

// 背压控制：队列容量上限
new LinkedBlockingQueue<>(CPU_CORES * 4);  // 改为其他值如 CPU_CORES * 8
```

在 `ExcelOrderProcessorService` 中修改批次大小：

```java
private static final int BATCH_SIZE = 1000;  // 改为 500、2000 等
```

## 扩展说明

### 1. 自定义数据处理逻辑

在 `ExcelOrderTaskExecutor.processOrderData()` 方法中添加具体的数据处理逻辑：

```java
private void processOrderData(ExcelOrderDTO order) {
    // 示例：数据验证
    validateOrderFields(order);
    
    // 示例：数据转换
    convertOrderCurrency(order);
    
    // 示例：数据聚合（按用户分组统计）
    aggregateByUserId(order);
    
    // 示例：业务规则检查
    checkBusinessRules(order);
}
```

### 2. 集成数据库保存

修改 `ExcelOrderTaskExecutor.processBatchWithForkJoin()` 中的处理逻辑，在 `processOrderData()` 后调用 `orderService.save()` 或 `orderService.saveBatch()`：

```java
forkJoinPool.execute(() ->
    batch.parallelStream().forEach(order -> {
        try {
            processOrderData(order);
            
            // 转换为 Order 实体并保存
            Order domainOrder = new Order();
            domainOrder.setUserId(order.getUserId());
            domainOrder.setOutTradeNo(order.getOutTradeNo());
            domainOrder.setTotalAmount(order.getTotalAmount());
            domainOrder.setStatus(order.getStatus());
            
            orderService.save(domainOrder);  // 或 orderService.saveBatch()
            
            resultQueue.offer(order);
            result.incrementSuccessCount();
        } catch (Exception e) {
            log.error("订单处理失败", e);
            result.incrementFailCount();
        }
        result.incrementTotalCount();
    })
);
```

### 3. 支持其他数据类型

复制 `ExcelOrderDTO` 和 `ExcelOrderProcessorService`，修改字段和业务逻辑，可以支持：
- 用户数据导入
- 商品数据导入
- 分类数据导入
- 等等

## 测试建议

### 1. 小文件测试
创建包含 100 条记录的 Excel 文件测试基本功能

### 2. 大文件测试
创建包含 10万+ 条记录的 Excel 文件测试性能

### 3. 异常场景测试
- 包含无效数据的行
- 缺少必需列
- 列类型不匹配

### 4. 并发测试
同时上传多个文件测试并发能力

## 注意事项

1. **内存管理**：建议在生产环境中监控堆内存使用，根据服务器内存调整批次大小
2. **磁盘 I/O**：确保数据库连接池足够大，支持并发写入
3. **文件大小限制**：需在 Spring Boot 配置中设置 `spring.servlet.multipart.max-file-size`
4. **线程安全**：ExcelImportResult 中的计数器已使用 synchronized 保护，支持并发访问
5. **日志监控**：在生产环境启用 DEBUG 级别日志，便于性能分析

## 配置示例（application.yml）

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB
  
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
          fetch_size: 50

logging:
  level:
    com.stylemirror.miniapp_backend.service: DEBUG
```

## 常见问题

**Q：导入时很慢？**
A：检查以下几点：
1. 批次大小是否过小（建议 500-2000）
2. 内部 processOrderData() 是否有阻塞操作
3. 数据库写入是否成为瓶颈
4. 线程池配置是否合理（可尝试 CPU_CORES × 4 等）

**Q：内存溢出？**
A：
1. 减小批次大小（如从 1000 改为 500）
2. 增加 JVM 堆大小：`-Xmx2048m`
3. 分片处理后及时清空不需要的引用

**Q：如何实时获取导入进度？**
A：可以在 `ExcelImportResult` 中添加原子计数器，通过新增的查询接口定期获取进度。

---

更多信息请参考规则文件：`.feisuan/rules/excel.md`
