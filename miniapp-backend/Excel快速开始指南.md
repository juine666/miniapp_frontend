# Excel 订单导入功能 - 快速开始指南

## 项目已实现的功能

已成功将 Excel 高性能订单导入功能集成到项目中，包括以下核心组件：

### ✅ 核心代码文件

1. **ExcelOrderDTO.java** - Excel 数据模型，定义列映射
2. **ExcelOrderProcessorService.java** - 主处理服务，管理 Excel 流式读取和批次分片
3. **ExcelOrderTaskExecutor.java** - 双层线程池执行器
   - 外层：FixedThreadPool（线程数 = CPU核心数 × 2）
   - 内层：ForkJoinPool（线程数 = CPU核心数）
4. **ExcelImportController.java** - REST API 控制器
5. **OrderService.java** - 订单业务服务层
6. **ExcelImportResultDTO.java** - 导入结果 DTO

### ✅ 依赖配置

- `pom.xml` 已添加 EasyExcel 3.3.2 依赖

### ✅ 测试工具

- **ExcelTestDataGenerator.java** - 生成测试 Excel 文件的工具类
- 已生成 3 个测试文件：
  - `/Users/leiyong/Desktop/订单数据_小规模.xlsx`（1000 条）
  - `/Users/leiyong/Desktop/订单数据_中规模.xlsx`（10000 条）
  - `/Users/leiyong/Desktop/订单数据_大规模.xlsx`（100000 条）

## 快速测试步骤

### 1. 启动项目

```bash
cd /Users/leiyong/Documents/cursor/StyleMirrorAi/miniapp-backend
mvn spring-boot:run
```

或执行脚本：
```bash
./前台运行.sh
```

服务启动后监听 `http://localhost:8081`

### 2. 调用导入接口

使用 curl 命令：
```bash
# 导入小规模数据（1000条）
curl -X POST http://localhost:8081/api/excel/import-orders \
  -F "file=@/Users/leiyong/Desktop/订单数据_小规模.xlsx"

# 导入中规模数据（10000条）
curl -X POST http://localhost:8081/api/excel/import-orders \
  -F "file=@/Users/leiyong/Desktop/订单数据_中规模.xlsx"

# 导入大规模数据（100000条）
curl -X POST http://localhost:8081/api/excel/import-orders \
  -F "file=@/Users/leiyong/Desktop/订单数据_大规模.xlsx"
```

或使用 Postman：
1. 新建 POST 请求，地址：`http://localhost:8081/api/excel/import-orders`
2. Body 选择 `form-data`
3. Key 选择 `file`，Value 选择文件

### 3. 查看响应

成功响应示例：
```json
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

### 4. 监控处理日志

```bash
# 在另一个终端查看日志
tail -f logs/miniapp-backend.log

# 或使用脚本
./查看日志.sh
```

关键日志输出示例：
```
[INFO] Excel 读取完成，共分片 5 个批次
[INFO] 所有批次处理完成，结果数量: 4950
[INFO] Excel 订单导入完成: 总数=5000, 成功=4950, 失败=50, 耗时=2345ms
```

## 性能预期

| 数据规模 | 预期耗时 | 备注 |
|---------|---------|------|
| 1,000 条 | < 100ms | 内存占用小，主要是 I/O 时间 |
| 10,000 条 | 100-500ms | 充分利用多线程并行处理 |
| 100,000 条 | 500ms-2s | 取决于 CPU 核心数和内存配置 |

**性能优势**：
- ✅ 流式读取：不会一次性加载整个文件到内存
- ✅ 批次分片：1000 行一个批次，内存占用恒定
- ✅ 双层并发：外层调度 + 内层计算充分利用 CPU 多核
- ✅ 异步处理：主线程持续读取，不等待批次计算

## 集成到业务流程

### 示例：保存订单到数据库

修改 `ExcelOrderTaskExecutor.java` 的 `processBatchWithForkJoin()` 方法，在处理订单后保存到数据库：

```java
forkJoinPool.execute(() ->
    batch.parallelStream().forEach(order -> {
        try {
            // 处理订单数据
            processOrderData(order);
            
            // 保存到数据库（需要注入 OrderService）
            Order domainOrder = new Order();
            domainOrder.setUserId(order.getUserId());
            domainOrder.setOutTradeNo(order.getOutTradeNo());
            domainOrder.setTotalAmount(order.getTotalAmount());
            domainOrder.setStatus(order.getStatus());
            domainOrder.setCreatedAt(Instant.now());
            
            orderService.save(domainOrder);  // 或 saveBatch() 更高效
            
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

## 架构图

```
Excel 文件上传
    ↓
ExcelImportController
    ↓
ExcelOrderProcessorService（分片管理）
    ↓
EasyExcel.read()（流式读取，SAX模式）
    ↓
每 1000 行为一个批次
    ↓
FixedThreadPool 异步调度批次
    ↓ （CPU核心数 × 2 个线程）
    ↓
ExcelOrderTaskExecutor.processBatchWithForkJoin()
    ↓
ForkJoinPool（CPU核心数 个线程）
    ↓
parallelStream().forEach(processOrderData)
    ↓
ConcurrentLinkedQueue 汇总
    ↓
返回导入结果统计
```

## 扩展功能建议

### 1. 添加数据验证规则

在 `ExcelOrderProcessorService.validateOrder()` 中扩展验证逻辑：
```java
private boolean validateOrder(ExcelOrderDTO order) {
    // 现有验证
    if (order.getUserId() == null || order.getUserId() <= 0) return false;
    if (order.getTotalAmount() == null || order.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) return false;
    if (order.getOutTradeNo() == null || order.getOutTradeNo().trim().isEmpty()) return false;
    
    // 新增：业务规则验证
    if (!isValidOrderStatus(order.getStatus())) return false;
    if (!isUserExists(order.getUserId())) return false;
    
    return true;
}
```

### 2. 实时进度查询

添加新接口获取导入进度：
```java
@GetMapping("/import-progress/{importId}")
public ApiResponse<?> getProgress(@PathVariable String importId) {
    // 返回当前进度
}
```

### 3. 支持其他数据类型

复制服务类，修改 DTO 和字段映射，可支持：
- 用户数据导入
- 商品数据导入
- 库存数据导入

### 4. 批量删除导入的数据

便于测试时清空数据：
```java
@DeleteMapping("/orders/imported-after/{timestamp}")
public ApiResponse<?> deleteImportedOrders(@PathVariable Long timestamp) {
    // 删除指定时间后导入的订单
}
```

## 常见问题排查

### 问题 1：导入失败，错误信息"仅支持 .xlsx 或 .xls 格式"

**解决**：确保上传的文件扩展名正确

### 问题 2：导入很慢

**排查步骤**：
1. 查看日志 `awaitTermination` 前的批次处理速度
2. 确认 processOrderData() 中没有阻塞操作
3. 尝试增加 FixedThreadPool 线程数：改为 `CPU_CORES * 4`
4. 减小批次大小：改为 500 行

### 问题 3：内存溢出（OutOfMemoryError）

**解决**：
1. 减小批次大小为 500 行
2. 增加 JVM 堆大小：`-Xmx2048m`
3. 分片处理后及时释放不需要的对象

### 问题 4：无法连接到数据库

**确认**：
1. 数据库服务正常运行
2. application.yml 中数据库连接配置正确
3. 数据库用户权限足够

## 代码位置总览

```
miniapp-backend/
├── src/main/java/com/stylemirror/miniapp_backend/
│   ├── controller/
│   │   └── ExcelImportController.java          # REST API
│   ├── service/
│   │   ├── ExcelOrderProcessorService.java     # 主服务
│   │   ├── ExcelOrderTaskExecutor.java         # 双层线程池
│   │   └── OrderService.java                   # 订单服务
│   ├── dto/
│   │   ├── ExcelOrderDTO.java                  # Excel 数据模型
│   │   └── ExcelImportResultDTO.java           # 导入结果
│   └── example/
│       └── ExcelTestDataGenerator.java         # 测试数据生成
├── pom.xml                                      # EasyExcel 依赖已添加
└── Excel订单导入使用说明.md                     # 详细文档

```

## 下一步

1. ✅ 集成到业务流程（保存到数据库）
2. ✅ 部署到生产环境
3. ✅ 监控和性能调优
4. ✅ 添加导入历史记录功能
5. ✅ 支持导入结果导出（错误清单等）

---

有任何问题欢迎提问！
