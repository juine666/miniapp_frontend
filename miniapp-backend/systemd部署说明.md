# Systemd Service 部署说明

## 概述

使用 systemd service 管理应用，可以：
- 自动启动和重启
- 统一管理环境变量
- 方便查看日志
- 更好的系统集成

## 部署步骤

### 1. 准备服务文件

```bash
cd miniapp-backend
# 编辑服务文件，修改配置
vim miniapp-backend.service
```

**重要配置项：**
- `User`: 运行服务的用户（建议使用非root用户）
- `WorkingDirectory`: 应用工作目录
- `ExecStart`: JAR文件路径
- 所有 `Environment` 变量：根据实际情况修改

### 2. 复制服务文件到系统目录

```bash
# 复制服务文件
sudo cp miniapp-backend.service /etc/systemd/system/

# 或者使用软链接（推荐，便于更新）
sudo ln -s /opt/miniapp_frontend/miniapp-backend/miniapp-backend.service /etc/systemd/system/
```

### 3. 修改服务文件中的配置

编辑服务文件：
```bash
sudo vim /etc/systemd/system/miniapp-backend.service
```

**必须修改的配置：**
1. `User`: 改为实际运行用户（如：`www-data`、`miniapp` 等）
2. `WorkingDirectory`: 改为实际路径
3. `ExecStart`: 改为实际JAR文件路径
4. 所有环境变量的值：填入真实配置

**生成安全的 JWT Secret：**
```bash
openssl rand -base64 64
# 或
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 4. 重新加载 systemd 配置

```bash
sudo systemctl daemon-reload
```

### 5. 启动服务

```bash
# 启动服务
sudo systemctl start miniapp-backend

# 设置开机自启
sudo systemctl enable miniapp-backend

# 查看状态
sudo systemctl status miniapp-backend
```

### 6. 常用操作命令

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
sudo journalctl -u miniapp-backend -f

# 查看最近100行日志
sudo journalctl -u miniapp-backend -n 100

# 查看今天的日志
sudo journalctl -u miniapp-backend --since today

# 查看错误日志
sudo journalctl -u miniapp-backend -p err

# 禁用开机自启
sudo systemctl disable miniapp-backend

# 重新加载服务配置（修改服务文件后）
sudo systemctl daemon-reload
sudo systemctl restart miniapp-backend
```

## 更新应用

### 方式1：重新构建并重启

```bash
# 1. 拉取最新代码
cd /opt/miniapp_frontend/miniapp-backend
git pull

# 2. 重新构建
mvn clean package -DskipTests

# 3. 重启服务
sudo systemctl restart miniapp-backend

# 4. 查看日志确认启动成功
sudo journalctl -u miniapp-backend -f
```

### 方式2：使用脚本

创建更新脚本 `update.sh`：

```bash
#!/bin/bash
cd /opt/miniapp_frontend/miniapp-backend
git pull
mvn clean package -DskipTests
sudo systemctl restart miniapp-backend
echo "应用已更新并重启"
```

然后：
```bash
chmod +x update.sh
./update.sh
```

## 安全建议

### 1. 使用非root用户运行

创建专用用户：
```bash
# 创建用户
sudo useradd -r -s /bin/false miniapp

# 修改服务文件
sudo vim /etc/systemd/system/miniapp-backend.service
# 将 User=root 改为 User=miniapp

# 设置文件权限
sudo chown -R miniapp:miniapp /opt/miniapp_frontend/miniapp-backend

# 重新加载并重启
sudo systemctl daemon-reload
sudo systemctl restart miniapp-backend
```

### 2. 保护服务文件权限

```bash
# 设置服务文件权限（只有root可读写）
sudo chmod 600 /etc/systemd/system/miniapp-backend.service
```

### 3. 限制日志大小

在服务文件中添加：
```ini
[Service]
# 限制日志大小为100MB
StandardOutput=journal
StandardError=journal
```

然后在 `/etc/systemd/journald.conf` 中配置：
```ini
SystemMaxUse=100M
```

## 故障排查

### 服务无法启动

1. 查看详细错误：
```bash
sudo systemctl status miniapp-backend -l
sudo journalctl -u miniapp-backend -n 50
```

2. 检查JAR文件是否存在：
```bash
ls -lh /opt/miniapp_frontend/miniapp-backend/target/miniapp-backend-0.0.1-SNAPSHOT.jar
```

3. 检查Java是否安装：
```bash
java -version
which java
```

4. 检查环境变量：
```bash
sudo systemctl show miniapp-backend | grep Environment
```

### 服务频繁重启

1. 查看日志找出错误原因：
```bash
sudo journalctl -u miniapp-backend -p err -n 50
```

2. 检查内存是否足够：
```bash
free -h
```

3. 检查端口是否被占用：
```bash
sudo netstat -tlnp | grep 8081
```

### 环境变量未生效

1. 确认服务文件已重新加载：
```bash
sudo systemctl daemon-reload
sudo systemctl restart miniapp-backend
```

2. 验证环境变量：
```bash
sudo systemctl show miniapp-backend | grep DATASOURCE_URL
```

## 示例：完整的部署流程

```bash
# 1. 进入项目目录
cd /opt/miniapp_frontend/miniapp-backend

# 2. 复制服务文件
sudo cp miniapp-backend.service /etc/systemd/system/

# 3. 编辑服务文件，修改配置
sudo vim /etc/systemd/system/miniapp-backend.service

# 4. 生成JWT Secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"
# 将生成的密钥填入服务文件的 JWT_SECRET 环境变量

# 5. 重新加载systemd
sudo systemctl daemon-reload

# 6. 启动服务
sudo systemctl start miniapp-backend

# 7. 设置开机自启
sudo systemctl enable miniapp-backend

# 8. 查看状态
sudo systemctl status miniapp-backend

# 9. 查看日志
sudo journalctl -u miniapp-backend -f
```

## 注意事项

1. **JWT Secret**: 必须使用安全的随机字符串，不要使用默认值
2. **数据库密码**: 确保使用强密码
3. **文件路径**: 确保所有路径都是绝对路径
4. **用户权限**: 确保运行用户有权限访问所需的文件和目录
5. **日志管理**: 定期清理日志，避免占用过多磁盘空间

