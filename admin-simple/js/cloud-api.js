// 云开发直连API - 无需access_token
class CloudAPI {
    constructor() {
        this.envId = 'new-travel-2gy6d6oy7ee5fb0e';
        this.isConnected = false;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
        this.proxyUrl = 'http://localhost:3001'; // 代理服务器地址

        console.log('CloudAPI 初始化完成 - 真实数据版');
        console.log('环境ID:', this.envId);
        console.log('代理服务器:', this.proxyUrl);

        // 测试代理服务器连接
        this.testProxyConnection();
    }

    // 测试代理服务器连接
    async testProxyConnection() {
        try {
            console.log('测试代理服务器连接...');
            const response = await fetch(`${this.proxyUrl}/api/health`);

            if (response.ok) {
                const result = await response.json();
                console.log('代理服务器连接成功:', result);
                this.isConnected = true;
                this.showMessage('已连接到真实数据库', 'success');
            } else {
                throw new Error('代理服务器响应异常');
            }
        } catch (error) {
            console.error('代理服务器连接失败:', error);
            this.isConnected = false;
            this.showMessage('代理服务器未启动，请先启动服务器', 'error');
        }

        this.updateConnectionStatus();
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
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(messageDiv);
        
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

    // 调用云函数 - 通过代理服务器获取真实数据
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

            // 通过代理服务器调用真实云函数
            console.log('通过代理服务器调用真实云函数');
            const response = await fetch(`${this.proxyUrl}/api/cloud-function`, {
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
                throw new Error(`代理服务器调用失败: ${response.status}`);
            }

            const result = await response.json();
            console.log('云函数调用结果:', result);

            // 缓存GET请求的结果
            if (data.action === 'get' && result && result.success) {
                this.setCache(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error('云函数调用失败:', error);
            this.showMessage('云函数调用失败: ' + error.message, 'error');
            throw error;
        }
    }

    // 专门用于获取退款数据的方法
    async getRefundList(status = 'all') {
        try {
            console.log('获取退款列表，状态:', status);

            const result = await this.callCloudFunction('payment', {
                action: 'getRefundList',
                status: status
            });

            return result;
        } catch (error) {
            console.error('获取退款列表失败:', error);
            throw error;
        }
    }

    // 审核退款
    async reviewRefund(refundId, approved, note = '') {
        try {
            console.log('审核退款:', { refundId, approved, note });

            const result = await this.callCloudFunction('payment', {
                action: 'reviewRefund',
                refundId: refundId,
                reviewData: {
                    approved: approved,
                    reviewerId: 'admin', // 管理员ID
                    note: note || (approved ? '管理员审核通过' : '管理员审核拒绝')
                }
            });

            return result;
        } catch (error) {
            console.error('审核退款失败:', error);
            throw error;
        }
    }

    // 处理退款
    async processRefund(refundId) {
        try {
            console.log('处理退款:', refundId);

            const result = await this.callCloudFunction('payment', {
                action: 'processRefund',
                refundId: refundId
            });

            return result;
        } catch (error) {
            console.error('处理退款失败:', error);
            throw error;
        }
    }



    // 测试连接
    async testConnection() {
        try {
            console.log('=== 测试数据库连接 ===');
            
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
                statusElement.innerHTML = '<i class="fas fa-circle"></i> 模拟模式';
            }
        }
    }
}

// 创建全局API实例
const api = new CloudAPI();
