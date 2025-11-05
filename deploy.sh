#!/bin/bash
# 一键部署脚本

set -e

APP_DIR="/opt/miniapp-backend"
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
    git clone git@github.com:juine666/miniapp_frontend.git .
fi

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
else
    echo "❌ 服务启动失败！"
    echo "📋 查看错误日志: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo "🎉 部署完成！"

