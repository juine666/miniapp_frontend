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
        sudo kill -9 $pid 2>/dev/null || echo "警告: 无法杀掉占用8080端口の进程 $pid"
    done
    echo "已尝试杀掉占用8080端口の进程"
else
    echo "未找到占用8080端口の进程"
fi

# 杀掉占用8081端口の进程
echo "🔌 杀掉占用8081端口の进程..."
port_pids_8081=$(lsof -ti:8081 2>/dev/null || echo "")
if [ -n "$port_pids_8081" ]; then
    echo "找到占用8081端口の进程: $port_pids_8081"
    for pid in $port_pids_8081; do
        sudo kill -9 $pid 2>/dev/null || echo "警告: 无法杀掉占用8081端口の进程 $pid"
    done
    echo "已尝试杀掉占用8081端口の进程"
else
    echo "未找到占用8081端口の进程"
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
    echo "⚙️  创建配置ファイル..."
    cp src/main/resources/application.yml.example src/main/resources/application.yml
    echo "⚠️  请编辑配置ファイル: src/main/resources/application.yml"
fi

# 创建日志目录
mkdir -p logs

# 检查服务文件是否存在并更新
echo "🔧 更新サービス配置..."
sudo cp $APP_DIR/miniapp-backend.service /etc/systemd/system/$SERVICE_NAME.service
sudo systemctl daemon-reload

# 重启服务
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "🔄 重启サービス..."
    sudo systemctl restart $SERVICE_NAME
else
    echo "▶️  启動サービス..."
    sudo systemctl start $SERVICE_NAME
fi

# 等待サービス启动
sleep 3

# 检查サービス状態
if systemctl is-active --quiet $SERVICE_NAME; then
    echo "✅ 後端サービス実行正常！"
    echo "📊 查看ログ: sudo journalctl -u $SERVICE_NAME -f"
    echo "📝 ログファイルパス: $APP_DIR/miniapp-backend/logs/miniapp-backend.log"
else
    echo "❌ 後端サービス起動失敗！"
    echo "📋 查看エラーログ: sudo journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

# 启動フロントエンド管理プロジェクト
echo "🚀 启動フロントエンド管理プロジェクト..."
cd $APP_DIR/admin-frontend

# 安装依存関係
echo "📦 インストールフロントエンド依存関係..."
npm install

# ビルドフロントエンドプロジェクト
echo "🔨 ビルドフロントエンドプロジェクト..."
npm run build

# 杀掉占用5173端口のプロセス（フロントエンド開発サーバー）
echo "🔌 杀掉占用5173端口のプロセス..."
port_pids_5173=$(lsof -ti:5173 2>/dev/null || echo "")
if [ -n "$port_pids_5173" ]; then
    echo "找到占用5173端口のプロセス: $port_pids_5173"
    for pid in $port_pids_5173; do
        sudo kill -9 $pid 2>/dev/null || echo "警告: 无法杀掉占用5173端口のプロセス $pid"
    done
    echo "已尝试杀掉占用5173端口のプロセス"
else
    echo "未找到占用5173端口のプロセス"
fi

# 等待一段时间让プロセス完全終了
sleep 2

# 启動フロントエンド開発サーバー（バックグラウンド実行）
echo "▶️ 启動フロントエンド開発サーバー..."
nohup npm run dev > /tmp/admin-frontend.log 2>&1 &

echo "✅ フロントエンド管理プロジェクト已在バックグラウンド起動！"
echo "📝 フロントエンドログファイル: /tmp/admin-frontend.log"
echo "🌐 アクセスアドレス: http://localhost:5173"
echo "👤 ログイン資格情報: ユーザー名: admin, パスワード: admin123"

echo "🎉 デプロイ完了！"