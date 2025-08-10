#!/bin/bash

echo "🚀 开始部署网页管理系统..."

# 检查是否在正确的目录
if [ ! -d "admin" ]; then
    echo "❌ 错误：请在项目根目录下运行此脚本"
    exit 1
fi

# 进入admin目录
cd admin

# 检查package.json是否存在
if [ ! -f "package.json" ]; then
    echo "❌ 错误：admin目录下没有找到package.json文件"
    exit 1
fi

# 安装依赖
echo "📥 安装依赖..."
npm install

# 检查node_modules是否存在
if [ ! -d "node_modules" ]; then
    echo "❌ 错误：依赖安装失败"
    exit 1
fi

echo "✅ 依赖安装完成"

# 创建生产环境配置文件
echo "📝 创建生产环境配置..."
cat > production-config.js << 'EOF'
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

echo "✅ 生产环境配置创建完成"

# 创建部署说明文档
echo "📋 创建部署说明..."
cat > DEPLOY-README.md << 'EOF'
# 网页管理系统部署说明

## 部署步骤

### 1. 服务器准备
- 确保服务器已安装 Node.js (版本 >= 14)
- 确保服务器有公网IP或域名

### 2. 文件上传
将以下文件上传到服务器：
```
admin/
├── server.js          # 服务器主文件
├── package.json       # 依赖配置
├── index.html         # 主页面
├── test-*.html        # 测试页面
├── js/                # JavaScript文件
├── css/               # CSS样式文件
└── production-config.js # 生产环境配置
```

### 3. 服务器配置

#### 使用PM2管理进程（推荐）
```bash
# 安装PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name "admin-server"

# 设置开机自启
pm2 startup
pm2 save
```

#### 使用systemd管理服务
```bash
# 创建服务文件
sudo nano /etc/systemd/system/admin-server.service

# 服务文件内容：
[Unit]
Description=Admin Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/admin
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# 启动服务
sudo systemctl enable admin-server
sudo systemctl start admin-server
```

### 4. 域名配置

#### Nginx反向代理配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL证书配置（推荐）
```bash
# 使用Let's Encrypt获取SSL证书
sudo certbot --nginx -d your-domain.com
```

### 5. 环境变量配置
```bash
# 设置环境变量
export NODE_ENV=production
export PORT=3000
export WECHAT_ACCESS_TOKEN=your-access-token
```

### 6. 安全配置
- 配置防火墙，只开放必要端口
- 设置强密码
- 定期更新依赖包
- 配置日志轮转

## 访问地址
- 主页面：http://your-domain.com
- 测试页面：http://your-domain.com/test-product-edit.html

## 监控和维护
- 使用PM2监控进程状态
- 配置日志收集
- 设置告警机制
- 定期备份数据

## 故障排除
1. 检查端口是否被占用：`lsof -i :3000`
2. 检查服务状态：`pm2 status` 或 `systemctl status admin-server`
3. 查看日志：`pm2 logs admin-server` 或 `journalctl -u admin-server`
4. 重启服务：`pm2 restart admin-server` 或 `systemctl restart admin-server`
EOF

echo "✅ 部署说明文档创建完成"

# 创建Docker部署文件
echo "🐳 创建Docker配置..."
cat > Dockerfile << 'EOF'
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用文件
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
EOF

# 创建docker-compose.yml
cat > docker-compose.yml << 'EOF'
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
    volumes:
      - ./logs:/app/logs
EOF

echo "✅ Docker配置创建完成"

# 创建启动脚本
echo "📝 创建启动脚本..."
cat > start.sh << 'EOF'
#!/bin/bash

echo "🚀 启动网页管理系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：Node.js未安装"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📥 安装依赖..."
    npm install
fi

# 启动服务
echo "✅ 启动服务..."
node server.js
EOF

chmod +x start.sh

echo "✅ 启动脚本创建完成"

echo ""
echo "🎉 部署准备完成！"
echo ""
echo "📋 部署选项："
echo "1. 直接部署：在admin目录下运行 'node server.js'"
echo "2. PM2部署：使用 'pm2 start server.js --name admin-server'"
echo "3. Docker部署：使用 'docker-compose up -d'"
echo "4. 系统服务：参考 DEPLOY-README.md 配置systemd"
echo ""
echo "🌐 访问地址："
echo "- 本地测试：http://localhost:3000"
echo "- 生产环境：http://your-domain.com"
echo ""
echo "📚 详细说明请查看 DEPLOY-README.md" 