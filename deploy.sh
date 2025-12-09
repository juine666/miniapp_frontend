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

# 启动后端服务
echo "🔧 启动后端服务..."
# 杀掉可能存在的旧进程
pids=$(ps aux | grep "miniapp-backend" | grep -v grep | awk '{print $2}')
if [ -n "$pids" ]; then
    echo "_kill old processes: $pids"
    kill -9 $pids 2>/dev/null || echo "Warning: Could not kill some processes"
fi

# 等待旧进程完全退出
sleep 2

# 启动新服务
nohup java -jar $JAR_FILE > $APP_DIR/miniapp-backend/logs/miniapp-backend.log 2>&1 &
disown

echo "✅ 后端服务已在后台启动！"
echo "📊 查看日志: tail -f $APP_DIR/miniapp-backend/logs/miniapp-backend.log"

# 启动前端管理项目
echo "🚀 启动前端管理项目..."
cd $APP_DIR/admin-frontend

# 安装依存関係
echo "📦 安装前端依赖..."
npm install

# 构建前端项目
echo "🔨 构建前端项目..."
export NODE_ENV=production
npm run build

# 杀掉占用5173端口的进程（前端开发服务器）
echo "🔌 杀掉占用5173端口的进程..."
port_pids_5173=$(lsof -ti:5173 2>/dev/null || echo "")
if [ -n "$port_pids_5173" ]; then
    echo "找到占用5173端口的进程: $port_pids_5173"
    for pid in $port_pids_5173; do
        sudo kill -9 $pid 2>/dev/null || echo "警告: 无法杀掉占用5173端口的进程 $pid"
    done
    echo "已尝试杀掉占用5173端口的进程"
else
    echo "未找到占用5173端口的进程"
fi

# 等待一段时间让进程完全结束
sleep 2

# 启动前端开发服务器（后台执行）
echo "▶️ 启动前端开发服务器..."
nohup npm run dev > /tmp/admin-frontend.log 2>&1 &

echo "✅ 前端管理项目已在后台启动！"
echo "📝 前端日志文件: /tmp/admin-frontend.log"
echo "🌐 访问地址: https://fxyw.work:5173/"
echo "👤 登录凭证: 用户名: admin, 密码: admin123"

echo "🎉 部署完成！"