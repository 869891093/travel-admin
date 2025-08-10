#!/bin/bash

# 旅游小程序管理后台 - 简化版（纯前端）启动脚本

echo "🚀 启动旅游小程序管理后台 - 简化版（纯前端）"
echo "=============================================="

# 检查当前目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在 admin-simple 目录下运行此脚本"
    exit 1
fi

# 检查端口是否被占用
PORT=8080
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用，尝试使用端口 8081"
    PORT=8081
fi

if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $PORT 也被占用，尝试使用端口 8082"
    PORT=8082
fi

echo "📡 使用端口: $PORT"

# 尝试不同的启动方式
echo "🔍 检查可用的服务器..."

# 方法1: 使用 Python 3
if command -v python3 &> /dev/null; then
    echo "✅ 使用 Python 3 启动服务器"
    echo ""
    echo "🎉 服务启动成功！"
    echo "=================================="
    echo "🌐 管理后台: http://localhost:$PORT"
    echo ""
    echo "💡 功能说明："
    echo "   ✨ 现在使用真实的数据结构"
    echo "   🔄 自动检测运行环境（微信开发者工具 vs 浏览器）"
    echo "   📊 在微信开发者工具中可直接调用云函数"
    echo "   🎭 在普通浏览器中使用模拟数据"
    echo "   💾 智能缓存机制，提升加载速度"
    echo ""
    echo "🔧 使用方法："
    echo "   1. 在普通浏览器中：查看模拟数据和界面效果"
    echo "   2. 在微信开发者工具中：连接真实云数据库"
    echo "   3. 点击'测试连接'查看当前运行模式"
    echo ""
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    
    # 自动打开浏览器（macOS）
    if command -v open &> /dev/null; then
        sleep 1
        open "http://localhost:$PORT"
    fi
    
    python3 -m http.server $PORT
    exit 0
fi

# 方法2: 使用 Python 2
if command -v python &> /dev/null; then
    echo "✅ 使用 Python 2 启动服务器"
    echo ""
    echo "🎉 服务启动成功！"
    echo "=================================="
    echo "🌐 管理后台: http://localhost:$PORT"
    echo ""
    echo "💡 功能说明："
    echo "   ✨ 现在使用真实的数据结构"
    echo "   🔄 自动检测运行环境"
    echo "   📊 智能数据加载"
    echo ""
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    
    # 自动打开浏览器（macOS）
    if command -v open &> /dev/null; then
        sleep 1
        open "http://localhost:$PORT"
    fi
    
    python -m SimpleHTTPServer $PORT
    exit 0
fi

# 方法3: 使用 Node.js
if command -v node &> /dev/null; then
    if command -v npx &> /dev/null; then
        echo "✅ 使用 Node.js http-server 启动服务器"
        echo ""
        echo "🎉 服务启动成功！"
        echo "=================================="
        echo "🌐 管理后台: http://localhost:$PORT"
        echo ""
        echo "⏹️  按 Ctrl+C 停止服务器"
        echo ""
        
        # 自动打开浏览器（macOS）
        if command -v open &> /dev/null; then
            sleep 1
            open "http://localhost:$PORT"
        fi
        
        npx http-server -p $PORT
        exit 0
    fi
fi

# 方法4: 使用 PHP
if command -v php &> /dev/null; then
    echo "✅ 使用 PHP 内置服务器启动"
    echo ""
    echo "🎉 服务启动成功！"
    echo "=================================="
    echo "🌐 管理后台: http://localhost:$PORT"
    echo ""
    echo "⏹️  按 Ctrl+C 停止服务器"
    echo ""
    
    # 自动打开浏览器（macOS）
    if command -v open &> /dev/null; then
        sleep 1
        open "http://localhost:$PORT"
    fi
    
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
