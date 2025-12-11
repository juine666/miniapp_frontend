#!/bin/bash
# ==============================
# 一键部署脚本（支持 all/backend/frontend 模式）
# ==============================
set -e

MODE=$1
if [ -z "$MODE" ]; then
  echo "❗ 使用方式:"
  echo "  miniapp_deploy.sh all        全量部署（后端 + 前端 + 重载 nginx）"
  echo "  miniapp_deploy.sh backend    仅打包并重启后端服务"
  echo "  miniapp_deploy.sh frontend   仅构建并部署前端（admin + 小程序）"
  exit 1
fi

APP_DIR="/opt/miniapp_frontend"
BACKEND_DIR="$APP_DIR/miniapp-backend"
ADMIN_FRONTEND_DIR="$APP_DIR/admin-frontend"
JAR_NAME="miniapp-backend-0.0.1-SNAPSHOT.jar"
BACKEND_LOG="$BACKEND_DIR/logs/app.log"
NGINX_BIN="/www/server/nginx/sbin/nginx"  # 宝塔 nginx

echo "=============================="
echo "🚀 开始部署模块: $MODE"
echo "=============================="

# ------------------------------
# 函数：杀掉占用端口（不报错）
# ------------------------------
kill_port() {
  PORT=$1
  echo "🔪 检查并杀掉占用端口 $PORT 的进程..."
  PIDS=$(sudo lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    for PID in $PIDS; do
      sudo kill -9 $PID 2>/dev/null || echo "⚠️ 无法杀掉进程 $PID"
    done
    echo "✅ 已杀掉进程: $PIDS"
    sleep 2
  else
    echo "⚡ 端口 $PORT 没有占用"
  fi
}

# ------------------------------
# 函数：部署后端
# ------------------------------
deploy_backend() {
  echo "--------------------------------"
  echo "🔧 构建后端服务..."
  echo "--------------------------------"

  cd "$BACKEND_DIR"
  mvn clean package -DskipTests

  if [ $? -eq 0 ]; then
    echo "✅ 后端打包成功: target/$JAR_NAME"
  else
    echo "❌ 后端打包失败"
    exit 1
  fi

  echo "▶️ 启动后端服务 (systemd 模式)..."
  sudo systemctl daemon-reload
  sudo systemctl stop miniapp-backend 2>/dev/null || true
  sudo systemctl start miniapp-backend
  sleep 3
  sudo systemctl status miniapp-backend --no-pager || true
  echo "📊 后端日志: tail -f $BACKEND_LOG"
}

# ------------------------------
# 函数：部署前端
# ------------------------------
deploy_frontend() {
  echo "--------------------------------"
  echo "🎨 构建管理后台前端..."
  echo "--------------------------------"

  cd "$ADMIN_FRONTEND_DIR"
  npm install --registry=https://registry.npmmirror.com
  npm run build

  echo "✅ 管理后台前端构建完成 → dist/"
}

# ------------------------------
# 函数：重载 nginx
# ------------------------------
reload_nginx() {
  echo "--------------------------------"
  echo "🔄 重新加载 Nginx..."
  echo "--------------------------------"
  sudo $NGINX_BIN -t && sudo $NGINX_BIN -s reload
  echo "✅ Nginx 已重载"
}

# ------------------------------
# 执行逻辑
# ------------------------------
case "$MODE" in
  all)
    kill_port 8081
    deploy_backend
    deploy_frontend
    reload_nginx
    ;;
  backend)
    kill_port 8081
    deploy_backend
    ;;
  frontend)
    deploy_frontend
    reload_nginx
    ;;
  *)
    echo "❌ 无效参数: $MODE"
    echo "用法: all | backend | frontend"
    exit 1
    ;;
esac

echo "=============================================="
echo "🎉 部署完成！模块：$MODE"
echo "🌐 管理后台: https://fxyw.work/admin/"
echo "📊 后端日志查看: tail -f $BACKEND_LOG"

echo "👤 登录凭证: 用户名: admin, 密码: admin123"
echo "=============================="
