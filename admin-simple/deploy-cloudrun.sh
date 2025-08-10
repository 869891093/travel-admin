#!/bin/bash

# 微信云托管部署脚本
# 使用方法: ./deploy-cloudrun.sh

echo "🚀 开始部署到微信云托管..."

# 检查必要文件
if [ ! -f "Dockerfile" ]; then
    echo "❌ 错误: 找不到 Dockerfile"
    exit 1
fi

if [ ! -f "container.config.json" ]; then
    echo "❌ 错误: 找不到 container.config.json"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 错误: 找不到 package.json"
    exit 1
fi

echo "✅ 配置文件检查完成"

# 提交代码到Git仓库
echo "📦 提交代码到Git仓库..."

# 添加所有文件
git add .

# 提交代码
COMMIT_MSG="Deploy to WeChat CloudRun - $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$COMMIT_MSG"

# 推送到远程仓库
git push origin main

echo "✅ 代码已推送到Git仓库"

echo "🎉 部署准备完成!"
echo ""
echo "📋 接下来请在微信云托管控制台进行以下操作:"
echo "1. 登录微信云托管控制台: https://cloud.weixin.qq.com/"
echo "2. 选择您的小程序: wxb61e3bbcd9bebc43"
echo "3. 进入云托管 -> 服务管理"
echo "4. 创建新服务或更新现有服务"
echo "5. 配置Git仓库: git@github.com:869891093/travel-admin.git"
echo "6. 选择分支: main"
echo "7. 设置构建目录: admin-simple"
echo "8. 配置环境变量 (可选):"
echo "   - WECHAT_APP_ID: wxb61e3bbcd9bebc43"
echo "   - WECHAT_ENV_ID: new-travel-2gy6d6oy7ee5fb0e"
echo "   - WECHAT_APP_SECRET: [您的AppSecret]"
echo "9. 点击部署"
echo ""
echo "🔗 部署完成后，您可以通过云托管提供的域名访问管理后台"
