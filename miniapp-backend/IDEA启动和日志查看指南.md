# IDEA 启动和日志查看指南

## 📋 前置条件

1. **JDK 17** - 确保已安装并配置
2. **Maven 3.8.5+** - 确保已安装并配置
3. **IDEA 2023.3+** - 推荐使用最新版本
4. **MySQL** - 数据库服务已启动
5. **Redis** - Redis服务已启动（可选，如果使用缓存）

## 🚀 在 IDEA 中启动项目

### 方法一：使用 Spring Boot 运行配置（推荐）

#### 1. 打开项目
- 在 IDEA 中打开 `miniapp-backend` 目录
- 等待 Maven 自动导入依赖（右下角会显示进度）

#### 2. 找到启动类
- 导航到：`src/main/java/com/stylemirror/miniapp_backend/MiniappBackendApplication.java`
- 或者使用快捷键：`Ctrl+Shift+N` (Windows/Linux) 或 `Cmd+Shift+O` (Mac)，输入 `MiniappBackendApplication`

#### 3. 创建运行配置
- 右键点击 `MiniappBackendApplication.java` 文件
- 选择 `Run 'MiniappBackendApplication.main()'`
- 或者点击类名左侧的绿色运行按钮 ▶️

#### 4. 配置运行参数（可选）
如果需要自定义配置，可以：
- 点击 `Run` → `Edit Configurations...`
- 选择 `MiniappBackendApplication`
- 在 `VM options` 中添加：
  ```
  -Dspring.profiles.active=dev
  ```
- 在 `Environment variables` 中添加环境变量（如果需要）：
  ```
  DATASOURCE_URL=jdbc:mysql://localhost:3306/miniapp
  DATASOURCE_USERNAME=root
  DATASOURCE_PASSWORD=root
  REDIS_HOST=localhost
  REDIS_PORT=6379
  ```

#### 5. 启动项目
- 点击运行按钮 ▶️ 或按 `Shift+F10` (Windows/Linux) 或 `Ctrl+R` (Mac)
- 等待项目启动完成

### 方法二：使用 Maven 运行

#### 1. 打开 Maven 工具窗口
- 点击右侧边栏的 `Maven` 标签
- 或使用快捷键：`Alt+1` (Windows/Linux) 或 `Cmd+1` (Mac)

#### 2. 运行 Spring Boot
- 展开 `miniapp-backend` → `Plugins` → `spring-boot`
- 双击 `spring-boot:run`
- 或右键选择 `Run 'miniapp-backend [spring-boot:run]'`

## 📊 查看日志

### 1. IDEA 控制台日志（实时）

#### 查看位置
- **Run 窗口**：项目启动后，底部会自动打开 `Run` 窗口
- **Console 标签**：在 Run 窗口底部，点击 `Console` 标签

#### 日志特点
- ✅ 实时显示所有日志
- ✅ 彩色输出（INFO/DEBUG/ERROR 不同颜色）
- ✅ 可以搜索和过滤
- ✅ 支持日志级别过滤

#### 使用技巧
1. **搜索日志**：
   - 在 Console 中按 `Ctrl+F` (Windows/Linux) 或 `Cmd+F` (Mac)
   - 输入关键词搜索

2. **过滤日志**：
   - 点击 Console 右侧的过滤器图标
   - 选择日志级别（INFO/DEBUG/ERROR）

3. **清空日志**：
   - 点击 Console 右侧的清空图标 🗑️
   - 或右键选择 `Clear All`

### 2. 日志文件（持久化）

#### 日志文件位置
```
miniapp-backend/
  └── logs/
      ├── miniapp-backend.log          # 当前日志
      └── miniapp-backend.2025-11-06.log  # 历史日志（按日期）
```

#### 在 IDEA 中查看日志文件

**方法一：直接打开文件**
1. 使用快捷键：`Ctrl+Shift+N` (Windows/Linux) 或 `Cmd+Shift+O` (Mac)
2. 输入 `miniapp-backend.log`
3. 打开文件即可查看

**方法二：在项目树中打开**
1. 在项目树中导航到 `miniapp-backend/logs/`
2. 双击 `miniapp-backend.log` 文件
3. 如果文件很大，IDEA 会提示是否加载全部内容

**方法三：实时监控日志文件**
1. 打开日志文件后
2. 点击文件右上角的 `Auto-scroll to Source` 图标（自动滚动）
3. 或使用快捷键：`Ctrl+F` 搜索，然后按 `F3` 跳转

#### 使用终端查看日志（推荐）

**实时查看日志**：
```bash
cd miniapp-backend
tail -f logs/miniapp-backend.log
```

**查看最后 N 行**：
```bash
tail -n 100 logs/miniapp-backend.log
```

**使用项目提供的脚本**：
```bash
cd miniapp-backend
./查看日志.sh
```

### 3. 日志级别说明

根据 `logback-spring.xml` 配置：

| 日志级别 | 说明 | 输出内容 |
|---------|------|---------|
| **TRACE** | 最详细 | SQL语句、参数、结果集 |
| **DEBUG** | 调试信息 | 业务逻辑、方法调用 |
| **INFO** | 一般信息 | 启动信息、重要操作 |
| **WARN** | 警告信息 | 潜在问题 |
| **ERROR** | 错误信息 | 异常、错误 |

**当前配置**：
- `com.stylemirror.miniapp_backend.*` → **DEBUG**
- `com.stylemirror.miniapp_backend.repository.*` → **TRACE** (SQL日志)
- 根日志 → **INFO**

### 4. 日志格式说明

**控制台日志格式**：
```
2025-11-06 15:30:45.123 DEBUG [http-nio-8081-exec-1] c.s.m.c.a.AdminUserController - 查询用户列表，页码: 0, 每页: 20
```

**文件日志格式**：
```
2025-11-06 15:30:45.123 DEBUG [http-nio-8081-exec-1] c.s.m.controller.admin.AdminUserController - 查询用户列表，页码: 0, 每页: 20
```

**格式说明**：
- `2025-11-06 15:30:45.123` - 时间戳
- `DEBUG` - 日志级别
- `[http-nio-8081-exec-1]` - 线程名
- `c.s.m.c.a.AdminUserController` - 类名（简化）
- `查询用户列表...` - 日志消息

## 🔍 常见问题排查

### 1. 启动失败

**检查点**：
- ✅ JDK 版本是否为 17
- ✅ Maven 依赖是否下载完成
- ✅ MySQL 服务是否启动
- ✅ 数据库连接配置是否正确
- ✅ 端口 8081 是否被占用

**查看错误日志**：
- 在 IDEA Console 中查看红色错误信息
- 或查看 `logs/miniapp-backend.log` 文件

### 2. 日志不显示

**检查点**：
- ✅ `logback-spring.xml` 文件是否存在
- ✅ 日志级别配置是否正确
- ✅ `logs/` 目录是否有写入权限

### 3. 日志文件太大

**解决方案**：
- 日志文件按天自动滚动
- 历史日志保留 30 天
- 可以手动删除旧日志文件

### 4. 查看 SQL 日志

**配置**：
- SQL 日志级别已设置为 `TRACE`
- 在 Console 中搜索 `Preparing:` 或 `Parameters:`
- 或查看日志文件中的 SQL 语句

## 📝 快速参考

### 启动项目
```
右键 MiniappBackendApplication.java → Run
或
Maven → spring-boot → spring-boot:run
```

### 查看日志
```
1. IDEA Console（实时）
2. logs/miniapp-backend.log（文件）
3. tail -f logs/miniapp-backend.log（终端实时）
```

### 停止项目
```
在 Run 窗口中点击停止按钮 ⏹️
或按 Ctrl+C
```

### 重启项目
```
在 Run 窗口中点击重启按钮 🔄
或按 Ctrl+F5
```

## 🎯 最佳实践

1. **开发时**：使用 IDEA Console 查看实时日志
2. **调试时**：在代码中添加 `log.debug()` 语句
3. **生产时**：查看日志文件 `logs/miniapp-backend.log`
4. **排查问题**：使用 `tail -f` 实时监控日志
5. **搜索日志**：使用 `grep` 或 IDEA 的搜索功能

## 📚 相关文档

- [运行说明](./README-运行说明.md)
- [查看日志脚本](./查看日志.sh)
- [环境变量配置](./环境变量配置说明.md)

