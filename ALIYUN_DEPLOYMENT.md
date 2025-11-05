# 阿里云服务器部署指南

## 📋 前置准备

### 1. 服务器要求
- 操作系统：CentOS 7+ / Ubuntu 18.04+ / Alibaba Cloud Linux
- 内存：建议 2GB 以上
- CPU：建议 2核 以上
- 磁盘：建议 20GB 以上

### 2. 需要安装的软件
- JDK 17+（运行Java应用）
- MySQL 8.0+（数据库）
- Redis 6.0+（缓存）
- Nginx（可选，用于反向代理）
- Git（用于拉取代码）

## 🚀 部署步骤

### 步骤1：服务器环境准备

#### 1.1 更新系统（Ubuntu）
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### 1.2 安装JDK 17
```bash
# Ubuntu
sudo apt-get install openjdk-17-jdk -y

# CentOS/Alibaba Cloud Linux
sudo yum install java-17-openjdk java-17-openjdk-devel -y

# 验证安装
java -version
```

#### 1.3 安装MySQL
```bash
# Ubuntu
sudo apt-get install mysql-server -y

# CentOS/Alibaba Cloud Linux
sudo yum install mysql-server -y

# 启动MySQL
sudo systemctl start mysqld
sudo systemctl enable mysqld

# 安全配置（设置root密码）
sudo mysql_secure_installation
```

#### 1.4 安装Redis
```bash
# Ubuntu
sudo apt-get install redis-server -y

# CentOS/Alibaba Cloud Linux
sudo yum install redis -y

# 启动Redis
sudo systemctl start redis
sudo systemctl enable redis

# 验证Redis
redis-cli ping
```

#### 1.5 安装Git和Maven
```bash
# Ubuntu
sudo apt-get install git maven -y

# CentOS/Alibaba Cloud Linux
sudo yum install git maven -y
```

### 步骤2：配置数据库

```bash
# 登录MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE miniapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户（可选，推荐）
CREATE USER 'miniapp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON miniapp.* TO 'miniapp_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 步骤3：部署应用代码

#### 方式1：从GitHub拉取（推荐）

```bash
# 创建应用目录
sudo mkdir -p /opt/miniapp-backend
sudo chown $USER:$USER /opt/miniapp-backend
cd /opt/miniapp-backend

# 克隆代码
git clone git@github.com:juine666/miniapp_frontend.git .

# 进入后端目录
cd miniapp-backend

# 编译打包
mvn clean package -DskipTests

# 生成的jar包位置
ls -lh target/miniapp-backend-*.jar
```

#### 方式2：上传本地构建的jar包

```bash
# 在本地构建
cd miniapp-backend
mvn clean package -DskipTests

# 使用scp上传到服务器
scp target/miniapp-backend-0.0.1-SNAPSHOT.jar user@your-server-ip:/opt/miniapp-backend/
```

### 步骤4：配置应用

```bash
cd /opt/miniapp-backend/miniapp-backend

# 复制配置文件
cp src/main/resources/application.yml.example src/main/resources/application.yml

# 编辑配置文件
vim src/main/resources/application.yml
```

**配置内容示例：**

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/miniapp?useSSL=false&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: miniapp_user
    password: your_db_password
  data:
    redis:
      host: localhost
      port: 6379
      password:  # 如果有密码
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

### 步骤5：创建启动脚本

```bash
# 创建启动脚本
cat > /opt/miniapp-backend/start.sh << 'EOF'
#!/bin/bash
cd /opt/miniapp-backend/miniapp-backend
nohup java -jar -Xms512m -Xmx1024m target/miniapp-backend-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  > logs/app.log 2>&1 &
echo $! > /opt/miniapp-backend/app.pid
echo "应用已启动，PID: $(cat /opt/miniapp-backend/app.pid)"
EOF

chmod +x /opt/miniapp-backend/start.sh

# 创建停止脚本
cat > /opt/miniapp-backend/stop.sh << 'EOF'
#!/bin/bash
if [ -f /opt/miniapp-backend/app.pid ]; then
    PID=$(cat /opt/miniapp-backend/app.pid)
    kill $PID
    rm /opt/miniapp-backend/app.pid
    echo "应用已停止"
else
    echo "应用未运行"
fi
EOF

chmod +x /opt/miniapp-backend/stop.sh

# 创建日志目录
mkdir -p /opt/miniapp-backend/miniapp-backend/logs
```

### 步骤6：使用systemd管理服务（推荐）

```bash
# 创建systemd服务文件
sudo cat > /etc/systemd/system/miniapp-backend.service << 'EOF'
[Unit]
Description=StyleMirror MiniApp Backend
After=network.target mysql.service redis.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/miniapp-backend/miniapp-backend
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1024m /opt/miniapp-backend/miniapp-backend/target/miniapp-backend-0.0.1-SNAPSHOT.jar
ExecStop=/bin/kill -15 $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 替换your_username为实际用户名
sudo sed -i 's/your_username/'"$USER"'/g' /etc/systemd/system/miniapp-backend.service

# 重新加载systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start miniapp-backend

# 设置开机自启
sudo systemctl enable miniapp-backend

# 查看状态
sudo systemctl status miniapp-backend

# 查看日志
sudo journalctl -u miniapp-backend -f
```

### 步骤7：配置Nginx反向代理（可选）

```bash
# 安装Nginx
sudo apt-get install nginx -y  # Ubuntu
# 或
sudo yum install nginx -y  # CentOS

# 创建Nginx配置
sudo cat > /etc/nginx/sites-available/miniapp-backend << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    location / {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持（如果需要）
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# CentOS需要创建到conf.d目录
# sudo cp /etc/nginx/sites-available/miniapp-backend /etc/nginx/conf.d/miniapp-backend.conf

# 启用配置（Ubuntu）
sudo ln -s /etc/nginx/sites-available/miniapp-backend /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 步骤8：配置防火墙

```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8081/tcp  # 如果需要直接访问
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=8081/tcp
sudo firewall-cmd --reload
```

### 步骤9：配置SSL证书（HTTPS，可选）

```bash
# 使用Let's Encrypt免费证书
sudo apt-get install certbot python3-certbot-nginx -y

# 申请证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 🔧 环境变量方式（推荐）

如果使用环境变量，创建环境变量文件：

```bash
cat > /opt/miniapp-backend/.env << 'EOF'
DATASOURCE_URL=jdbc:mysql://localhost:3306/miniapp?useSSL=false&useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
DATASOURCE_USERNAME=miniapp_user
DATASOURCE_PASSWORD=your_db_password
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret
OSS_ENDPOINT=oss-cn-shenzhen.aliyuncs.com
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_PUBLIC_BASE_URL=https://your_bucket.oss-cn-shenzhen.aliyuncs.com
JWT_SECRET=your_long_random_secret
EOF

chmod 600 /opt/miniapp-backend/.env
```

修改systemd服务文件，加载环境变量：

```bash
sudo cat > /etc/systemd/system/miniapp-backend.service << 'EOF'
[Unit]
Description=StyleMirror MiniApp Backend
After=network.target mysql.service redis.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/miniapp-backend/miniapp-backend
EnvironmentFile=/opt/miniapp-backend/.env
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1024m /opt/miniapp-backend/miniapp-backend/target/miniapp-backend-0.0.1-SNAPSHOT.jar
ExecStop=/bin/kill -15 $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
```

## 📊 验证部署

### 1. 检查服务状态
```bash
# 检查应用是否运行
sudo systemctl status miniapp-backend

# 检查端口是否监听
netstat -tlnp | grep 8081
# 或
ss -tlnp | grep 8081
```

### 2. 测试API
```bash
# 健康检查（如果有健康检查接口）
curl http://localhost:8081/actuator/health

# 测试API
curl http://localhost:8081/api/categories
```

### 3. 查看日志
```bash
# systemd日志
sudo journalctl -u miniapp-backend -f

# 应用日志
tail -f /opt/miniapp-backend/miniapp-backend/logs/miniapp-backend.log
```

## 🔄 更新部署

### 方式1：Git拉取更新
```bash
cd /opt/miniapp-backend
git pull origin main
cd miniapp-backend
mvn clean package -DskipTests
sudo systemctl restart miniapp-backend
```

### 方式2：上传新jar包
```bash
# 停止服务
sudo systemctl stop miniapp-backend

# 备份旧jar包
cp target/miniapp-backend-0.0.1-SNAPSHOT.jar target/miniapp-backend-0.0.1-SNAPSHOT.jar.bak

# 上传新jar包（使用scp或FTP）

# 启动服务
sudo systemctl start miniapp-backend
```

## 🛠️ 常用管理命令

```bash
# 启动服务
sudo systemctl start miniapp-backend

# 停止服务
sudo systemctl stop miniapp-backend

# 重启服务
sudo systemctl restart miniapp-backend

# 查看状态
sudo systemctl status miniapp-backend

# 查看日志
sudo journalctl -u miniapp-backend -n 100 -f

# 查看实时日志
tail -f /opt/miniapp-backend/miniapp-backend/logs/miniapp-backend.log
```

## 🔒 安全建议

1. **修改SSH端口**（避免使用22端口）
2. **禁用root登录**
3. **配置防火墙规则**
4. **定期更新系统**
5. **配置日志轮转**（避免日志文件过大）
6. **使用HTTPS**（配置SSL证书）
7. **定期备份数据库**

## 📝 部署检查清单

- [ ] JDK 17已安装
- [ ] MySQL已安装并创建数据库
- [ ] Redis已安装并运行
- [ ] 应用代码已部署
- [ ] 配置文件已正确设置
- [ ] systemd服务已配置
- [ ] 应用已启动并运行正常
- [ ] 防火墙端口已开放
- [ ] Nginx已配置（如需要）
- [ ] SSL证书已配置（如需要）
- [ ] 日志可以正常查看

## 🐛 常见问题

### 1. 应用启动失败
```bash
# 查看详细错误日志
sudo journalctl -u miniapp-backend -n 50
```

### 2. 数据库连接失败
- 检查MySQL是否运行：`sudo systemctl status mysqld`
- 检查用户名密码是否正确
- 检查数据库是否存在

### 3. Redis连接失败
- 检查Redis是否运行：`sudo systemctl status redis`
- 测试连接：`redis-cli ping`

### 4. 端口被占用
```bash
# 查看端口占用
sudo lsof -i :8081
# 或
sudo netstat -tlnp | grep 8081
```

## 📞 快速部署脚本

可以创建一个一键部署脚本：

```bash
#!/bin/bash
# deploy.sh - 一键部署脚本

echo "开始部署..."

# 1. 拉取代码
cd /opt/miniapp-backend
git pull origin main

# 2. 编译打包
cd miniapp-backend
mvn clean package -DskipTests

# 3. 重启服务
sudo systemctl restart miniapp-backend

# 4. 等待服务启动
sleep 5

# 5. 检查状态
sudo systemctl status miniapp-backend

echo "部署完成！"
```

