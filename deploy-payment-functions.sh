#!/bin/bash

# 微信支付云函数部署脚本
echo "🚀 开始部署微信支付相关云函数..."

# 检查是否在正确的目录
if [ ! -d "cloudfunctions" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 部署支付云函数
echo "📦 部署支付云函数 (payment)..."
cd cloudfunctions/payment
npm install
echo "✅ payment 云函数依赖安装完成"
cd ../..

# 部署支付回调云函数
echo "📦 部署支付回调云函数 (paymentCallback)..."
cd cloudfunctions/paymentCallback
npm install
echo "✅ paymentCallback 云函数依赖安装完成"
cd ../..

echo ""
echo "🎉 云函数依赖安装完成！"
echo ""
echo "📋 接下来请在微信开发者工具中："
echo "1. 右键点击 cloudfunctions/payment 文件夹"
echo "2. 选择 '上传并部署：云端安装依赖'"
echo "3. 右键点击 cloudfunctions/paymentCallback 文件夹"
echo "4. 选择 '上传并部署：云端安装依赖'"
echo ""
echo "⚠️  重要提醒："
echo "- 确保 paymentCallback 云函数配置了 HTTP 触发器"
echo "- 在微信商户平台配置支付回调地址"
echo "- 回调地址格式: https://your-env-id.service.tcloudbase.com/paymentCallback"
echo ""
echo "🔧 当前配置的回调地址:"
echo "https://new-travel-2gy6d6oy7ee5fb0e.service.tcloudbase.com/paymentCallback"
