# 后端服务运行说明

## 开发模式（推荐）

### 前台运行（可以看到控制台日志和错误）
```bash
cd miniapp-backend
./前台运行.sh
```

或者直接：
```bash
cd miniapp-backend
./gradlew bootRun -x test
```

**优点**：
- ✅ 实时看到控制台日志
- ✅ 错误和异常立即显示
- ✅ 方便调试
- ✅ Ctrl+C 即可停止

### 后台运行
```bash
cd miniapp-backend
./gradlew bootRun -x test &
```

**查看日志**：
```bash
# 实时查看日志
tail -f logs/miniapp-backend.log

# 或者使用脚本
./查看日志.sh
```

## 停止服务

```bash
# 查找进程
lsof -ti:8081

# 停止服务
kill -9 $(lsof -ti:8081)
```

## 日志文件位置

- 当前日志：`logs/miniapp-backend.log`
- 历史日志：`logs/miniapp-backend.2025-10-31.log`

## 日志级别

开发环境已配置为：
- `com.stylemirror.miniapp_backend.*` - DEBUG
- 根日志 - INFO
- 控制台和文件同时输出

