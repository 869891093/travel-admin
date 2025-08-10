#!/bin/bash

echo "🚀 开始部署跟团游小程序云函数..."

# 检查是否在正确的目录
if [ ! -d "cloudfunctions" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 部署 getOpenid 云函数
echo "📦 部署 getOpenid 云函数..."
cd cloudfunctions/getOpenid
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi
echo "✅ getOpenid 云函数准备完成"

# 部署 initDatabase 云函数
echo "📦 部署 initDatabase 云函数..."
cd ../initDatabase
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi
echo "✅ initDatabase 云函数准备完成"

echo ""
echo "🎉 云函数部署准备完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 在微信开发者工具中打开项目"
echo "2. 确保云开发环境ID为：new-travel-2gy6d6oy7ee5fb0e"
echo "3. 右键点击 cloudfunctions/getOpenid 文件夹，选择'上传并部署'"
echo "4. 右键点击 cloudfunctions/initDatabase 文件夹，选择'上传并部署'"
echo "5. 在云开发控制台调用 initDatabase 云函数初始化数据"
echo "6. 编译运行小程序"
echo ""
echo "💡 提示：如果遇到权限问题，请确保云开发环境已正确配置" 