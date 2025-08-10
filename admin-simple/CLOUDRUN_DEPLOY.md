# 微信云托管部署指南

## 项目信息
- **小程序AppID**: wxb61e3bbcd9bebc43
- **云开发环境ID**: new-travel-2gy6d6oy7ee5fb0e
- **Git仓库**: git@github.com:869891093/travel-admin.git
- **部署目录**: admin-simple

## 部署步骤

### 1. 准备工作
确保以下文件已经准备好：
- ✅ Dockerfile
- ✅ container.config.json
- ✅ .dockerignore
- ✅ package.json
- ✅ server.js (已适配云托管)

### 2. 推送代码到Git仓库
```bash
# 进入admin-simple目录
cd admin-simple

# 执行部署脚本
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh
```

### 3. 在微信云托管控制台配置

#### 3.1 登录控制台
访问: https://cloud.weixin.qq.com/

#### 3.2 创建云托管服务
1. 选择小程序: `wxb61e3bbcd9bebc43`
2. 进入 **云托管** -> **服务管理**
3. 点击 **新建服务**

#### 3.3 配置服务信息
- **服务名称**: travel-admin-simple
- **服务描述**: 旅游小程序管理后台
- **部署方式**: Git仓库部署

#### 3.4 配置Git仓库
- **仓库地址**: `git@github.com:869891093/travel-admin.git`
- **分支**: main
- **构建目录**: admin-simple
- **Dockerfile路径**: Dockerfile

#### 3.5 配置环境变量 (可选但推荐)
在云托管控制台的环境变量配置中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `WECHAT_APP_ID` | `wxb61e3bbcd9bebc43` | 小程序AppID |
| `WECHAT_ENV_ID` | `new-travel-2gy6d6oy7ee5fb0e` | 云开发环境ID |
| `WECHAT_APP_SECRET` | `您的AppSecret` | 小程序密钥 |
| `NODE_ENV` | `production` | 运行环境 |

#### 3.6 配置资源规格
- **CPU**: 0.25核
- **内存**: 0.5GB
- **最小实例数**: 0
- **最大实例数**: 10

### 4. 部署和访问

#### 4.1 触发部署
1. 在云托管控制台点击 **部署**
2. 等待构建和部署完成（通常需要3-5分钟）

#### 4.2 获取访问地址
部署成功后，云托管会提供一个访问域名，格式类似：
```
https://your-service-id-xxx.ap-shanghai.app.tcloudbase.com
```

#### 4.3 访问管理后台
访问地址：`https://your-domain/index.html`

## 常见问题

### Q1: 部署失败怎么办？
1. 检查Dockerfile语法是否正确
2. 确认package.json中的依赖是否完整
3. 查看云托管控制台的构建日志

### Q2: 服务启动失败？
1. 检查端口配置（应该是3000）
2. 确认环境变量配置是否正确
3. 查看运行日志

### Q3: 无法访问管理后台？
1. 确认服务状态是否正常
2. 检查防火墙和安全组设置
3. 确认访问路径是否正确

### Q4: 云函数调用失败？
1. 检查AppSecret是否正确配置
2. 确认云开发环境ID是否正确
3. 检查网络连接是否正常

## 更新部署

当需要更新代码时：
1. 修改代码
2. 提交到Git仓库
3. 在云托管控制台触发重新部署

## 监控和日志

- **服务监控**: 云托管控制台 -> 监控告警
- **运行日志**: 云托管控制台 -> 日志查询
- **访问日志**: 云托管控制台 -> 访问日志

## 成本优化

- 设置合理的最小实例数（建议0）
- 配置自动扩缩容策略
- 定期检查资源使用情况
