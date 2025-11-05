# 宝塔面板部署指南

## 📋 前置条件

- ✅ 服务器已安装宝塔面板
- ✅ JDK 17 已安装
- ✅ MySQL 数据库已配置
- ✅ Redis 已安装（通过宝塔面板）

## 🚀 部署步骤

### 步骤1：安装Redis（如果未安装）

1. 登录宝塔面板
2. 进入 **软件商店**
3. 搜索 **Redis**，点击安装
4. 安装完成后，点击 **设置** → **性能调整**，确认Redis运行正常

### 步骤2：创建网站/应用目录

1. 进入 **网站** → **添加站点**
2. 域名填写：`your-domain.com` 或服务器IP
3. 根目录设置为：`/www/wwwroot/miniapp-backend`
4. PHP版本选择：**纯静态**（因为我们运行Java应用）
5. 点击 **提交**

### 步骤3：上传代码

#### 方式1：通过Git拉取（推荐）

1. 进入 **终端**（宝塔面板左侧菜单）
2. 执行以下命令：

```bash
# 进入网站目录
cd /www/wwwroot/miniapp-backend

# 克隆代码（首次）
git clone git@github.com:juine666/miniapp_frontend.git .

# 或者如果是更新
cd /www/wwwroot/miniapp-backend
git pull origin main
```

#### 方式2：通过宝塔文件管理器上传

1. 进入 **文件** → 找到 `/www/wwwroot/miniapp-backend`
2. 上传项目压缩包
3. 解压文件

### 步骤4：编译项目

1. 进入 **终端**
2. 执行编译命令：

```bash
cd /www/wwwroot/miniapp-backend/miniapp-backend

# 编译打包
mvn clean package -DskipTests

# 查看生成的jar包
ls -lh target/*.jar
```

### 步骤5：配置应用

1. 进入 **文件** → `/www/wwwroot/miniapp-backend/miniapp-backend/src/main/resources/`
2. 复制 `application.yml.example` 为 `application.yml`
3. 编辑 `application.yml`，修改以下配置：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/数据库名?useSSL=false&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: 数据库用户名
    password: 数据库密码
  data:
    redis:
      host: localhost
      port: 6379
      password: Redis密码（如果设置了）
      database: 0

wechat:
  appid: 你的微信小程序AppID
  secret: 你的微信小程序Secret

oss:
  endpoint: oss-cn-shenzhen.aliyuncs.com
  accessKeyId: 你的AccessKey ID
  accessKeySecret: 你的AccessKey Secret
  bucket: 你的bucket名称
  publicBaseUrl: https://你的bucket.oss-cn-shenzhen.aliyuncs.com

security:
  jwt:
    secret: 生成一个长随机字符串（至少32位）
```

### 步骤6：创建启动脚本

1. 进入 **文件** → `/www/wwwroot/miniapp-backend/`
2. 创建新文件 `start.sh`：

```bash
#!/bin/bash
cd /www/wwwroot/miniapp-backend/miniapp-backend
nohup java -jar -Xms512m -Xmx1024m target/miniapp-backend-0.0.1-SNAPSHOT.jar > logs/app.log 2>&1 &
echo $! > /www/wwwroot/miniapp-backend/app.pid
echo "应用已启动，PID: $(cat /www/wwwroot/miniapp-backend/app.pid)"
```

3. 创建 `stop.sh`：

```bash
#!/bin/bash
if [ -f /www/wwwroot/miniapp-backend/app.pid ]; then
    PID=$(cat /www/wwwroot/miniapp-backend/app.pid)
    kill $PID
    rm /www/wwwroot/miniapp-backend/app.pid
    echo "应用已停止"
else
    echo "应用未运行"
fi
```

4. 设置脚本权限：右键文件 → **权限** → 勾选 **执行**

### 步骤7：使用宝塔进程管理器（推荐）

1. 进入 **软件商店** → 搜索 **进程守护管理器** → 安装
2. 打开 **进程守护管理器**
3. 点击 **添加守护进程**
4. 填写配置：

```
名称：miniapp-backend
启动用户：root（或你的用户名）
运行目录：/www/wwwroot/miniapp-backend/miniapp-backend
启动命令：/usr/bin/java -jar -Xms512m -Xmx1024m /www/wwwroot/miniapp-backend/miniapp-backend/target/miniapp-backend-0.0.1-SNAPSHOT.jar
进程数量：1
```

5. 点击 **确定**，然后点击 **启动**

### 步骤8：配置Nginx反向代理

1. 进入 **网站** → 找到你的站点 → 点击 **设置**
2. 进入 **反向代理** 标签
3. 点击 **添加反向代理**
4. 配置如下：

```
代理名称：miniapp-backend
目标URL：http://127.0.0.1:8081
发送域名：$host
```

5. 点击 **提交**

### 步骤9：配置网站（可选 - 如果需要通过80端口访问）

1. 进入 **网站** → 你的站点 → **设置** → **网站目录**
2. 取消勾选 **防跨站攻击(open_basedir)**
3. 进入 **配置文件**，添加以下配置：

```nginx
location / {
    proxy_pass http://127.0.0.1:8081;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # 超时设置
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

4. 点击 **保存**

### 步骤10：配置防火墙

1. 进入 **安全** → **防火墙**
2. 添加端口规则：
   - 端口：`8081`，协议：TCP，备注：Java应用
   - 端口：`80`，协议：TCP，备注：HTTP
   - 端口：`443`，协议：TCP，备注：HTTPS

### 步骤11：验证部署

1. 查看进程是否运行：
   - 进入 **进程守护管理器**，查看状态是否为 **运行中**
   - 或进入 **终端**，执行：`ps aux | grep java`

2. 测试API：
   - 进入 **终端**，执行：`curl http://localhost:8081/api/categories`
   - 或浏览器访问：`http://your-domain.com/api/categories`

3. 查看日志：
   - 进入 **文件** → `/www/wwwroot/miniapp-backend/miniapp-backend/logs/`
   - 查看 `miniapp-backend.log` 或 `app.log`

## 🔄 更新应用

### 方式1：通过终端更新

1. 进入 **终端**
2. 执行：

```bash
cd /www/wwwroot/miniapp-backend
git pull origin main
cd miniapp-backend
mvn clean package -DskipTests
```

3. 在 **进程守护管理器** 中重启应用

### 方式2：通过文件管理器更新

1. 进入 **文件** → `/www/wwwroot/miniapp-backend/`
2. 上传新的jar包到 `miniapp-backend/target/` 目录
3. 在 **进程守护管理器** 中重启应用

## 📊 监控和管理

### 查看日志

1. **应用日志**：
   - 文件管理器 → `/www/wwwroot/miniapp-backend/miniapp-backend/logs/miniapp-backend.log`
   - 或在终端执行：`tail -f /www/wwwroot/miniapp-backend/miniapp-backend/logs/miniapp-backend.log`

2. **进程守护日志**：
   - 进程守护管理器 → 点击应用 → 查看日志

### 重启应用

1. 进入 **进程守护管理器**
2. 找到 `miniapp-backend`
3. 点击 **重启**

### 停止/启动应用

1. 进入 **进程守护管理器**
2. 找到 `miniapp-backend`
3. 点击 **停止** 或 **启动**

## 🔧 宝塔面板配置要点

### 1. MySQL配置

1. 进入 **数据库** → 创建数据库（如果还没有）
2. 记录数据库名、用户名、密码
3. 确保数据库已创建并授权

### 2. Redis配置

1. 进入 **软件商店** → Redis → **设置**
2. 确认Redis运行正常
3. 如有密码，记录密码

### 3. Java环境检查

1. 进入 **终端**
2. 执行：`java -version`，确认JDK 17已安装
3. 执行：`which java`，确认Java路径

### 4. 端口检查

1. 进入 **安全** → **防火墙**
2. 确认8081端口已开放
3. 或在终端执行：`netstat -tlnp | grep 8081`

## 🐛 常见问题

### 1. 应用启动失败

**检查步骤：**
1. 查看进程守护管理器日志
2. 检查jar包是否存在：`ls -lh /www/wwwroot/miniapp-backend/miniapp-backend/target/*.jar`
3. 检查配置文件：`cat /www/wwwroot/miniapp-backend/miniapp-backend/src/main/resources/application.yml`
4. 手动测试启动：`cd /www/wwwroot/miniapp-backend/miniapp-backend && java -jar target/*.jar`

### 2. 数据库连接失败

**检查步骤：**
1. 进入 **数据库**，确认数据库存在
2. 测试数据库连接：`mysql -u用户名 -p数据库名`
3. 检查配置文件中的数据库连接信息

### 3. Redis连接失败

**检查步骤：**
1. 进入 **软件商店** → Redis → **设置**，确认Redis运行中
2. 测试连接：进入终端执行 `redis-cli ping`
3. 检查配置文件中的Redis配置

### 4. 端口被占用

**检查步骤：**
1. 进入终端执行：`netstat -tlnp | grep 8081`
2. 如果有其他进程占用，停止该进程或修改应用端口

### 5. 文件权限问题

**解决方法：**
1. 进入 **文件** → 选中目录 → **权限**
2. 设置为：`755`（目录）或 `644`（文件）
3. 所有者为：`root` 或你的用户名

## 📝 部署检查清单

- [ ] Redis已安装并运行
- [ ] 代码已上传到服务器
- [ ] 项目已编译打包（jar包存在）
- [ ] application.yml已配置
- [ ] 进程守护管理器已配置并启动
- [ ] Nginx反向代理已配置（如需要）
- [ ] 防火墙端口已开放
- [ ] 应用可以正常访问
- [ ] 日志可以正常查看

## 💡 推荐配置

### 进程守护管理器配置

```
名称：miniapp-backend
启动用户：root
运行目录：/www/wwwroot/miniapp-backend/miniapp-backend
启动命令：/usr/bin/java -jar -Xms512m -Xmx1024m /www/wwwroot/miniapp-backend/miniapp-backend/target/miniapp-backend-0.0.1-SNAPSHOT.jar
进程数量：1
自动启动：是
```

### Nginx反向代理配置

```
代理名称：miniapp-backend
目标URL：http://127.0.0.1:8081
发送域名：$host
缓存：关闭
```

### 日志配置

建议配置日志轮转，避免日志文件过大：
1. 进入 **计划任务**
2. 添加 **Shell脚本**
3. 执行周期：每天
4. 脚本内容：

```bash
# 清理7天前的日志
find /www/wwwroot/miniapp-backend/miniapp-backend/logs -name "*.log" -mtime +7 -delete
```

## 🎯 快速部署脚本（宝塔终端）

你也可以在宝塔终端一键执行：

```bash
# 一键部署脚本
cd /www/wwwroot/miniapp-backend && \
git pull origin main && \
cd miniapp-backend && \
mvn clean package -DskipTests && \
echo "编译完成，请在进程守护管理器中重启应用"
```

