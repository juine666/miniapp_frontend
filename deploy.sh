#!/bin/bash
# 一键部署脚本

set -e

APP_DIR="/opt/miniapp_frontend"
APP_NAME="miniapp-backend"
SERVICE_NAME="miniapp-backend"

echo "🚀 开始部署 $APP_NAME..."

# 检查目录是否存在
if [ ! -d "$APP_DIR" ]; then
    echo "📁 创建应用目录: $APP_DIR"
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
fi

# 进入应用目录
cd $APP_DIR

# 拉取最新代码
if [ -d ".git" ]; then
    echo "📥 拉取最新代码..."
    git pull origin main
else
    echo "📥 克隆代码仓库..."
    git clone https://github.com/juine666/miniapp_frontend.git .
fi

# 杀掉原来运行的程序
echo "🔪 杀掉原来运行的程序..."
pids=$(ps aux | grep "miniapp-backend" | grep -v grep | awk '{print $2}')
if [ -n "$pids" ]; then
    echo "找到运行中的进程: $pids"
    for pid in $pids; do
        sudo kill -9 $pid 2>/dev/null || echo "警告: 无法杀掉进程 $pid"
    done
    echo "已尝试杀掉原有进程"
else
    echo "未找到运行中的进程"
fi

# 杀掉占用8080端口的进程
echo "🔌 杀掉占用8080端口的进程..."
port_pids_8080=$(lsof -ti:8080 2>/dev/null || echo "")
if [ -n "$port_pids_8080" ]; then
    echo "找到占用8080端口的进程: $port_pids_8080"
    for pid in $port_pids_8080; do
        sudo kill -9 $pid 2>/dev/null || echo "警告: 无法杀掉占用8080端口的进程 $pid"
    done
    echo "已尝试杀掉占用8080端口的进程"
else
    echo "未找到占用8080端口的进程"
fi

# 杀掉占用8081端口的进程
echo "🔌 杀掉占用8081端口的进程..."
port_pids_8081=$(lsof -ti:8081 2>/dev/null || echo "")
if [ -n "$port_pids_8081" ]; then
    echo "找到占用8081端口的进程: $port_pids_8081"
    for pid in $port_pids_8081; do
        sudo kill -9 $pid 2>/dev/null || echo "警告: 无法杀掉占用8081端口的进程 $pid"
    done
    echo "已尝试杀掉占用8081端口的进程"
else
    echo "未找到占用8081端口的进程"
fi

# 等待一段时间让进程完全退出
sleep 2

# 进入后端目录
cd $APP_DIR/miniapp-backend

# 编译打包
echo "🔨 编译打包..."
mvn clean package -DskipTests

# 检查jar包是否存在
JAR_FILE=$(find target -name "*.jar" -not -name "*-sources.jar" | head -1)
if [ -z "$JAR_FILE" ]; then
    echo "❌ 未找到jar包，编译失败！"
    exit 1
fi

echo "✅ 编译成功: $JAR_FILE"

# 检查配置文件
if [ ! -f "src/main/resources/application.yml" ]; then
    echo "⚙️  创建配置文件..."
    cp src/main/resources/application.yml.example src/main/resources/application.yml
    echo "⚠️  请编辑配置文件: src/main/resources/application.yml"
fi

# 创建日志目录
mkdir -p logs

# 检查服务文件是否存在
if [ ! -f "/etc/systemd/system/$SERVICE_NAME.service" ]; then
    echo "サービスファイルを作成します..."
    sudo cp $APP_DIR/miniapp-backend.service /etc/systemd/system/$SERVICE_NAME.service
    sudo systemctl daemon-reload
else
    # 更新服务文件
    sudo cp $APP_DIR/miniapp-backend.service /etc/systemd/system/$SERVICE_NAME.service
    sudo systemctl daemon-reload
fi

# 重启服务
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "🔄 重启服务..."
    sudo systemctl restart $SERVICE_NAME
else
    echo "▶️  启动服务..."
    sudo systemctl start $SERVICE_NAME
fi

# 等待服务启动
sleep 3

# 检查服务状态
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ 服务运行正常！"
    echo "📊 查看日志: sudo journalctl -u $SERVICE_NAME -f"
    echo "📝 日志文件路径: $APP_DIR/miniapp-backend/logs/miniapp-backend.log"
else
    echo "❌ 服务启动失败！"
    echo "📋 查看错误日志: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo "🎉 部署完成！"