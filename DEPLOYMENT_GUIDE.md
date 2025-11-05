# 服务器部署配置指南

## 📋 部署前准备

### 1. 复制配置文件
```bash
cd miniapp-backend/src/main/resources/
cp application.yml.example application.yml
```

### 2. 必须配置的项（部署到服务器必须修改）

#### ✅ 数据库配置（必须）
```yaml
spring:
  datasource:
    url: jdbc:mysql://你的数据库地址:3306/数据库名?useSSL=false&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: 数据库用户名
    password: 数据库密码
```

或者使用环境变量：
```bash
export DATASOURCE_URL=jdbc:mysql://服务器IP:3306/miniapp?useSSL=false&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
export DATASOURCE_USERNAME=your_db_user
export DATASOURCE_PASSWORD=your_db_password
```

#### ✅ OSS配置（必须 - 文件上传功能需要）
```yaml
oss:
  endpoint: oss-cn-shenzhen.aliyuncs.com  # 你的OSS区域
  accessKeyId: 你的AccessKey ID
  accessKeySecret: 你的AccessKey Secret
  bucket: 你的bucket名称
  publicBaseUrl: https://你的bucket.oss-cn-shenzhen.aliyuncs.com
```

#### ✅ 微信小程序配置（必须 - 小程序功能需要）
```yaml
wechat:
  appid: 你的微信小程序AppID
  secret: 你的微信小程序Secret
```

#### ✅ JWT密钥（必须 - 安全相关）
```yaml
security:
  jwt:
    secret: 生成一个长随机字符串（至少32位）
```

生成JWT密钥：
```bash
# Linux/Mac
openssl rand -base64 32

# 或者使用在线工具生成随机字符串
```

### 3. 可选配置项

#### ⚙️ 服务器端口（可选，默认8081）
```yaml
server:
  port: 8081  # 根据服务器情况修改
```

#### ⚙️ 日志级别（生产环境建议修改）
```yaml
logging:
  level:
    root: INFO  # 生产环境建议改为INFO或WARN
    com.stylemirror.miniapp_backend: INFO  # 生产环境改为INFO，减少日志量
```

#### ⚙️ 管理员账号（可选）
```yaml
admin:
  defaultUsername: admin
  defaultPassword: 修改为强密码
```

#### ⚙️ 微信支付配置（如果启用真实支付）
```yaml
wechat:
  pay:
    mock-mode: false  # 改为false启用真实支付
    mchid: 你的商户号
    api-key: 你的API密钥
    cert-path: 证书路径
```

## 🚀 部署步骤

### 方式1：使用环境变量（推荐）

1. **创建环境变量文件**
```bash
# 在服务器上创建 .env 文件
cat > /path/to/app/.env << EOF
DATASOURCE_URL=jdbc:mysql://localhost:3306/miniapp?useSSL=false&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
DATASOURCE_USERNAME=root
DATASOURCE_PASSWORD=your_password
OSS_ENDPOINT=oss-cn-shenzhen.aliyuncs.com
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_PUBLIC_BASE_URL=https://your_bucket.oss-cn-shenzhen.aliyuncs.com
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret
JWT_SECRET=your_long_random_secret
EOF
```

2. **启动时加载环境变量**
```bash
# 使用systemd或supervisor启动时加载环境变量
source .env
java -jar miniapp-backend.jar
```

### 方式2：直接修改 application.yml

1. **复制示例文件**
```bash
cp application.yml.example application.yml
```

2. **编辑配置文件**
```bash
vim application.yml
# 修改上述必须配置的项
```

3. **确保配置文件不被提交到Git**
```bash
# .gitignore 已配置忽略 application.yml
git status  # 确认 application.yml 不在跟踪列表中
```

## 📝 最小化配置检查清单

部署到服务器前，确保以下配置已修改：

- [ ] 数据库连接地址、用户名、密码
- [ ] OSS AccessKey ID 和 Secret
- [ ] OSS Bucket 名称和公共URL
- [ ] 微信小程序 AppID 和 Secret
- [ ] JWT Secret（安全密钥）
- [ ] 服务器端口（如需要）
- [ ] 日志级别（生产环境建议INFO）

## 🔒 安全建议

1. **不要将 application.yml 提交到Git**
   - 已在 `.gitignore` 中配置
   - 使用 `application.yml.example` 作为模板

2. **使用环境变量**
   - 更安全，配置与代码分离
   - 适合Docker、K8s等容器化部署

3. **生产环境设置**
   - 日志级别改为 INFO 或 WARN
   - JWT密钥使用强随机字符串
   - 数据库密码使用强密码
   - 禁用Swagger（可选）

## 🐳 Docker部署示例

```dockerfile
# Dockerfile
FROM openjdk:17-jdk-slim
COPY miniapp-backend.jar app.jar
ENV DATASOURCE_URL=jdbc:mysql://db:3306/miniapp
ENV DATASOURCE_USERNAME=root
ENV DATASOURCE_PASSWORD=password
# ... 其他环境变量
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```yaml
# docker-compose.yml
version: '3'
services:
  backend:
    build: .
    environment:
      - DATASOURCE_URL=jdbc:mysql://db:3306/miniapp
      - DATASOURCE_USERNAME=root
      - DATASOURCE_PASSWORD=${DB_PASSWORD}
      # ... 其他环境变量
    ports:
      - "8081:8081"
```

## 📞 常见问题

### Q: 只需要修改数据库配置就可以了吗？
A: **不行**，至少还需要配置：
- OSS配置（文件上传功能）
- 微信配置（小程序登录和API调用）
- JWT密钥（安全认证）

### Q: 不配置OSS会怎样？
A: 文件上传功能会失败，商品图片无法上传

### Q: 不配置微信会怎样？
A: 小程序无法登录，微信相关功能不可用

### Q: 如何验证配置是否正确？
A: 启动应用后，检查日志是否有连接错误，访问健康检查接口测试

