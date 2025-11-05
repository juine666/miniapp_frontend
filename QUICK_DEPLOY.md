# 快速部署指南（简化版）

## 🚀 一键部署步骤

### 1. 登录服务器
```bash
ssh user@your-server-ip
```

### 2. 安装基础环境（首次部署）

```bash
# 安装JDK 17
sudo apt-get update
sudo apt-get install openjdk-17-jdk -y

# 安装MySQL
sudo apt-get install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql

# 安装Redis
sudo apt-get install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis

# 安装Git和Maven
sudo apt-get install git maven -y
```

### 3. 配置数据库

```bash
mysql -u root -p

# 在MySQL中执行
CREATE DATABASE miniapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'miniapp_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON miniapp.* TO 'miniapp_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. 部署应用

```bash
# 创建目录
sudo mkdir -p /opt/miniapp-backend
sudo chown $USER:$USER /opt/miniapp-backend
cd /opt/miniapp-backend

# 克隆代码
git clone git@github.com:juine666/miniapp_frontend.git .

# 进入后端目录
cd miniapp-backend

# 编译打包
mvn clean package -DskipTests
```

### 5. 配置应用

```bash
# 复制配置文件
cp src/main/resources/application.yml.example src/main/resources/application.yml

# 编辑配置（修改数据库、Redis、微信、OSS等配置）
vim src/main/resources/application.yml
```

### 6. 创建systemd服务

```bash
sudo cat > /etc/systemd/system/miniapp-backend.service << 'EOF'
[Unit]
Description=StyleMirror MiniApp Backend
After=network.target mysql.service redis.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/miniapp-backend/miniapp-backend
ExecStart=/usr/bin/java -jar -Xms512m -Xmx1024m /opt/miniapp-backend/miniapp-backend/target/miniapp-backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 替换用户名
sudo sed -i "s/your_username/$USER/g" /etc/systemd/system/miniapp-backend.service

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start miniapp-backend
sudo systemctl enable miniapp-backend

# 查看状态
sudo systemctl status miniapp-backend
```

### 7. 配置防火墙

```bash
sudo ufw allow 8081/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 8. 验证部署

```bash
# 检查服务状态
sudo systemctl status miniapp-backend

# 测试API
curl http://localhost:8081/api/categories

# 查看日志
sudo journalctl -u miniapp-backend -f
```

## 🔄 更新应用

```bash
cd /opt/miniapp-backend
git pull origin main
cd miniapp-backend
mvn clean package -DskipTests
sudo systemctl restart miniapp-backend
```

## 📋 配置清单

确保以下配置已正确设置：

- [ ] 数据库连接（localhost:3306/miniapp）
- [ ] Redis连接（localhost:6379）
- [ ] 微信小程序AppID和Secret
- [ ] OSS AccessKey和Secret
- [ ] JWT密钥（至少32位随机字符串）

## 🔍 故障排查

```bash
# 查看服务日志
sudo journalctl -u miniapp-backend -n 100

# 查看应用日志
tail -f /opt/miniapp-backend/miniapp-backend/logs/miniapp-backend.log

# 检查端口
netstat -tlnp | grep 8081

# 测试数据库连接
mysql -u miniapp_user -p miniapp

# 测试Redis连接
redis-cli ping
```

