#!/bin/bash
# JDK 17 环境变量配置脚本

echo "正在配置 JDK 17 环境变量..."

# 查找 JDK 17 安装路径
JDK17_PATH=$(/usr/libexec/java_home -v 17 2>/dev/null)

if [ -z "$JDK17_PATH" ]; then
    echo "❌ 未找到 JDK 17，请先安装 JDK 17"
    echo ""
    echo "安装方法："
    echo "1. 使用 Homebrew: brew install --cask temurin@17"
    echo "2. 或手动下载: https://adoptium.net/temurin/releases/?version=17"
    exit 1
fi

echo "✅ 找到 JDK 17: $JDK17_PATH"

# 设置当前会话的 JAVA_HOME
export JAVA_HOME="$JDK17_PATH"
export PATH="$JAVA_HOME/bin:$PATH"

echo ""
echo "当前会话已设置："
echo "JAVA_HOME=$JAVA_HOME"
echo "Java 版本:"
java -version

echo ""
echo "要永久设置，请将以下内容添加到 ~/.zshrc 或 ~/.bash_profile："
echo "export JAVA_HOME=\$(/usr/libexec/java_home -v 17)"
echo "export PATH=\$JAVA_HOME/bin:\$PATH"

