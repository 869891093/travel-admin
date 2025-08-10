#!/bin/bash

# 旅游小程序管理后台 - 简化版启动脚本

echo "🚀 启动旅游小程序管理后台 - 简化版"
echo "=================================="

# 检查当前目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在 admin-simple 目录下运行此脚本"
    exit 1
fi

# 检查端口是否被占用
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 已被占用，尝试使用端口 8081"
    PORT=8081
fi

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  端口 $PORT 也被占用，尝试使用端口 8082"
    PORT=8082
fi

echo "📡 使用端口: $PORT"

# 尝试不同的启动方式
echo "🔍 检查可用的服务器..."

# 方法1: 使用 Python 3
if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python 3 启动服务器"
    echo "🌐 访问地址: http://localhost:$PORT"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    python3 -m http.server $PORT
    exit 0
fi

# 方法2: 使用 Python 2
if command -v python &> /dev/null; then
    echo "✅ 使用 Python 2 启动服务器"
    echo "🌐 访问地址: http://localhost:$PORT"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    python -m SimpleHTTPServer $PORT
    exit 0
fi

# 方法3: 使用 Node.js
if command -v node &> /dev/null; then
    if command -v npx &> /dev/null; then
        echo "✅ 使用 Node.js http-server 启动服务器"
        echo "🌐 访问地址: http://localhost:$PORT"
        echo "⏹️  按 Ctrl+C 停止服务器"
        echo ""
        npx http-server -p $PORT
        exit 0
    fi
fi

# 方法4: 使用 PHP
if command -v php &> /dev/null; then
    echo "✅ 使用 PHP 内置服务器启动"
    echo "🌐 访问地址: http://localhost:$PORT"
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    php -S localhost:$PORT
    exit 0
fi

# 如果都没有找到
echo "❌ 未找到可用的服务器程序"
echo ""
echo "请安装以下任一程序："
echo "  • Python 3: brew install python3"
echo "  • Node.js: brew install node"
echo "  • PHP: brew install php"
echo ""
echo "或者直接用浏览器打开 index.html 文件"
echo "文件路径: $(pwd)/index.html"

exit 1
