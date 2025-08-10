#!/bin/bash

echo "📦 创建部署包..."

# 检查是否在正确的目录
if [ ! -d "admin" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 创建部署目录
DEPLOY_DIR="admin-deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p $DEPLOY_DIR

echo "📁 创建部署目录: $DEPLOY_DIR"

# 复制必要文件
echo "📋 复制文件..."
cp -r admin/* $DEPLOY_DIR/

# 创建生产环境配置文件
cat > $DEPLOY_DIR/production-config.js << 'EOF'
// 生产环境配置
const CONFIG = {
    envId: 'new-travel-2gy6d6oy7ee5fb0e',
    apiKey: '', // 生产环境需要配置正确的API密钥
    baseUrl: 'https://api.weixin.qq.com',
    useProxy: false, // 生产环境直接调用微信API
    isProduction: true
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}
EOF

# 创建部署说明
cat > $DEPLOY_DIR/DEPLOY-README.md << 'EOF'
# 网页管理系统部署说明

## 快速部署

### 1. 上传文件
将整个文件夹上传到服务器

### 2. 安装依赖
```bash
npm install
```

### 3. 启动服务
```bash
# 方式1：直接启动
node server.js

# 方式2：使用PM2（推荐）
npm install -g pm2
pm2 start server.js --name "admin-server"
pm2 startup
pm2 save
```

### 4. 配置域名（可选）
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 访问地址
- 主页面：http://your-server-ip:3000
- 测试页面：http://your-server-ip:3000/test-product-edit.html

## 功能特性
- ✅ 产品管理（增删改查）
- ✅ 图片上传功能
- ✅ 价格日历管理
- ✅ 行程安排管理
- ✅ 费用说明管理
- ✅ 预订须知管理
- ✅ 标签管理
- ✅ 响应式设计

## 注意事项
1. 确保服务器已安装 Node.js (>= 14)
2. 确保端口3000未被占用
3. 生产环境建议配置SSL证书
4. 定期备份数据
EOF

# 创建启动脚本
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash

echo "🚀 启动网页管理系统..."

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误：Node.js未安装"
    exit 1
fi

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

# 启动服务
echo "✅ 启动服务..."
node server.js
EOF

chmod +x $DEPLOY_DIR/start.sh

# 创建PM2配置文件
cat > $DEPLOY_DIR/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'admin-server',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# 创建Docker配置
cat > $DEPLOY_DIR/Dockerfile << 'EOF'
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
EOF

cat > $DEPLOY_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  admin-server:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
EOF

# 创建压缩包
echo "📦 创建压缩包..."
tar -czf "${DEPLOY_DIR}.tar.gz" $DEPLOY_DIR

# 清理临时目录
rm -rf $DEPLOY_DIR

echo ""
echo "🎉 部署包创建完成！"
echo ""
echo "📦 部署包文件: ${DEPLOY_DIR}.tar.gz"
echo ""
echo "📋 部署步骤："
echo "1. 将 ${DEPLOY_DIR}.tar.gz 上传到服务器"
echo "2. 解压文件：tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "3. 进入目录：cd ${DEPLOY_DIR}"
echo "4. 安装依赖：npm install"
echo "5. 启动服务：./start.sh 或 pm2 start ecosystem.config.js"
echo ""
echo "🌐 访问地址：http://your-server-ip:3000" 