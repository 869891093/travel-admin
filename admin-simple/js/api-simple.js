// 简化版API - 直接使用云函数，无需access_token
class SimpleAPI {
    constructor() {
        this.envId = 'new-travel-2gy6d6oy7ee5fb0e'; // 您的环境ID
        this.isConnected = false;
        this.cache = new Map(); // 简单缓存
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
        this.useRealData = true; // 使用真实数据
        // 自动检测代理服务器地址
        this.proxyUrl = this.getProxyUrl();

        console.log('SimpleAPI 初始化完成');
        console.log('使用真实数据:', this.useRealData);
        console.log('代理服务器:', this.proxyUrl);
    }

    // 自动检测代理服务器地址
    getProxyUrl() {
        // 如果是本地开发环境
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }

        // 如果是云托管环境，使用当前域名
        return window.location.origin;
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            const text = overlay.querySelector('p');
            if (text) text.textContent = message;
        }
    }

    // 隐藏加载状态
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 创建消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
        // 3秒后自动移除
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }

    // 缓存管理
    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    clearCache() {
        this.cache.clear();
        console.log('缓存已清除');
    }

    // 调用云函数 - 真实的云函数调用
    async callCloudFunction(functionName, data) {
        try {
            console.log(`调用云函数: ${functionName}`, data);

            // 检查缓存
            const cacheKey = `${functionName}_${JSON.stringify(data)}`;
            const cached = this.getCache(cacheKey);
            if (cached && data.action === 'get') {
                console.log('使用缓存数据');
                return cached;
            }

            // 真实的云函数调用
            const result = await this.callRealCloudFunction(functionName, data);

            // 缓存GET请求的结果
            if (data.action === 'get' && result.success) {
                this.setCache(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error('云函数调用失败:', error);
            throw error; // 不再回退到模拟数据，直接抛出错误
        }
    }

    // 真实的云函数调用
    async callRealCloudFunction(functionName, data) {
        try {
            console.log('=== 真实云函数调用 ===');
            console.log('函数名:', functionName);
            console.log('参数:', data);

            // 使用微信云开发SDK调用云函数
            if (typeof wx !== 'undefined' && wx.cloud) {
                // 在微信开发者工具中
                const result = await wx.cloud.callFunction({
                    name: functionName,
                    data: data
                });

                console.log('云函数调用结果:', result);
                return result.result || result;
            } else {
                // 在普通浏览器中，通过HTTP API调用
                return await this.callCloudFunctionViaHTTP(functionName, data);
            }
        } catch (error) {
            console.error('真实云函数调用失败:', error);
            throw error;
        }
    }

    // 通过HTTP API调用云函数
    async callCloudFunctionViaHTTP(functionName, data) {
        try {
            // 使用代理服务器调用
            const url = `${this.proxyUrl}/api/cloud-function`;

            console.log('通过代理服务器调用:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    envId: this.envId,
                    functionName: functionName,
                    data: data
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP调用失败: ${response.status}`);
            }

            const result = await response.json();
            console.log('代理服务器调用结果:', result);

            return result;
        } catch (error) {
            console.error('代理服务器调用失败:', error);
            // 如果代理服务器不可用，回退到模拟数据
            console.log('代理服务器不可用，使用模拟数据');
            throw error;
        }
    }

    // 模拟云函数调用 - 作为回退方案
    async simulateCloudFunction(functionName, data) {
        console.log('=== 使用模拟数据 ===');
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 300));

        if (functionName === 'httpAPI') {
            return this.handleHTTPAPI(data);
        }

        if (functionName === 'payment') {
            return this.handlePaymentAPI(data);
        }

        return { success: false, message: '未知的云函数' };
    }

    // 处理HTTP API请求
    handleHTTPAPI(data) {
        const { action, collection } = data;
        
        switch (action) {
            case 'testConnection':
                return {
                    success: true,
                    data: {
                        message: '连接测试成功',
                        timestamp: new Date().toISOString(),
                        envId: this.envId
                    }
                };
                
            case 'get':
                return this.getMockData(collection, data.query);
                
            case 'add':
                return {
                    success: true,
                    data: {
                        _id: 'mock_' + Date.now(),
                        ...data.data,
                        createTime: new Date(),
                        updateTime: new Date()
                    }
                };
                
            case 'update':
                return {
                    success: true,
                    data: {
                        updated: 1,
                        updateTime: new Date()
                    }
                };
                
            case 'delete':
                return {
                    success: true,
                    data: {
                        deleted: 1
                    }
                };
                
            case 'getStats':
                return {
                    success: true,
                    data: {
                        productCount: 15,
                        orderCount: 128,
                        refundCount: 5,
                        userCount: 89
                    }
                };

            case 'checkWebAdmin':
                // 模拟管理员验证
                const { openid, adminKey } = data;
                console.log('模拟管理员验证:', { openid, adminKey });

                // 简单的模拟验证逻辑
                if (openid && openid.length > 10) {
                    return {
                        success: true,
                        isAdmin: true,
                        adminInfo: {
                            name: '管理员',
                            role: 'admin',
                            permissions: ['all']
                        }
                    };
                } else {
                    return {
                        success: false,
                        isAdmin: false,
                        message: '无效的OpenID'
                    };
                }

            default:
                return { success: false, message: '未知操作' };
        }
    }

    // 处理支付API请求
    handlePaymentAPI(data) {
        const { action } = data;
        
        switch (action) {
            case 'getRefundList':
                return {
                    success: true,
                    data: this.getMockRefunds(data.status)
                };
                
            case 'reviewRefund':
                return {
                    success: true,
                    data: {
                        message: '退款审核成功',
                        refundId: data.refundId,
                        status: data.reviewData.approved ? 'approved' : 'rejected'
                    }
                };
                
            case 'processRefund':
                return {
                    success: true,
                    data: {
                        message: '退款处理成功',
                        refundId: data.refundId,
                        status: 'completed'
                    }
                };
                
            default:
                return { success: false, message: '未知支付操作' };
        }
    }

    // 获取模拟数据
    getMockData(collection, query = {}) {
        const mockData = {
            products: [
                {
                    _id: 'product1',
                    title: '新疆旅游北疆西疆12日11晚',
                    price: 3999,
                    region: '新疆',
                    status: 'active',
                    createTime: '2025-01-01 10:00:00',
                    images: ['https://example.com/image1.jpg']
                },
                {
                    _id: 'product2',
                    title: '张家界森林公园3日游',
                    price: 1899,
                    region: '湖南',
                    status: 'active',
                    createTime: '2025-01-02 14:30:00',
                    images: ['https://example.com/image2.jpg']
                },
                {
                    _id: 'product3',
                    title: '云南大理丽江双飞6日游',
                    price: 2599,
                    region: '云南',
                    status: 'active',
                    createTime: '2025-01-03 09:15:00',
                    images: ['https://example.com/image3.jpg']
                }
            ],
            orders: [
                {
                    _id: 'order1',
                    orderNo: 'T175424818024955743K',
                    productTitle: '新疆旅游北疆西疆12日11晚',
                    totalPrice: 3999,
                    status: 'paid',
                    contactName: '张三',
                    contactPhone: '13800138000',
                    createTime: '2025-01-08 10:30:00'
                },
                {
                    _id: 'order2',
                    orderNo: 'T175424818024955744K',
                    productTitle: '张家界森林公园3日游',
                    totalPrice: 1899,
                    status: 'confirmed',
                    contactName: '李四',
                    contactPhone: '13900139000',
                    createTime: '2025-01-07 15:20:00'
                },
                {
                    _id: 'order3',
                    orderNo: 'T175424818024955745K',
                    productTitle: '云南大理丽江双飞6日游',
                    totalPrice: 2599,
                    status: 'completed',
                    contactName: '王五',
                    contactPhone: '13700137000',
                    createTime: '2025-01-06 11:45:00'
                }
            ],
            banners: [
                {
                    _id: 'banner1',
                    title: '新疆旅游特惠',
                    imageUrl: 'https://example.com/banner1.jpg',
                    linkUrl: '/pages/product-detail/product-detail?id=product1',
                    sort: 1,
                    status: 'active',
                    createTime: '2025-01-01 12:00:00'
                },
                {
                    _id: 'banner2',
                    title: '张家界风景',
                    imageUrl: 'https://example.com/banner2.jpg',
                    linkUrl: '/pages/product-detail/product-detail?id=product2',
                    sort: 2,
                    status: 'active',
                    createTime: '2025-01-02 16:30:00'
                }
            ]
        };
        
        let data = mockData[collection] || [];
        
        // 应用查询条件
        if (query && query.where) {
            data = data.filter(item => {
                for (const [key, value] of Object.entries(query.where)) {
                    if (item[key] !== value) return false;
                }
                return true;
            });
        }
        
        // 应用限制
        if (query && query.limit) {
            data = data.slice(0, query.limit);
        }
        
        return { success: true, data };
    }

    // 获取模拟退款数据
    getMockRefunds(status) {
        const allRefunds = [
            {
                _id: 'refund1',
                outRefundNo: 'RF20250108001',
                orderNo: 'T175424818024955743K',
                amount: 3999,
                reason: '行程取消，申请全额退款',
                status: 'pending',
                applyTime: new Date('2025-01-08 10:30:00'),
                createTime: new Date('2025-01-08 10:30:00')
            },
            {
                _id: 'refund2',
                outRefundNo: 'RF20250107001',
                orderNo: 'T175424818024955744K',
                amount: 1899,
                reason: '个人原因无法出行',
                status: 'approved',
                applyTime: new Date('2025-01-07 14:20:00'),
                reviewTime: new Date('2025-01-07 15:30:00'),
                createTime: new Date('2025-01-07 14:20:00')
            },
            {
                _id: 'refund3',
                outRefundNo: 'RF20250106001',
                orderNo: 'T175424818024955745K',
                amount: 2599,
                reason: '服务不满意',
                status: 'rejected',
                applyTime: new Date('2025-01-06 09:15:00'),
                reviewTime: new Date('2025-01-06 16:45:00'),
                reviewNote: '不符合退款条件',
                createTime: new Date('2025-01-06 09:15:00')
            }
        ];
        
        if (status && status !== 'all') {
            return allRefunds.filter(refund => refund.status === status);
        }
        
        return allRefunds;
    }

    // 测试连接
    async testConnection() {
        try {
            console.log('=== 测试数据库连接 ===');

            // 首先测试代理服务器是否可用
            try {
                const healthCheck = await fetch(`${this.proxyUrl}/api/health`);
                if (healthCheck.ok) {
                    console.log('代理服务器连接正常');
                } else {
                    throw new Error('代理服务器不可用');
                }
            } catch (error) {
                console.warn('代理服务器连接失败:', error.message);
                this.showMessage('代理服务器未启动，请先启动服务器', 'error');
                this.isConnected = false;
                this.updateConnectionStatus();
                return { success: false, message: '代理服务器未启动' };
            }

            // 测试云函数调用
            const result = await this.callCloudFunction('httpAPI', {
                action: 'testConnection'
            });

            this.isConnected = result.success;
            this.updateConnectionStatus();

            if (result.success) {
                this.showMessage('数据库连接测试成功', 'success');
            } else {
                this.showMessage('数据库连接测试失败', 'error');
            }

            return result;
        } catch (error) {
            console.error('连接测试失败:', error);
            this.isConnected = false;
            this.updateConnectionStatus();
            this.showMessage('连接测试失败: ' + error.message, 'error');
            return { success: false, message: error.message };
        }
    }

    // 更新连接状态显示
    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            const icon = statusElement.querySelector('i');
            if (this.isConnected) {
                statusElement.className = 'connection-status connected';
                icon.className = 'fas fa-circle';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> 已连接';
            } else {
                statusElement.className = 'connection-status disconnected';
                icon.className = 'fas fa-circle';
                statusElement.innerHTML = '<i class="fas fa-circle"></i> 未连接';
            }
        }
    }
}

// 创建全局API实例
const api = new SimpleAPI();
