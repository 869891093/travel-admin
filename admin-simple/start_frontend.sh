#!/bin/bash
sleep 2
echo "🌐 启动前端服务..."
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8080
else
    echo "❌ 未找到 Python，无法启动前端服务"
    exit 1
fi
