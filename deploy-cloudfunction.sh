#!/bin/bash

echo "🚀 部署云函数到微信云开发环境"
echo "=================================="

# 环境配置
ENV_ID="new-travel-2gy6d6oy7ee5fb0e"
FUNCTION_NAME="httpAPI"

echo "📦 环境ID: $ENV_ID"
echo "🔧 函数名: $FUNCTION_NAME"
echo ""

# 检查是否安装了 tcb CLI
if ! command -v tcb &> /dev/null; then
    echo "❌ 未找到 tcb CLI，正在安装..."
    npm install -g @cloudbase/cli
fi

# 进入云函数目录
cd cloudfunctions/$FUNCTION_NAME

echo "📦 安装依赖..."
npm install

echo "🚀 部署云函数..."
cd ../..

# 部署云函数
tcb fn deploy $FUNCTION_NAME -e $ENV_ID

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 云函数部署成功！"
    echo "🎉 现在可以使用完整的图片上传功能了"
    echo ""
    echo "💡 使用说明："
    echo "   1. 刷新网页管理后台"
    echo "   2. 尝试上传图片"
    echo "   3. 图片将保存到微信云存储"
    echo ""
else
    echo ""
    echo "❌ 部署失败，请检查："
    echo "   1. 是否已登录 tcb CLI"
    echo "   2. 环境ID是否正确"
    echo "   3. 网络连接是否正常"
    echo ""
    echo "🔧 手动部署方法："
    echo "   1. 打开微信开发者工具"
    echo "   2. 右键点击 cloudfunctions/httpAPI"
    echo "   3. 选择'上传并部署：云端安装依赖'"
fi
