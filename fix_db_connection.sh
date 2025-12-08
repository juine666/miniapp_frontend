#!/bin/bash
# 修复数据库连接问题的脚本

echo "🔧 检查并修复数据库连接问题..."

# 检查MySQL服务是否运行
echo "🔍 检查MySQL服务状态..."
if systemctl is-active --quiet mysql || systemctl is-active --quiet mysqld; then
    echo "✅ MySQL服务正在运行"
else
    echo "⚠️ MySQL服务未运行，尝试启动..."
    sudo systemctl start mysql 2>/dev/null || sudo systemctl start mysqld 2>/dev/null || echo "❌ 无法启动MySQL服务，请手动检查"
fi

# 检查数据库是否存在
echo "🔍 检查数据库是否存在..."
DB_EXISTS=$(mysql -u root -proot -e "SHOW DATABASES LIKE 'miniapp';" 2>/dev/null | grep -c miniapp || echo "0")
if [ "$DB_EXISTS" -eq 0 ]; then
    echo "⚠️ 数据库 'miniapp' 不存在，创建数据库..."
    mysql -u root -proot -e "CREATE DATABASE IF NOT EXISTS miniapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || echo "❌ 无法创建数据库，请检查MySQL root密码"
else
    echo "✅ 数据库 'miniapp' 存在"
fi

# 检查用户权限
echo "🔍 检查用户权限..."
USER_EXISTS=$(mysql -u root -proot -e "SELECT User, Host FROM mysql.user WHERE User='root' AND Host='localhost';" 2>/dev/null | grep -c root || echo "0")
if [ "$USER_EXISTS" -eq 0 ]; then
    echo "⚠️ 用户 'root'@'localhost' 不存在，创建用户..."
    mysql -u root -proot -e "CREATE USER IF NOT EXISTS 'root'@'localhost' IDENTIFIED BY 'root';" 2>/dev/null || echo "❌ 无法创建用户"
    mysql -u root -proot -e "GRANT ALL PRIVILEGES ON miniapp.* TO 'root'@'localhost';" 2>/dev/null || echo "❌ 无法授予权限"
    mysql -u root -proot -e "FLUSH PRIVILEGES;" 2>/dev/null || echo "❌ 无法刷新权限"
else
    echo "✅ 用户 'root'@'localhost' 存在"
    echo "🔧 确保用户有足够权限..."
    mysql -u root -proot -e "GRANT ALL PRIVILEGES ON miniapp.* TO 'root'@'localhost';" 2>/dev/null || echo "❌ 无法授予权限"
    mysql -u root -proot -e "FLUSH PRIVILEGES;" 2>/dev/null || echo "❌ 无法刷新权限"
fi

echo "🧪 测试数据库连接..."
mysql -u root -proot -e "USE miniapp; SELECT 1;" 2>/dev/null && echo "✅ 数据库连接测试成功" || echo "❌ 数据库连接测试失败，请检查配置"

echo "📝 如果问题仍然存在，请检查以下配置："
echo "1. MySQL root密码是否为'root'"
echo "2. 数据库是否正确创建"
echo "3. 用户权限是否正确设置"
echo "4. application.yml中的数据库配置是否正确"