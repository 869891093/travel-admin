#!/bin/bash

echo "开始部署支付云函数..."

# 进入项目目录
cd "$(dirname "$0")"

# 部署支付云函数
echo "部署 payment 云函数..."
cd cloudfunctions/payment
npm install
cd ../..

# 部署支付回调云函数
echo "部署 paymentCallback 云函数..."
cd cloudfunctions/paymentCallback
npm install
cd ../..

echo "支付云函数部署完成！"

echo ""
echo "注意事项："
echo "1. 确保微信商户号已正确配置"
echo "2. 确保支付回调地址已在微信商户平台配置"
echo "3. 测试支付功能前请确认证书文件已上传"
echo "4. 建议先在测试环境验证支付功能" 