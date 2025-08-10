#!/bin/bash

# 旅游小程序管理后台 - 简化版（带服务器）启动脚本

echo "🚀 启动旅游小程序管理后台 - 真实数据版"
echo "=============================================="
echo "📊 AppID: wxb61e3bbcd9bebc43"
echo "🔗 环境ID: new-travel-2gy6d6oy7ee5fb0e"

# 检查当前目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误：请在 admin-simple 目录下运行此脚本"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm"
    echo "请先安装 npm"
    exit 1
fi

# 安装依赖
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "🔄 安装 Node.js 依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
else
    echo "✅ 依赖已存在"
fi

# 检查端口是否被占用
SERVER_PORT=3001
FRONTEND_PORT=8080

if lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $SERVER_PORT 已被占用"
    echo "请先停止占用该端口的进程，或修改 server.js 中的端口配置"
    exit 1
fi

if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 $FRONTEND_PORT 已被占用，尝试使用端口 8081"
    FRONTEND_PORT=8081
fi

echo "📡 服务器端口: $SERVER_PORT"
echo "🌐 前端端口: $FRONTEND_PORT"

# 创建临时脚本来启动服务器
cat > start_server.sh << EOF
#!/bin/bash
echo "🔧 启动代理服务器..."
node server.js
EOF

chmod +x start_server.sh

# 创建临时脚本来启动前端
cat > start_frontend.sh << EOF
#!/bin/bash
sleep 2
echo "🌐 启动前端服务..."
if command -v python3 &> /dev/null; then
    python3 -m http.server $FRONTEND_PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $FRONTEND_PORT
else
    echo "❌ 未找到 Python，无法启动前端服务"
    exit 1
fi
EOF

chmod +x start_frontend.sh

# 启动服务
echo ""
echo "🚀 启动服务..."
echo "=================================="

# 在后台启动代理服务器
./start_server.sh &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待代理服务器启动..."
sleep 3

# 检查服务器是否启动成功
if ! curl -s http://localhost:$SERVER_PORT/api/health > /dev/null; then
    echo "❌ 代理服务器启动失败"
    kill $SERVER_PID 2>/dev/null
    rm -f start_server.sh start_frontend.sh
    exit 1
fi

echo "✅ 代理服务器启动成功"

# 在后台启动前端服务
./start_frontend.sh &
FRONTEND_PID=$!

# 等待前端服务启动
sleep 2

echo ""
echo "🎉 服务启动完成！"
echo "=================================="
echo "📡 代理服务器: http://localhost:$SERVER_PORT"
echo "🌐 管理后台: http://localhost:$FRONTEND_PORT"
echo "🔍 健康检查: http://localhost:$SERVER_PORT/api/health"
echo ""
echo "💡 使用说明："
echo "   1. 打开浏览器访问管理后台"
echo "   2. 在系统设置中测试连接"
echo "   3. 现在显示的是真实的数据库数据"
echo ""
echo "⏹️  按 Ctrl+C 停止所有服务"

# 等待用户中断
trap 'echo ""; echo "🛑 正在停止服务..."; kill $SERVER_PID $FRONTEND_PID 2>/dev/null; rm -f start_server.sh start_frontend.sh; echo "✅ 服务已停止"; exit 0' INT

# 自动打开浏览器（macOS）
if command -v open &> /dev/null; then
    sleep 1
    open "http://localhost:$FRONTEND_PORT"
fi

# 保持脚本运行
wait
