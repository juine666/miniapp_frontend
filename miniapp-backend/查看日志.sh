#!/bin/bash
# 实时查看后端日志脚本

cd "$(dirname "$0")"

echo "=== 后端日志实时监控 ==="
echo "按 Ctrl+C 退出"
echo ""

# 如果日志文件不存在，创建它
mkdir -p logs
touch logs/miniapp-backend.log

# 实时显示日志（显示最后50行，然后继续监控新日志）
tail -f -n 50 logs/miniapp-backend.log

