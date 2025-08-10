// 简化版应用主逻辑
class SimpleApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.data = {
            products: [],
            orders: [],
            refunds: [],
            banners: [],
            stats: {}
        };
        this.adminInfo = null;

        this.init();
    }

    // 初始化应用
    async init() {
        console.log('初始化真实数据管理后台...');

        // 检查登录状态（但不阻止应用初始化）
        this.checkLoginStatus();

        // 等待代理服务器连接测试完成
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 测试连接
        try {
            await api.testConnection();
        } catch (error) {
            console.error('连接测试失败:', error);
        }

        // 加载初始数据
        await this.loadDashboardData();

        console.log('初始化完成');
    }

    // 显示环境提示
    showEnvironmentTip() {
        const tipDiv = document.createElement('div');
        tipDiv.className = 'environment-tip';
        tipDiv.innerHTML = `
            <div class="tip-content">
                <h3>🔧 环境提示</h3>
                <p>当前在普通浏览器中运行，无法连接到云数据库。</p>
                <p><strong>要获取真实数据，请：</strong></p>
                <ol>
                    <li>打开微信开发者工具</li>
                    <li>导入您的小程序项目</li>
                    <li>在开发者工具中打开此管理后台页面</li>
                </ol>
                <button onclick="this.parentNode.parentNode.remove()">知道了</button>
            </div>
        `;

        document.body.appendChild(tipDiv);
    }

    // 切换页面
    async switchPage(pageName) {
        console.log('切换到页面:', pageName);

        try {
            // 更新导航状态
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            const navButton = document.querySelector(`[data-page="${pageName}"]`);
            if (navButton) {
                navButton.classList.add('active');
            } else {
                console.warn('找不到导航按钮:', pageName);
            }

            // 更新页面内容
            document.querySelectorAll('.page-content').forEach(page => {
                page.classList.remove('active');
            });

            const pageElement = document.getElementById(pageName);
            if (pageElement) {
                pageElement.classList.add('active');
                console.log('页面切换成功:', pageName);
                console.log('继续执行后续代码...');
            } else {
                console.error('找不到页面元素:', pageName);
                return;
            }

            console.log('设置当前页面:', pageName);
            this.currentPage = pageName;
            console.log('当前页面已设置为:', this.currentPage);

            // 加载页面数据
            console.log('准备加载页面数据:', pageName);

            // 特殊处理轮播图页面
            if (pageName === 'banners') {
                console.log('检测到轮播图页面，直接调用loadBannersData');
                try {
                    await this.loadBannersData();
                    console.log('轮播图数据加载完成');
                } catch (loadError) {
                    console.error('轮播图数据加载失败:', loadError);
                }
            } else {
                try {
                    await this.loadPageData(pageName);
                    console.log('页面数据加载完成:', pageName);
                } catch (loadError) {
                    console.error('加载页面数据失败:', loadError);
                }
            }

        } catch (error) {
            console.error('切换页面失败:', error);
        }
    }

    // 加载页面数据
    async loadPageData(pageName) {
        console.log('loadPageData被调用，页面:', pageName);
        switch (pageName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'products':
                await this.loadProductsData();
                break;
            case 'orders':
                await this.loadOrdersData();
                break;
            case 'refunds':
                await this.loadRefundsData();
                break;
            case 'banners':
                await this.loadBannersData();
                break;
            case 'settings':
                // 系统设置页面不需要加载数据
                break;
        }
    }

    // 加载仪表盘数据
    async loadDashboardData() {
        try {
            api.showLoading('加载统计数据...');
            
            // 获取统计数据
            const statsResult = await api.callCloudFunction('httpAPI', {
                action: 'getStats'
            });
            
            if (statsResult.success) {
                this.data.stats = statsResult.data;
                this.updateStatsDisplay();
            }
            
            // 获取最近订单
            const ordersResult = await api.callCloudFunction('httpAPI', {
                action: 'get',
                collection: 'orders'
            });

            if (ordersResult.success) {
                // 按创建时间降序排序并取前5个
                const sortedOrders = (ordersResult.data || []).sort((a, b) => {
                    const timeA = new Date(a.createTime);
                    const timeB = new Date(b.createTime);
                    return timeB - timeA; // 降序排序
                }).slice(0, 5);

                this.updateRecentOrdersTable(sortedOrders);
            }
            
        } catch (error) {
            api.showMessage('加载仪表盘数据失败', 'error');
        } finally {
            api.hideLoading();
        }
    }

    // 更新统计数据显示
    updateStatsDisplay() {
        const stats = this.data.stats;
        document.getElementById('productCount').textContent = stats.productCount || 0;
        document.getElementById('orderCount').textContent = stats.orderCount || 0;
        document.getElementById('refundCount').textContent = stats.refundCount || 0;
        document.getElementById('userCount').textContent = stats.userCount || 0;
    }

    // 更新最近订单表格
    updateRecentOrdersTable(orders) {
        const tbody = document.getElementById('recentOrdersTable');
        
        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">暂无数据</td></tr>';
            return;
        }
        
        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.orderNo}</td>
                <td>${order.productTitle}</td>
                <td>¥${order.totalPrice}</td>
                <td><span class="status status-${order.status}">${this.getStatusText(order.status)}</span></td>
                <td>${this.formatDate(order.createTime)}</td>
            </tr>
        `).join('');
    }

    // 加载产品数据
    async loadProductsData() {
        try {
            api.showLoading('加载产品数据...');

            const result = await api.callCloudFunction('httpAPI', {
                action: 'get',
                collection: 'products'
            });

            if (result && result.success) {
                this.data.products = result.data || [];
                this.updateProductsTable();
                console.log('产品数据加载成功:', this.data.products.length, '个产品');
            } else {
                console.error('获取产品数据失败:', result);
                api.showMessage('获取产品数据失败: ' + (result?.message || '未知错误'), 'error');
                this.data.products = [];
                this.updateProductsTable();
            }

        } catch (error) {
            console.error('加载产品数据异常:', error);
            api.showMessage('加载产品数据失败: ' + error.message, 'error');
            this.data.products = [];
            this.updateProductsTable();
        } finally {
            api.hideLoading();
        }
    }

    // 更新产品表格
    updateProductsTable() {
        const tbody = document.getElementById('productsTable');
        const products = this.data.products;

        if (!products || products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">暂无产品数据</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <div class="product-info">
                        <div class="product-title">${product.title || '未知产品'}</div>
                        <div class="product-id">ID: ${product._id}</div>
                    </div>
                </td>
                <td>
                    <div class="price-info">
                        <div class="adult-price">成人: ¥${product.adultPrice || 0}</div>
                        <div class="child-price">儿童: ¥${product.childPrice || 0}</div>
                    </div>
                </td>
                <td>
                    <div class="region-info">
                        <span class="region-tag">${product.region || '未知地区'}</span>
                    </div>
                </td>
                <td>
                    <div class="status-info">
                        <span class="status status-${product.status || 'unknown'}">${this.getStatusText(product.status || 'unknown')}</span>
                    </div>
                </td>
                <td>
                    <div class="date-info">
                        <div class="date-main">${this.formatDate(product.createTime)}</div>
                        <div class="date-time">${this.formatTime(product.createTime)}</div>
                    </div>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-primary" onclick="editProduct('${product._id}')" title="编辑产品">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-small btn-secondary" onclick="viewProduct('${product._id}')" title="查看详情">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-small btn-danger" onclick="deleteProduct('${product._id}')" title="删除产品">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // 加载订单数据
    async loadOrdersData() {
        try {
            api.showLoading('加载订单数据...');

            const result = await api.callCloudFunction('httpAPI', {
                action: 'get',
                collection: 'orders'
            });

            if (result && result.success) {
                this.data.orders = result.data || [];

                // 按创建时间降序排序（最新的在前面）
                this.data.orders.sort((a, b) => {
                    const timeA = new Date(a.createTime);
                    const timeB = new Date(b.createTime);
                    return timeB - timeA; // 降序排序
                });

                this.updateOrdersTable();
                console.log('订单数据加载成功:', this.data.orders.length, '个订单');
            } else {
                console.error('获取订单数据失败:', result);
                api.showMessage('获取订单数据失败: ' + (result?.message || '未知错误'), 'error');
                this.data.orders = [];
                this.updateOrdersTable();
            }

        } catch (error) {
            console.error('加载订单数据异常:', error);
            api.showMessage('加载订单数据失败: ' + error.message, 'error');
            this.data.orders = [];
            this.updateOrdersTable();
        } finally {
            api.hideLoading();
        }
    }

    // 更新订单表格
    updateOrdersTable() {
        const tbody = document.getElementById('ordersTable');
        const orders = this.data.orders;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">暂无订单数据</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>
                    <div class="order-info">
                        <div class="order-no">${order.orderNo || '未知订单号'}</div>
                        <div class="order-id">ID: ${order._id}</div>
                    </div>
                </td>
                <td>
                    <div class="product-info">
                        <div class="product-title">${order.productTitle || '未知产品'}</div>
                        <div class="travel-date">出行: ${order.travelDate || '未设置'}</div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        <div class="contact-name">${order.contactName || '未知'}</div>
                        <div class="contact-phone">${order.contactPhone || '未知'}</div>
                    </div>
                </td>
                <td>
                    <div class="price-info">
                        <div class="total-price">¥${order.totalPrice || 0}</div>
                        <div class="people-count">${order.adultCount || 0}成人 ${order.childCount || 0}儿童</div>
                    </div>
                </td>
                <td><span class="status status-${order.status || 'unknown'}">${this.getStatusText(order.status || 'unknown')}</span></td>
                <td>${this.formatDate(order.createTime)}</td>
                <td>
                    <button class="btn-small btn-primary" onclick="viewOrderDetail('${order._id}')">详情</button>
                    ${order.status === 'paid' ? `<button class="btn-small btn-success" onclick="confirmOrder('${order._id}')">确认</button>` : ''}
                    ${order.status === 'pending' ? `<button class="btn-small btn-warning" onclick="cancelOrder('${order._id}')">取消</button>` : ''}
                </td>
            </tr>
        `).join('');
    }

    // 加载退款数据
    async loadRefundsData() {
        try {
            api.showLoading('加载退款数据...');

            // 使用专门的退款获取方法
            const result = await api.getRefundList('all');

            if (result && result.success) {
                this.data.refunds = result.data || [];
                this.updateRefundsTable();
            } else {
                console.error('获取退款数据失败:', result);
                api.showMessage('获取退款数据失败: ' + (result?.message || '未知错误'), 'error');
                this.data.refunds = [];
                this.updateRefundsTable();
            }

        } catch (error) {
            console.error('加载退款数据异常:', error);
            api.showMessage('请在微信开发者工具中打开此页面', 'error');
            this.data.refunds = [];
            this.updateRefundsTable();
        } finally {
            api.hideLoading();
        }
    }

    // 加载轮播图数据
    async loadBannersData() {
        console.log('开始加载轮播图数据...');
        try {
            api.showLoading('加载轮播图数据...');

            const result = await api.callCloudFunction('httpAPI', {
                action: 'get',
                collection: 'banners'
            });

            console.log('轮播图API调用结果:', result);

            if (result && result.success) {
                this.data.banners = result.data || [];
                this.updateBannersGrid();
                console.log('轮播图数据加载成功:', this.data.banners.length, '个轮播图');
            } else {
                console.error('获取轮播图数据失败:', result);
                api.showMessage('获取轮播图数据失败: ' + (result?.message || '未知错误'), 'error');
                this.data.banners = [];
                this.updateBannersGrid();
            }

        } catch (error) {
            console.error('加载轮播图数据异常:', error);
            api.showMessage('加载轮播图数据失败: ' + error.message, 'error');
            this.data.banners = [];
            this.updateBannersGrid();
        } finally {
            api.hideLoading();
        }
    }

    // 更新轮播图网格
    updateBannersGrid() {
        const grid = document.getElementById('bannersGrid');
        if (!grid) {
            console.error('找不到轮播图网格元素 #bannersGrid');
            return;
        }

        console.log('更新轮播图网格，数据:', this.data.banners);

        if (!this.data.banners || this.data.banners.length === 0) {
            grid.innerHTML = '<div class="no-data">暂无轮播图数据</div>';
            return;
        }

        grid.innerHTML = this.data.banners.map(banner => `
            <div class="banner-card">
                <div class="banner-image">
                    <img src="${banner.imageUrl || banner.image || ''}"
                         alt="${banner.title || '轮播图'}"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDMwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iNzUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWKoOi9veWbvueJhzwvdGV4dD4KPC9zdmc+'">
                </div>
                <div class="banner-info">
                    <h4>${banner.title || '未知标题'}</h4>
                    <p class="banner-description">${banner.description || '暂无描述'}</p>
                    <p class="banner-id"><strong>轮播图ID:</strong> <code>${banner._id}</code></p>
                    ${banner.productId ? `<p class="banner-product-id"><strong>产品ID:</strong> ${banner.productId}</p>` : ''}
                    ${banner.linkUrl ? `<p class="banner-link"><strong>链接:</strong> ${banner.linkUrl}</p>` : ''}
                    <div class="banner-meta">
                        <span class="banner-order">排序: ${banner.order || banner.sort || 0}</span>
                        <span class="banner-status ${(banner.isActive !== false && banner.active !== false && banner.status !== 'inactive') ? 'active' : 'inactive'}">
                            ${(banner.isActive !== false && banner.active !== false && banner.status !== 'inactive') ? '启用' : '禁用'}
                        </span>
                    </div>
                    <div class="banner-actions">
                        <button class="btn-edit" onclick="editBanner('${banner._id}')">
                            <i class="fas fa-edit"></i> 编辑
                        </button>
                        <button class="btn-delete" onclick="deleteBanner('${banner._id}')">
                            <i class="fas fa-trash"></i> 删除
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // 更新退款表格
    updateRefundsTable() {
        const tbody = document.getElementById('refundsTable');
        const refunds = this.data.refunds;
        
        if (refunds.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">暂无数据</td></tr>';
            return;
        }
        
        tbody.innerHTML = refunds.map(refund => `
            <tr>
                <td>${refund.outRefundNo}</td>
                <td>${refund.orderNo}</td>
                <td>¥${refund.amount}</td>
                <td>${refund.reason}</td>
                <td><span class="status status-${refund.status}">${this.getRefundStatusText(refund.status)}</span></td>
                <td>${this.formatDate(refund.createTime)}</td>
                <td>
                    <button class="btn-small btn-primary" onclick="viewRefundDetail('${refund._id}')">详情</button>
                    ${refund.status === 'pending' ? `
                        <button class="btn-small btn-success" onclick="approveRefund('${refund._id}')">通过</button>
                        <button class="btn-small btn-danger" onclick="rejectRefund('${refund._id}')">拒绝</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }



    // 获取状态文本
    getStatusText(status) {
        const statusMap = {
            'active': '启用',
            'inactive': '禁用',
            'pending': '待付款',
            'paying': '支付中',
            'paid': '已付款',
            'confirmed': '已确认',
            'completed': '已完成',
            'cancelled': '已取消',
            'refund_pending': '退款申请中',
            'refunded': '已退款',
            'unknown': '未知状态',
            'draft': '草稿',
            'published': '已发布',
            'archived': '已归档'
        };
        return statusMap[status] || status || '未知';
    }

    // 获取退款状态文本
    getRefundStatusText(status) {
        const statusMap = {
            'pending': '待审核',
            'approved': '已通过',
            'rejected': '已拒绝',
            'completed': '已完成',
            'failed': '失败'
        };
        return statusMap[status] || status;
    }

    // 格式化日期
    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN');
    }

    // 格式化时间
    formatTime(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 检查登录状态
    checkLoginStatus() {
        const adminInfo = localStorage.getItem('adminInfo');

        if (!adminInfo) {
            console.log('未检测到登录信息，以访客模式运行');
            this.showLoginPrompt();
            return false;
        }

        try {
            this.adminInfo = JSON.parse(adminInfo);

            // 检查登录是否过期（24小时）
            const loginTime = new Date(this.adminInfo.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);

            if (hoursDiff >= 24) {
                localStorage.removeItem('adminInfo');
                console.log('登录已过期，以访客模式运行');
                this.showLoginPrompt();
                return false;
            }

            // 显示管理员信息
            this.displayAdminInfo();
            return true;

        } catch (error) {
            console.error('解析管理员信息失败:', error);
            localStorage.removeItem('adminInfo');
            this.showLoginPrompt();
            return false;
        }
    }

    // 显示登录提示（不跳转）
    showLoginPrompt() {
        // 在现有header中添加登录提示
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const loginPrompt = document.createElement('div');
            loginPrompt.className = 'login-prompt-inline';
            loginPrompt.innerHTML = `
                <span class="prompt-text">
                    <i class="fas fa-info-circle"></i>
                    访客模式
                </span>
                <a href="login.html" class="login-link-inline">
                    <i class="fas fa-sign-in-alt"></i>
                    登录
                </a>
            `;
            headerActions.insertBefore(loginPrompt, headerActions.firstChild);
        }
    }

    // 跳转到登录页
    redirectToLogin(message) {
        if (message) {
            // 将消息保存到sessionStorage，登录页可以显示
            sessionStorage.setItem('loginMessage', message);
        }
        window.location.href = 'login.html';
    }

    // 显示管理员信息
    displayAdminInfo() {
        if (!this.adminInfo) return;

        // 在现有header中添加管理员信息
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            const adminInfo = document.createElement('div');
            adminInfo.className = 'admin-info-inline';
            adminInfo.innerHTML = `
                <span class="admin-name-inline">
                    <i class="fas fa-user-shield"></i>
                    ${this.adminInfo.name}
                    ${this.adminInfo.isSuperAdmin ? '<span class="super-admin-badge-inline">超管</span>' : '<span class="admin-badge-inline">管理员</span>'}
                </span>
                <div class="admin-actions-inline">
                    <button class="btn-link-inline" onclick="app.showAdminProfile()" title="管理员设置">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="btn-link-inline" onclick="app.logout()" title="退出登录">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            `;
            headerActions.insertBefore(adminInfo, headerActions.firstChild);
        }
    }

    // 显示管理员资料
    showAdminProfile() {
        const profileHtml = `
            <div class="modal-overlay" onclick="closeAdminProfile()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>管理员资料</h3>
                        <button class="close-btn" onclick="closeAdminProfile()">×</button>
                    </div>
                    <div class="admin-profile">
                        <div class="profile-item">
                            <label>姓名:</label>
                            <span>${this.adminInfo.name}</span>
                        </div>
                        <div class="profile-item">
                            <label>角色:</label>
                            <span>${this.adminInfo.isSuperAdmin ? '超级管理员' : '普通管理员'}</span>
                        </div>
                        <div class="profile-item">
                            <label>OpenID:</label>
                            <span class="openid">${this.adminInfo.openid}</span>
                        </div>
                        <div class="profile-item">
                            <label>权限:</label>
                            <div class="permissions">
                                ${this.adminInfo.permissions.map(p => `<span class="permission-tag">${this.getPermissionName(p)}</span>`).join('')}
                            </div>
                        </div>
                        <div class="profile-item">
                            <label>登录时间:</label>
                            <span>${new Date(this.adminInfo.loginTime).toLocaleString('zh-CN')}</span>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeAdminProfile()">关闭</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', profileHtml);
    }

    // 获取权限名称
    getPermissionName(permission) {
        const names = {
            'products': '产品管理',
            'orders': '订单管理',
            'banners': '轮播图管理',
            'refunds': '退款管理',
            'admins': '管理员管理'
        };
        return names[permission] || permission;
    }

    // 退出登录
    logout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('adminInfo');
            sessionStorage.setItem('loginMessage', '已成功退出登录');
            window.location.href = 'login.html';
        }
    }
}

// 全局函数
async function switchPage(pageName) {
    console.log('全局switchPage被调用，参数:', pageName);
    try {
        if (!app) {
            console.error('app对象不存在!');
            return;
        }
        console.log('调用app.switchPage...');
        await app.switchPage(pageName);
    } catch (error) {
        console.error('switchPage执行失败:', error);
    }
}

function refreshCurrentPage() {
    app.loadPageData(app.currentPage);
    api.showMessage('页面已刷新', 'success');
}

// 刷新轮播图数据
async function refreshBannerData() {
    // 如果在轮播图页面，刷新页面数据
    if (app.currentPage === 'banners') {
        await app.loadBannersData();
    }
}

// 产品相关操作
function showAddProductModal() {
    // 创建空的产品对象用于添加
    const emptyProduct = {
        title: '',
        description: '',
        adultPrice: '',
        childPrice: '',
        region: '',
        coverImage: '',
        images: [],
        detailImages: [],
        tags: [],
        status: 'active',
        fees: [
            { type: '包含', description: '' },
            { type: '不包含', description: '' }
        ],
        itinerary: [],
        notices: [],
        priceCalendar: {}
    };

    openProductModal(emptyProduct, false);
}

function editProduct(id) {
    const product = app.data.products.find(p => p._id === id);
    if (!product) {
        api.showMessage('产品不存在', 'error');
        return;
    }

    // 创建完整的产品编辑表单
    openProductModal(product, true);
}

// 旧的编辑和保存函数已被新的完整产品模态框替代

// 打开完整的产品编辑模态框
function openProductModal(product, isEdit = false) {
    const modalId = 'productModal';

    // 如果已存在模态框，先移除
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
        existingModal.remove();
    }

    // 确保数组字段存在
    product.images = product.images || [];
    product.detailImages = product.detailImages || [];
    product.tags = product.tags || [];
    product.fees = product.fees || [
        { type: '包含', description: '' },
        { type: '不包含', description: '' }
    ];
    product.itinerary = product.itinerary || [];
    product.notices = product.notices || [];
    product.priceCalendar = product.priceCalendar || {};

    const formHtml = `
        <div id="${modalId}" class="product-modal-overlay" onclick="closeProductModal()">
            <div class="product-modal-container" onclick="event.stopPropagation()">
                <div class="product-modal-header">
                    <h3>${isEdit ? '编辑产品' : '添加产品'}</h3>
                    <button class="close-btn" onclick="closeProductModal()">×</button>
                </div>

                <div class="product-modal-content">
                    <form id="productForm" onsubmit="saveProduct(event, ${isEdit}, '${product._id || ''}')">

                        <!-- 基本信息 -->
                        <div class="form-section">
                            <h4 class="section-title">基本信息</h4>

                            <div class="form-group">
                                <label>产品标题 *</label>
                                <input type="text" name="title" value="${product.title || ''}" placeholder="请输入产品标题" required>
                            </div>

                            <div class="form-group">
                                <label>产品描述 *</label>
                                <textarea name="description" rows="4" placeholder="请输入产品描述" required>${product.description || ''}</textarea>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label>成人价格 *</label>
                                    <input type="number" name="adultPrice" value="${product.adultPrice || ''}" step="0.01" placeholder="请输入成人价格" required>
                                </div>
                                <div class="form-group">
                                    <label>儿童价格</label>
                                    <input type="number" name="childPrice" value="${product.childPrice || ''}" step="0.01" placeholder="请输入儿童价格">
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label>所属区域 *</label>
                                    <input type="text" name="region" value="${product.region || ''}" placeholder="请输入区域" required>
                                </div>
                                <div class="form-group">
                                    <label>状态</label>
                                    <select name="status">
                                        <option value="active" ${product.status === 'active' ? 'selected' : ''}>启用</option>
                                        <option value="inactive" ${product.status === 'inactive' ? 'selected' : ''}>禁用</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- 标签管理 -->
                        <div class="form-section">
                            <h4 class="section-title">产品标签</h4>
                            <div class="tags-container">
                                <div class="tags-list" id="tagsList">
                                    ${product.tags.map((tag, index) => `
                                        <span class="tag-item">
                                            ${tag}
                                            <button type="button" class="tag-remove" onclick="removeTag(${index})">×</button>
                                        </span>
                                    `).join('')}
                                </div>
                                <div class="tag-input-container">
                                    <input type="text" id="newTagInput" placeholder="输入标签后按回车添加" onkeypress="handleTagKeyPress(event)">
                                    <button type="button" onclick="addTag()">添加标签</button>
                                </div>
                            </div>
                        </div>

                        <!-- 图片管理 -->
                        <div class="form-section">
                            <h4 class="section-title">图片管理</h4>

                            <!-- 封面图片 -->
                            <div class="form-group">
                                <label>封面图片</label>
                                <div class="image-upload-container">
                                    <div class="upload-methods">
                                        <div class="upload-method">
                                            <label class="upload-btn">
                                                <input type="file" accept="image/*" onchange="handleCoverImageUpload(event)" style="display: none;">
                                                📁 上传封面图片
                                            </label>
                                            <small>支持 JPG、PNG、GIF 格式，建议尺寸 800x600</small>
                                        </div>
                                        <div class="upload-method">
                                            <input type="url" name="coverImage" value="${product.coverImage || ''}" placeholder="或输入图片URL: https://example.com/image.jpg">
                                        </div>
                                    </div>
                                    <div class="image-preview" id="coverImagePreview">
                                        ${product.coverImage ? `<img src="${product.coverImage}" alt="封面图片预览" style="max-width: 200px; max-height: 150px;">` : ''}
                                    </div>
                                </div>
                            </div>

                            <!-- 主图 -->
                            <div class="form-group">
                                <label>主图</label>
                                <div class="image-upload-container">
                                    <div class="upload-methods">
                                        <div class="upload-method">
                                            <label class="upload-btn">
                                                <input type="file" accept="image/*" multiple onchange="handleMainImagesUpload(event)" style="display: none;">
                                                📁 上传主图（可多选）
                                            </label>
                                            <small>支持多张图片，建议尺寸 800x600</small>
                                        </div>
                                        <div class="upload-method">
                                            <textarea name="images" rows="3" placeholder="或输入多个图片URL，用逗号分隔: https://example.com/image1.jpg,https://example.com/image2.jpg">${(product.images || []).join(',')}</textarea>
                                        </div>
                                    </div>
                                    <div class="images-preview" id="mainImagesPreview">
                                        ${(product.images || []).map(img => `<img src="${img}" alt="主图预览" style="max-width: 150px; max-height: 100px; margin: 5px;">`).join('')}
                                    </div>
                                </div>
                            </div>

                            <!-- 详情图片 -->
                            <div class="form-group">
                                <label>详情图片</label>
                                <div class="image-upload-container">
                                    <div class="upload-methods">
                                        <div class="upload-method">
                                            <label class="upload-btn">
                                                <input type="file" accept="image/*" multiple onchange="handleDetailImagesUpload(event)" style="display: none;">
                                                📁 上传详情图片（可多选）
                                            </label>
                                            <small>支持多张图片，用于产品详情展示</small>
                                        </div>
                                        <div class="upload-method">
                                            <textarea name="detailImages" rows="3" placeholder="或输入多个图片URL，用逗号分隔: https://example.com/detail1.jpg,https://example.com/detail2.jpg">${(product.detailImages || []).join(',')}</textarea>
                                        </div>
                                    </div>
                                    <div class="images-preview" id="detailImagesPreview">
                                        ${(product.detailImages || []).map(img => `<img src="${img}" alt="详情图片预览" style="max-width: 150px; max-height: 100px; margin: 5px;">`).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 行程安排 -->
                        <div class="form-section">
                            <h4 class="section-title">
                                行程安排
                                <button type="button" class="btn-add-small" onclick="addItineraryItem()">添加行程</button>
                            </h4>
                            <div class="itinerary-container" id="itineraryContainer">
                                ${product.itinerary.map((item, index) => `
                                    <div class="itinerary-item" data-index="${index}">
                                        <div class="itinerary-header">
                                            <span class="day-title">第${index + 1}天</span>
                                            <button type="button" class="btn-remove-small" onclick="removeItineraryItem(${index})">删除</button>
                                        </div>
                                        <div class="rich-editor-container">
                                            <div class="editor-toolbar">
                                                <button type="button" onclick="formatText('bold', ${index}, 'itinerary')"><b>B</b></button>
                                                <button type="button" onclick="formatText('italic', ${index}, 'itinerary')"><i>I</i></button>
                                                <button type="button" onclick="formatText('underline', ${index}, 'itinerary')"><u>U</u></button>
                                            </div>
                                            <div class="rich-editor" contenteditable="true" data-index="${index}" data-type="itinerary" onblur="updateItineraryContent(${index})">${item || ''}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 费用说明 -->
                        <div class="form-section">
                            <h4 class="section-title">
                                费用说明
                                <button type="button" class="btn-add-small" onclick="addFeeItem('包含')">添加包含费用</button>
                                <button type="button" class="btn-add-small" onclick="addFeeItem('不包含')">添加不包含费用</button>
                            </h4>
                            <div class="fees-container" id="feesContainer">
                                ${product.fees.map((fee, index) => `
                                    <div class="fee-item" data-index="${index}">
                                        <div class="fee-header">
                                            <span class="fee-type">${fee.type}费用</span>
                                            <button type="button" class="btn-remove-small" onclick="removeFeeItem(${index})">删除</button>
                                        </div>
                                        <div class="rich-editor-container">
                                            <div class="editor-toolbar">
                                                <button type="button" onclick="formatText('bold', ${index}, 'fee')"><b>B</b></button>
                                                <button type="button" onclick="formatText('italic', ${index}, 'fee')"><i>I</i></button>
                                                <button type="button" onclick="formatText('underline', ${index}, 'fee')"><u>U</u></button>
                                            </div>
                                            <div class="rich-editor" contenteditable="true" data-index="${index}" data-type="fee" onblur="updateFeeContent(${index})">${fee.description || ''}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 预订须知 -->
                        <div class="form-section">
                            <h4 class="section-title">
                                预订须知
                                <button type="button" class="btn-add-small" onclick="addNoticeItem()">添加须知</button>
                            </h4>
                            <div class="notices-container" id="noticesContainer">
                                ${product.notices.map((notice, index) => `
                                    <div class="notice-item" data-index="${index}">
                                        <div class="notice-header">
                                            <span class="notice-title">须知${index + 1}</span>
                                            <button type="button" class="btn-remove-small" onclick="removeNoticeItem(${index})">删除</button>
                                        </div>
                                        <div class="rich-editor-container">
                                            <div class="editor-toolbar">
                                                <button type="button" onclick="formatText('bold', ${index}, 'notice')"><b>B</b></button>
                                                <button type="button" onclick="formatText('italic', ${index}, 'notice')"><i>I</i></button>
                                                <button type="button" onclick="formatText('underline', ${index}, 'notice')"><u>U</u></button>
                                            </div>
                                            <div class="rich-editor" contenteditable="true" data-index="${index}" data-type="notice" onblur="updateNoticeContent(${index})">${notice || ''}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 价格日历 -->
                        <div class="form-section">
                            <h4 class="section-title">
                                价格日历
                                <button type="button" class="btn-add-small" onclick="showBatchSetModal()">批量设置</button>
                                <button type="button" class="btn-add-small" onclick="showRangeSetModal()">范围设置</button>
                            </h4>
                            <div class="calendar-container">
                                <div class="month-selector">
                                    <button type="button" class="month-arrow" onclick="prevMonth()">‹</button>
                                    <span class="month-text" id="currentMonthText">2025年8月</span>
                                    <button type="button" class="month-arrow" onclick="nextMonth()">›</button>
                                </div>

                                <div class="calendar-grid">
                                    <div class="week-header">
                                        <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
                                    </div>
                                    <div class="calendar-days" id="calendarDays">
                                        <!-- 日历天数将通过JavaScript生成 -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="closeProductModal()">取消</button>
                            <button type="submit" class="btn-primary">${isEdit ? '保存修改' : '添加产品'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', formHtml);

    // 存储当前编辑的产品数据
    window.currentEditingProduct = product;

    // 初始化日历
    window.currentCalendarMonth = new Date();
    generateCalendar();
}

// 关闭产品模态框
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.remove();
    }
    window.currentEditingProduct = null;
}

// 标签管理函数
function addTag() {
    const input = document.getElementById('newTagInput');
    const tag = input.value.trim();

    if (!tag) {
        api.showMessage('请输入标签内容', 'error');
        return;
    }

    if (!window.currentEditingProduct.tags) {
        window.currentEditingProduct.tags = [];
    }

    if (window.currentEditingProduct.tags.includes(tag)) {
        api.showMessage('标签已存在', 'error');
        return;
    }

    window.currentEditingProduct.tags.push(tag);
    input.value = '';

    // 更新标签显示
    updateTagsDisplay();
}

function removeTag(index) {
    if (window.currentEditingProduct.tags) {
        window.currentEditingProduct.tags.splice(index, 1);
        updateTagsDisplay();
    }
}

function handleTagKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addTag();
    }
}

function updateTagsDisplay() {
    const tagsList = document.getElementById('tagsList');
    if (tagsList && window.currentEditingProduct.tags) {
        tagsList.innerHTML = window.currentEditingProduct.tags.map((tag, index) => `
            <span class="tag-item">
                ${tag}
                <button type="button" class="tag-remove" onclick="removeTag(${index})">×</button>
            </span>
        `).join('');
    }
}

// 行程管理函数
function addItineraryItem() {
    if (!window.currentEditingProduct.itinerary) {
        window.currentEditingProduct.itinerary = [];
    }

    window.currentEditingProduct.itinerary.push('');
    updateItineraryDisplay();
}

function removeItineraryItem(index) {
    if (window.currentEditingProduct.itinerary) {
        window.currentEditingProduct.itinerary.splice(index, 1);
        updateItineraryDisplay();
    }
}

function updateItineraryContent(index) {
    const editor = document.querySelector(`[data-index="${index}"][data-type="itinerary"]`);
    if (editor && window.currentEditingProduct.itinerary) {
        window.currentEditingProduct.itinerary[index] = editor.innerHTML;
    }
}

function updateItineraryDisplay() {
    const container = document.getElementById('itineraryContainer');
    if (container && window.currentEditingProduct.itinerary) {
        container.innerHTML = window.currentEditingProduct.itinerary.map((item, index) => `
            <div class="itinerary-item" data-index="${index}">
                <div class="itinerary-header">
                    <span class="day-title">第${index + 1}天</span>
                    <button type="button" class="btn-remove-small" onclick="removeItineraryItem(${index})">删除</button>
                </div>
                <div class="rich-editor-container">
                    <div class="editor-toolbar">
                        <button type="button" onclick="formatText('bold', ${index}, 'itinerary')"><b>B</b></button>
                        <button type="button" onclick="formatText('italic', ${index}, 'itinerary')"><i>I</i></button>
                        <button type="button" onclick="formatText('underline', ${index}, 'itinerary')"><u>U</u></button>
                    </div>
                    <div class="rich-editor" contenteditable="true" data-index="${index}" data-type="itinerary" onblur="updateItineraryContent(${index})">${item || ''}</div>
                </div>
            </div>
        `).join('');
    }
}

// 费用管理函数
function addFeeItem(type) {
    if (!window.currentEditingProduct.fees) {
        window.currentEditingProduct.fees = [];
    }

    window.currentEditingProduct.fees.push({
        type: type,
        description: ''
    });
    updateFeesDisplay();
}

function removeFeeItem(index) {
    if (window.currentEditingProduct.fees) {
        window.currentEditingProduct.fees.splice(index, 1);
        updateFeesDisplay();
    }
}

function updateFeeContent(index) {
    const editor = document.querySelector(`[data-index="${index}"][data-type="fee"]`);
    if (editor && window.currentEditingProduct.fees && window.currentEditingProduct.fees[index]) {
        window.currentEditingProduct.fees[index].description = editor.innerHTML;
    }
}

function updateFeesDisplay() {
    const container = document.getElementById('feesContainer');
    if (container && window.currentEditingProduct.fees) {
        container.innerHTML = window.currentEditingProduct.fees.map((fee, index) => `
            <div class="fee-item" data-index="${index}">
                <div class="fee-header">
                    <span class="fee-type">${fee.type}费用</span>
                    <button type="button" class="btn-remove-small" onclick="removeFeeItem(${index})">删除</button>
                </div>
                <div class="rich-editor-container">
                    <div class="editor-toolbar">
                        <button type="button" onclick="formatText('bold', ${index}, 'fee')"><b>B</b></button>
                        <button type="button" onclick="formatText('italic', ${index}, 'fee')"><i>I</i></button>
                        <button type="button" onclick="formatText('underline', ${index}, 'fee')"><u>U</u></button>
                    </div>
                    <div class="rich-editor" contenteditable="true" data-index="${index}" data-type="fee" onblur="updateFeeContent(${index})">${fee.description || ''}</div>
                </div>
            </div>
        `).join('');
    }
}

// 须知管理函数
function addNoticeItem() {
    if (!window.currentEditingProduct.notices) {
        window.currentEditingProduct.notices = [];
    }

    window.currentEditingProduct.notices.push('');
    updateNoticesDisplay();
}

function removeNoticeItem(index) {
    if (window.currentEditingProduct.notices) {
        window.currentEditingProduct.notices.splice(index, 1);
        updateNoticesDisplay();
    }
}

function updateNoticeContent(index) {
    const editor = document.querySelector(`[data-index="${index}"][data-type="notice"]`);
    if (editor && window.currentEditingProduct.notices) {
        window.currentEditingProduct.notices[index] = editor.innerHTML;
    }
}

function updateNoticesDisplay() {
    const container = document.getElementById('noticesContainer');
    if (container && window.currentEditingProduct.notices) {
        container.innerHTML = window.currentEditingProduct.notices.map((notice, index) => `
            <div class="notice-item" data-index="${index}">
                <div class="notice-header">
                    <span class="notice-title">须知${index + 1}</span>
                    <button type="button" class="btn-remove-small" onclick="removeNoticeItem(${index})">删除</button>
                </div>
                <div class="rich-editor-container">
                    <div class="editor-toolbar">
                        <button type="button" onclick="formatText('bold', ${index}, 'notice')"><b>B</b></button>
                        <button type="button" onclick="formatText('italic', ${index}, 'notice')"><i>I</i></button>
                        <button type="button" onclick="formatText('underline', ${index}, 'notice')"><u>U</u></button>
                    </div>
                    <div class="rich-editor" contenteditable="true" data-index="${index}" data-type="notice" onblur="updateNoticeContent(${index})">${notice || ''}</div>
                </div>
            </div>
        `).join('');
    }
}

// 富文本编辑功能
function formatText(command, index, type) {
    const editor = document.querySelector(`[data-index="${index}"][data-type="${type}"]`);
    if (editor) {
        editor.focus();
        document.execCommand(command, false, null);
    }
}

// 保存产品
async function saveProduct(event, isEdit, productId) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // 收集基本表单数据
    const productData = {
        title: formData.get('title'),
        description: formData.get('description'),
        adultPrice: parseFloat(formData.get('adultPrice')),
        childPrice: parseFloat(formData.get('childPrice')) || 0,
        region: formData.get('region'),
        status: formData.get('status'),
        coverImage: formData.get('coverImage') || '',
        updateTime: new Date()
    };

    // 处理图片数组
    const imagesText = formData.get('images') || '';
    productData.images = imagesText ? imagesText.split(',').map(url => url.trim()).filter(url => url) : [];

    const detailImagesText = formData.get('detailImages') || '';
    productData.detailImages = detailImagesText ? detailImagesText.split(',').map(url => url.trim()).filter(url => url) : [];

    // 处理价格日历 - 从当前编辑产品中获取
    productData.priceCalendar = window.currentEditingProduct?.priceCalendar || {};

    // 从当前编辑产品中获取其他数据
    if (window.currentEditingProduct) {
        productData.tags = window.currentEditingProduct.tags || [];
        productData.itinerary = window.currentEditingProduct.itinerary || [];
        productData.fees = window.currentEditingProduct.fees || [];
        productData.notices = window.currentEditingProduct.notices || [];
    }

    if (!isEdit) {
        productData.createTime = new Date();
    }

    try {
        api.showLoading(isEdit ? '保存产品信息...' : '添加产品...');

        const result = await api.callCloudFunction('httpAPI', {
            action: isEdit ? 'update' : 'add',
            collection: 'products',
            id: isEdit ? productId : undefined,
            data: productData
        });

        if (result && result.success) {
            api.showMessage(isEdit ? '产品信息更新成功' : '产品添加成功', 'success');
            closeProductModal();
            // 自动刷新产品数据
            await refreshCurrentPageData();
        } else {
            api.showMessage((isEdit ? '产品信息更新失败: ' : '产品添加失败: ') + (result?.message || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('保存产品失败:', error);
        api.showMessage('保存失败: ' + error.message, 'error');
    } finally {
        api.hideLoading();
    }
}

async function deleteProduct(id) {
    if (confirm('确定要删除这个产品吗？此操作不可恢复！')) {
        try {
            api.showLoading('删除产品...');

            const result = await api.callCloudFunction('httpAPI', {
                action: 'delete',
                collection: 'products',
                id: id
            });

            if (result && result.success) {
                api.showMessage('产品删除成功', 'success');
                // 自动刷新数据
                await refreshCurrentPageData();
            } else {
                api.showMessage('产品删除失败: ' + (result?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('删除产品失败:', error);
            api.showMessage('删除产品失败: ' + error.message, 'error');
        } finally {
            api.hideLoading();
        }
    }
}

function viewProduct(id) {
    const product = app.data.products.find(p => p._id === id);
    if (product) {
        alert(`产品详情：\n\n标题：${product.title}\n地区：${product.region}\n成人价格：¥${product.adultPrice}\n儿童价格：¥${product.childPrice}\n状态：${app.getStatusText(product.status)}\n创建时间：${app.formatDate(product.createTime)}`);
    } else {
        api.showMessage('产品不存在', 'error');
    }
}

// 订单相关操作
function viewOrderDetail(id) {
    const order = app.data.orders.find(o => o._id === id);
    if (order) {
        alert(`订单详情：\n\n订单号：${order.orderNo}\n产品：${order.productTitle}\n联系人：${order.contactName}\n电话：${order.contactPhone}\n出行日期：${order.travelDate}\n总价：¥${order.totalPrice}\n成人：${order.adultCount}人 ¥${order.adultPrice}each\n儿童：${order.childCount}人 ¥${order.childPrice}each\n状态：${app.getStatusText(order.status)}\n创建时间：${app.formatDate(order.createTime)}\n特殊要求：${order.specialRequirements || '无'}`);
    } else {
        api.showMessage('订单不存在', 'error');
    }
}

async function confirmOrder(id) {
    if (confirm('确定要确认这个订单吗？')) {
        try {
            api.showLoading('确认订单...');

            const result = await api.callCloudFunction('httpAPI', {
                action: 'update',
                collection: 'orders',
                id: id,
                data: {
                    status: 'confirmed',
                    updateTime: new Date()
                }
            });

            if (result && result.success) {
                api.showMessage('订单确认成功', 'success');
                // 自动刷新数据
                await refreshCurrentPageData();
            } else {
                api.showMessage('订单确认失败: ' + (result?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('确认订单失败:', error);
            api.showMessage('确认订单失败: ' + error.message, 'error');
        } finally {
            api.hideLoading();
        }
    }
}

async function cancelOrder(id) {
    if (confirm('确定要取消这个订单吗？')) {
        try {
            api.showLoading('取消订单...');

            const result = await api.callCloudFunction('httpAPI', {
                action: 'update',
                collection: 'orders',
                id: id,
                data: {
                    status: 'cancelled',
                    updateTime: new Date()
                }
            });

            if (result && result.success) {
                api.showMessage('订单取消成功', 'success');
                // 自动刷新数据
                await refreshCurrentPageData();
            } else {
                api.showMessage('订单取消失败: ' + (result?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('取消订单失败:', error);
            api.showMessage('取消订单失败: ' + error.message, 'error');
        } finally {
            api.hideLoading();
        }
    }
}

// 刷新当前页面数据
async function refreshCurrentPageData() {
    const currentPage = app.currentPage;
    console.log('刷新当前页面数据:', currentPage);

    switch(currentPage) {
        case 'products':
            await app.loadProductsData();
            break;
        case 'orders':
            await app.loadOrdersData();
            break;
        case 'refunds':
            await app.loadRefundsData();
            break;
        case 'settings':
            // 系统设置页面不需要刷新数据
            break;
        default:
            console.log('未知页面，跳过刷新');
    }
}

async function filterOrders() {
    const status = document.getElementById('orderStatusFilter').value;
    console.log('筛选订单状态:', status);

    try {
        api.showLoading('筛选订单...');

        let query = {};
        if (status) {
            query.where = { status: status };
        }

        const result = await api.callCloudFunction('httpAPI', {
            action: 'get',
            collection: 'orders',
            query: query
        });

        if (result && result.success) {
            app.data.orders = result.data || [];
            app.updateOrdersTable();
            api.showMessage(`筛选完成，找到 ${app.data.orders.length} 个订单`, 'success');
        } else {
            api.showMessage('筛选订单失败: ' + (result?.message || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('筛选订单失败:', error);
        api.showMessage('筛选订单失败: ' + error.message, 'error');
    } finally {
        api.hideLoading();
    }
}

// 退款相关操作
function viewRefundDetail(id) {
    api.showMessage(`查看退款详情 ${id}`, 'info');
}

async function approveRefund(id) {
    if (confirm('确定要通过这个退款申请吗？')) {
        try {
            api.showLoading('处理退款审核...');

            const result = await api.reviewRefund(id, true, '管理员审核通过');

            if (result && result.success) {
                api.showMessage('退款审核通过成功', 'success');
                // 重新加载退款数据
                await app.loadRefundsData();
            } else {
                api.showMessage('退款审核失败: ' + (result?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('退款审核失败:', error);
            api.showMessage('请在微信开发者工具中操作', 'error');
        } finally {
            api.hideLoading();
        }
    }
}

async function rejectRefund(id) {
    const reason = prompt('请输入拒绝原因:');
    if (reason) {
        try {
            api.showLoading('处理退款审核...');

            const result = await api.reviewRefund(id, false, reason);

            if (result && result.success) {
                api.showMessage('退款已拒绝', 'success');
                // 重新加载退款数据
                await app.loadRefundsData();
            } else {
                api.showMessage('退款审核失败: ' + (result?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('退款审核失败:', error);
            api.showMessage('请在微信开发者工具中操作', 'error');
        } finally {
            api.hideLoading();
        }
    }
}

async function filterRefunds() {
    const status = document.getElementById('refundStatusFilter').value;
    console.log('筛选退款状态:', status);

    try {
        api.showLoading('筛选退款...');

        const result = await api.getRefundList(status || 'all');

        if (result && result.success) {
            app.data.refunds = result.data || [];
            app.updateRefundsTable();
            api.showMessage(`筛选完成，找到 ${app.data.refunds.length} 个退款申请`, 'success');
        } else {
            api.showMessage('筛选退款失败: ' + (result?.message || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('筛选退款失败:', error);
        api.showMessage('筛选退款失败: ' + error.message, 'error');
    } finally {
        api.hideLoading();
    }
}

// 轮播图相关操作
function showAddBannerModal() {
    // 创建添加轮播图表单
    const formHtml = `
        <div class="edit-form-overlay" onclick="closeBannerForm()">
            <div class="edit-form-container" onclick="event.stopPropagation()">
                <div class="edit-form-header">
                    <h3>添加新轮播图</h3>
                    <button class="close-btn" onclick="closeBannerForm()">×</button>
                </div>
                <form id="addBannerForm" onsubmit="saveNewBanner(event)">
                    <div class="form-group">
                        <label>轮播图标题:</label>
                        <input type="text" name="title" placeholder="请输入轮播图标题" required>
                    </div>
                    <div class="form-group">
                        <label>轮播图图片:</label>
                        <div class="image-upload-container">
                            <div class="upload-methods">
                                <div class="upload-method">
                                    <label class="upload-btn">
                                        <input type="file" accept="image/*" onchange="handleBannerImageUpload(event)" style="display: none;">
                                        📁 上传轮播图
                                    </label>
                                    <small>支持 JPG、PNG、GIF 格式，建议尺寸 1200x400</small>
                                </div>
                                <div class="upload-method">
                                    <input type="url" name="imageUrl" placeholder="或输入图片URL: https://example.com/image.jpg" required>
                                </div>
                            </div>
                            <div class="image-preview" id="bannerImagePreview"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>产品ID:</label>
                        <input type="text" name="productId" placeholder="请输入产品ID（用于跳转到产品详情）">
                        <small>输入产品ID后，点击轮播图将跳转到对应产品详情页</small>
                    </div>
                    <div class="form-group">
                        <label>链接地址:</label>
                        <input type="text" name="linkUrl" placeholder="自定义链接地址（可选）">
                        <small>如果设置了产品ID，此字段将被忽略</small>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>排序:</label>
                            <input type="number" name="sort" placeholder="1" min="1" required>
                        </div>
                        <div class="form-group">
                            <label>状态:</label>
                            <select name="status">
                                <option value="active">启用</option>
                                <option value="inactive">禁用</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeBannerForm()">取消</button>
                        <button type="submit" class="btn-primary">添加轮播图</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', formHtml);
}

async function editBanner(id) {
    console.log('编辑轮播图:', id);
    console.log('当前轮播图数据:', app.data.banners);

    // 从app.data.banners中查找
    const banner = app.data.banners ? app.data.banners.find(b => b._id === id) : null;
    console.log('找到的轮播图:', banner);

    if (!banner) {
        console.error('轮播图不存在，ID:', id);
        api.showMessage('轮播图不存在', 'error');
        return;
    }

    console.log('准备显示编辑弹窗...');

    const formHtml = `
        <div class="modal-overlay show" onclick="closeBannerModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h3>编辑轮播图</h3>
                    <button class="close-btn" onclick="closeBannerModal()">×</button>
                </div>
                <form id="editBannerForm" onsubmit="submitEditBanner(event, '${id}')">
                    <div class="form-section">
                        <h4 class="section-title">基本信息</h4>

                        <div class="form-group">
                            <label>标题 *</label>
                            <input type="text" name="title" value="${banner.title || ''}" placeholder="请输入轮播图标题" required>
                        </div>

                        <div class="form-group">
                            <label>排序 *</label>
                            <input type="number" name="sort" value="${banner.sort || banner.order || 0}" placeholder="数字越小排序越靠前" required min="0">
                        </div>

                        <div class="form-group">
                            <label>状态 *</label>
                            <select name="status" required>
                                <option value="active" ${(banner.status || 'active') === 'active' ? 'selected' : ''}>启用</option>
                                <option value="inactive" ${banner.status === 'inactive' ? 'selected' : ''}>禁用</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>产品ID</label>
                            <input type="text" name="productId" value="${banner.productId || ''}" placeholder="请输入产品ID（用于跳转到产品详情）">
                            <small>输入产品ID后，点击轮播图将跳转到对应产品详情页</small>
                        </div>

                        <div class="form-group">
                            <label>链接URL</label>
                            <input type="url" name="linkUrl" value="${banner.linkUrl || banner.link || ''}" placeholder="自定义链接地址（可选）">
                            <small>如果设置了产品ID，此字段将被忽略</small>
                        </div>
                    </div>

                    <div class="form-section">
                        <h4 class="section-title">轮播图图片</h4>

                        <!-- 图片上传 -->
                        <div class="form-group">
                            <label>轮播图图片 *</label>
                            <div class="image-upload-container">
                                <div class="upload-methods">
                                    <div class="upload-method">
                                        <label class="upload-btn">
                                            <input type="file" accept="image/*" onchange="handleEditBannerImageUpload(event)" style="display: none;">
                                            📁 重新上传轮播图
                                        </label>
                                        <small>支持 JPG、PNG、GIF 格式，建议尺寸 1200x400</small>
                                    </div>
                                    <div class="upload-method">
                                        <input type="url" name="imageUrl" value="${banner.imageUrl || banner.image || ''}" placeholder="或输入图片URL" required>
                                    </div>
                                </div>
                                <div class="image-preview" id="editBannerImagePreview">
                                    ${(banner.imageUrl || banner.image) ? `<img src="${banner.imageUrl || banner.image}" alt="轮播图预览" style="max-width: 300px; max-height: 100px;">` : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn-secondary" onclick="closeBannerModal()">取消</button>
                        <button type="submit" class="btn-primary">保存修改</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', formHtml);
    console.log('编辑弹窗已添加到页面');

    // 检查弹窗是否成功添加并确保显示
    const modal = document.querySelector('.modal-overlay:last-child');
    if (modal) {
        console.log('弹窗元素找到:', modal);
        // 确保弹窗显示
        modal.classList.add('show');
        modal.style.display = 'flex';
        console.log('弹窗显示状态已设置');
    } else {
        console.error('弹窗元素未找到!');
    }
}

// 关闭轮播图模态框
function closeBannerModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// 编辑轮播图的图片上传处理
async function handleEditBannerImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        api.showMessage('请选择图片文件', 'error');
        return;
    }

    // 验证文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
        api.showMessage('图片文件不能超过5MB', 'error');
        return;
    }

    api.showLoading('上传中...');

    try {
        // 创建预览
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('editBannerImagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="轮播图预览" style="max-width: 300px; max-height: 100px;">`;
        };
        reader.readAsDataURL(file);

        // 上传到云存储
        const uploadResult = await uploadImageToCloud(file);

        if (uploadResult.success) {
            // 更新输入框的值
            const imageUrlInput = document.querySelector('input[name="imageUrl"]');
            if (imageUrlInput) {
                imageUrlInput.value = uploadResult.url;
            }

            api.showMessage('轮播图上传成功', 'success');
        } else {
            api.showMessage('上传失败: ' + uploadResult.error, 'error');
        }
    } catch (error) {
        console.error('轮播图上传失败:', error);
        api.showMessage('上传失败', 'error');
    } finally {
        api.hideLoading();
    }
}

// 提交编辑轮播图
async function submitEditBanner(event, id) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const bannerData = {
        title: formData.get('title'),
        sort: parseInt(formData.get('sort')),
        status: formData.get('status'),
        productId: formData.get('productId') || null,
        linkUrl: formData.get('linkUrl') || null,
        imageUrl: formData.get('imageUrl'),
        updateTime: new Date().toISOString()
    };

    // 验证必填字段
    if (!bannerData.title || !bannerData.imageUrl) {
        api.showMessage('请填写所有必填字段', 'error');
        return;
    }

    try {
        api.showLoading('保存中...');

        const result = await api.callCloudFunction('httpAPI', {
            action: 'update',
            collection: 'banners',
            id: id,
            data: bannerData
        });

        if (result.success) {
            api.showMessage('轮播图更新成功', 'success');
            closeBannerModal();

            // 重新加载轮播图数据
            await refreshBannerData();
        } else {
            api.showMessage('更新失败: ' + (result.message || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('更新轮播图失败:', error);
        api.showMessage('更新失败: ' + error.message, 'error');
    } finally {
        api.hideLoading();
    }
}

async function deleteBanner(id) {
    if (confirm('确定要删除这个轮播图吗？此操作不可恢复！')) {
        try {
            api.showLoading('删除轮播图...');

            const result = await api.callCloudFunction('httpAPI', {
                action: 'delete',
                collection: 'banners',
                id: id
            });

            if (result && result.success) {
                api.showMessage('轮播图删除成功', 'success');
                // 重新加载轮播图数据
                await refreshBannerData();
            } else {
                api.showMessage('轮播图删除失败: ' + (result?.message || '未知错误'), 'error');
            }
        } catch (error) {
            console.error('删除轮播图失败:', error);
            api.showMessage('删除轮播图失败: ' + error.message, 'error');
        } finally {
            api.hideLoading();
        }
    }
}

function viewBanner(id) {
    const banner = app.data.banners.find(b => b._id === id);
    if (banner) {
        alert(`轮播图详情：\n\n标题：${banner.title}\n图片URL：${banner.imageUrl || banner.image}\n链接：${banner.linkUrl || banner.link || '无'}\n排序：${banner.sort || banner.order || 0}\n状态：${app.getStatusText(banner.status)}\n创建时间：${app.formatDate(banner.createTime)}`);
    } else {
        api.showMessage('轮播图不存在', 'error');
    }
}

// 保存新轮播图
async function saveNewBanner(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const newBanner = {
        title: formData.get('title'),
        imageUrl: formData.get('imageUrl'),
        productId: formData.get('productId') || null,
        linkUrl: formData.get('linkUrl') || null,
        sort: parseInt(formData.get('sort')),
        status: formData.get('status'),
        createTime: new Date(),
        updateTime: new Date()
    };

    try {
        api.showLoading('添加轮播图...');

        const result = await api.callCloudFunction('httpAPI', {
            action: 'add',
            collection: 'banners',
            data: newBanner
        });

        if (result && result.success) {
            api.showMessage('轮播图添加成功', 'success');
            closeBannerForm();
            // 重新加载轮播图数据
            await refreshBannerData();
        } else {
            api.showMessage('轮播图添加失败: ' + (result?.message || '未知错误'), 'error');
        }
    } catch (error) {
        console.error('添加轮播图失败:', error);
        api.showMessage('添加失败: ' + error.message, 'error');
    } finally {
        api.hideLoading();
    }
}

// 关闭轮播图表单
function closeBannerForm() {
    const overlay = document.querySelector('.edit-form-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 设置相关操作
function saveSettings() {
    const envId = document.getElementById('envIdInput').value;
    if (envId) {
        api.envId = envId;
        localStorage.setItem('envId', envId);
        api.showMessage('配置已保存', 'success');
    }
}

function testConnection() {
    api.testConnection().then(result => {
        if (result.success) {
            api.showMessage('连接测试成功', 'success');
        } else {
            api.showMessage('连接测试失败', 'error');
        }
    });
}

function clearCache() {
    api.clearCache();
    api.showMessage('缓存已清除', 'success');
}

function resetData() {
    if (confirm('确定要重置所有数据吗？此操作不可恢复！')) {
        api.showMessage('数据重置功能开发中...', 'info');
    }
}

// 日历相关功能
function generateCalendar() {
    if (!window.currentCalendarMonth) {
        window.currentCalendarMonth = new Date();
    }

    const currentMonth = window.currentCalendarMonth;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // 更新月份显示
    const monthText = `${year}年${month + 1}月`;
    const monthTextEl = document.getElementById('currentMonthText');
    if (monthTextEl) {
        monthTextEl.textContent = monthText;
    }

    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 获取上个月的最后几天
    const firstDayWeek = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0);
    const prevMonthDays = [];

    for (let i = firstDayWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay.getDate() - i;
        const date = new Date(year, month - 1, day);
        prevMonthDays.push({
            date: formatDate(date),
            day: day,
            isCurrentMonth: false,
            isAvailable: false,
            adultPrice: 0,
            childPrice: 0
        });
    }

    // 获取当月的天数
    const currentMonthDays = [];
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        const priceData = window.currentEditingProduct?.priceCalendar?.[dateStr];

        currentMonthDays.push({
            date: dateStr,
            day: day,
            isCurrentMonth: true,
            isAvailable: priceData ? priceData.available : true,
            adultPrice: priceData ? priceData.adultPrice : window.currentEditingProduct?.adultPrice || 0,
            childPrice: priceData ? priceData.childPrice : window.currentEditingProduct?.childPrice || 0
        });
    }

    // 获取下个月的前几天
    const lastDayWeek = lastDay.getDay();
    const nextMonthDays = [];

    for (let day = 1; day <= 6 - lastDayWeek; day++) {
        const date = new Date(year, month + 1, day);
        nextMonthDays.push({
            date: formatDate(date),
            day: day,
            isCurrentMonth: false,
            isAvailable: false,
            adultPrice: 0,
            childPrice: 0
        });
    }

    // 合并所有天数
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

    // 渲染日历
    renderCalendar(allDays);
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderCalendar(days) {
    const calendarDaysEl = document.getElementById('calendarDays');
    if (!calendarDaysEl) return;

    calendarDaysEl.innerHTML = days.map(day => `
        <div class="day-item ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${day.isAvailable ? 'available' : 'unavailable'}"
             onclick="editDatePrice('${day.date}')"
             data-date="${day.date}">
            <span class="day-number">${day.day}</span>
            ${day.isCurrentMonth && day.isAvailable ?
                `<span class="day-price">¥${day.adultPrice}</span>` :
                (day.isCurrentMonth && !day.isAvailable ? '<span class="day-status">停售</span>' : '')
            }
        </div>
    `).join('');
}

// 上个月
function prevMonth() {
    if (!window.currentCalendarMonth) {
        window.currentCalendarMonth = new Date();
    }

    const currentMonth = window.currentCalendarMonth;
    window.currentCalendarMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    generateCalendar();
}

// 下个月
function nextMonth() {
    if (!window.currentCalendarMonth) {
        window.currentCalendarMonth = new Date();
    }

    const currentMonth = window.currentCalendarMonth;
    window.currentCalendarMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    generateCalendar();
}

// 编辑日期价格
function editDatePrice(date) {
    if (!window.currentEditingProduct) {
        api.showMessage('请先选择产品', 'error');
        return;
    }

    // 获取当前日期的价格信息
    const currentPrice = window.currentEditingProduct.priceCalendar?.[date] || {
        adultPrice: window.currentEditingProduct.adultPrice || '',
        childPrice: window.currentEditingProduct.childPrice || '',
        available: true
    };

    // 创建编辑弹窗
    const modalHtml = `
        <div class="calendar-editor-overlay" onclick="closeDateEditor()">
            <div class="calendar-editor-modal" onclick="event.stopPropagation()">
                <div class="editor-title">编辑 ${date} 价格</div>
                <form id="dateEditForm" onsubmit="saveDatePrice(event, '${date}')">
                    <div class="editor-item">
                        <label>成人价格:</label>
                        <input type="number" name="adultPrice" value="${currentPrice.adultPrice}" step="0.01" placeholder="请输入成人价格" required>
                    </div>
                    <div class="editor-item">
                        <label>儿童价格:</label>
                        <input type="number" name="childPrice" value="${currentPrice.childPrice}" step="0.01" placeholder="请输入儿童价格">
                    </div>
                    <div class="editor-item">
                        <label>
                            <input type="checkbox" name="available" ${currentPrice.available ? 'checked' : ''}>
                            可售
                        </label>
                    </div>
                    <div class="editor-actions">
                        <button type="button" class="btn-secondary" onclick="closeDateEditor()">取消</button>
                        <button type="submit" class="btn-primary">保存</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 保存日期价格
function saveDatePrice(event, date) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const priceData = {
        adultPrice: parseFloat(formData.get('adultPrice')),
        childPrice: parseFloat(formData.get('childPrice')) || 0,
        available: formData.get('available') === 'on'
    };

    // 更新产品的价格日历
    if (!window.currentEditingProduct.priceCalendar) {
        window.currentEditingProduct.priceCalendar = {};
    }

    window.currentEditingProduct.priceCalendar[date] = priceData;

    // 关闭编辑器并重新生成日历
    closeDateEditor();
    generateCalendar();

    api.showMessage('价格设置成功', 'success');
}

// 关闭日期编辑器
function closeDateEditor() {
    const overlay = document.querySelector('.calendar-editor-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 批量设置价格
function showBatchSetModal() {
    if (!window.currentEditingProduct) {
        api.showMessage('请先选择产品', 'error');
        return;
    }

    const modalHtml = `
        <div class="calendar-editor-overlay" onclick="closeBatchSetModal()">
            <div class="calendar-editor-modal batch-modal" onclick="event.stopPropagation()">
                <div class="editor-title">批量设置价格</div>
                <form id="batchSetForm" onsubmit="saveBatchPrice(event)">
                    <div class="editor-item">
                        <label>成人价格:</label>
                        <input type="number" name="adultPrice" value="${window.currentEditingProduct.adultPrice || ''}" step="0.01" placeholder="请输入成人价格" required>
                    </div>
                    <div class="editor-item">
                        <label>儿童价格:</label>
                        <input type="number" name="childPrice" value="${window.currentEditingProduct.childPrice || ''}" step="0.01" placeholder="请输入儿童价格">
                    </div>
                    <div class="editor-item">
                        <label>
                            <input type="checkbox" name="available" checked>
                            可售
                        </label>
                    </div>
                    <div class="editor-item">
                        <label>应用范围:</label>
                        <select name="applyRange">
                            <option value="currentMonth">当前月份</option>
                            <option value="nextMonth">下个月</option>
                            <option value="next3Months">未来3个月</option>
                            <option value="all">所有月份</option>
                        </select>
                    </div>
                    <div class="editor-actions">
                        <button type="button" class="btn-secondary" onclick="closeBatchSetModal()">取消</button>
                        <button type="submit" class="btn-primary">批量设置</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// 保存批量价格
function saveBatchPrice(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const priceData = {
        adultPrice: parseFloat(formData.get('adultPrice')),
        childPrice: parseFloat(formData.get('childPrice')) || 0,
        available: formData.get('available') === 'on'
    };

    const applyRange = formData.get('applyRange');

    // 计算日期范围
    const today = new Date();
    let startDate, endDate;

    switch (applyRange) {
        case 'currentMonth':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            break;
        case 'nextMonth':
            startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            break;
        case 'next3Months':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
            break;
        case 'all':
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear() + 1, 11, 31);
            break;
    }

    // 应用价格到日期范围
    if (!window.currentEditingProduct.priceCalendar) {
        window.currentEditingProduct.priceCalendar = {};
    }

    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        window.currentEditingProduct.priceCalendar[dateStr] = { ...priceData };
        count++;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 关闭模态框并重新生成日历
    closeBatchSetModal();
    generateCalendar();

    api.showMessage(`批量设置成功，共设置 ${count} 天`, 'success');
}

// 关闭批量设置模态框
function closeBatchSetModal() {
    const overlay = document.querySelector('.calendar-editor-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 范围设置价格（如8月5号-8月19号）
function showRangeSetModal() {
    if (!window.currentEditingProduct) {
        api.showMessage('请先选择产品', 'error');
        return;
    }

    const today = new Date();
    const todayStr = formatDate(today);
    const nextWeekStr = formatDate(new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000));

    const modalHtml = `
        <div class="calendar-editor-overlay" onclick="closeRangeSetModal()">
            <div class="calendar-editor-modal range-modal" onclick="event.stopPropagation()">
                <div class="editor-title">范围设置价格</div>
                <form id="rangeSetForm" onsubmit="saveRangePrice(event)">
                    <div class="date-range-container">
                        <div class="editor-item">
                            <label>开始日期:</label>
                            <input type="date" name="startDate" value="${todayStr}" required>
                        </div>
                        <div class="editor-item">
                            <label>结束日期:</label>
                            <input type="date" name="endDate" value="${nextWeekStr}" required>
                        </div>
                    </div>
                    <div class="editor-item">
                        <label>成人价格:</label>
                        <input type="number" name="adultPrice" value="${window.currentEditingProduct.adultPrice || ''}" step="0.01" placeholder="请输入成人价格" required>
                    </div>
                    <div class="editor-item">
                        <label>儿童价格:</label>
                        <input type="number" name="childPrice" value="${window.currentEditingProduct.childPrice || ''}" step="0.01" placeholder="请输入儿童价格">
                    </div>
                    <div class="editor-item">
                        <label>
                            <input type="checkbox" name="available" checked>
                            可售
                        </label>
                    </div>
                    <div class="range-preview" id="rangePreview">
                        <small>将设置从 ${todayStr} 到 ${nextWeekStr} 的价格</small>
                    </div>
                    <div class="editor-actions">
                        <button type="button" class="btn-secondary" onclick="closeRangeSetModal()">取消</button>
                        <button type="submit" class="btn-primary">范围设置</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 添加日期变化监听
    const startDateInput = document.querySelector('input[name="startDate"]');
    const endDateInput = document.querySelector('input[name="endDate"]');
    const preview = document.getElementById('rangePreview');

    function updatePreview() {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (days > 0) {
                preview.innerHTML = `<small>将设置从 ${startDate} 到 ${endDate} 的价格，共 ${days} 天</small>`;
            } else {
                preview.innerHTML = `<small style="color: red;">结束日期不能早于开始日期</small>`;
            }
        }
    }

    startDateInput.addEventListener('change', updatePreview);
    endDateInput.addEventListener('change', updatePreview);
}

// 保存范围价格
function saveRangePrice(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const startDate = new Date(formData.get('startDate'));
    const endDate = new Date(formData.get('endDate'));

    if (endDate < startDate) {
        api.showMessage('结束日期不能早于开始日期', 'error');
        return;
    }

    const priceData = {
        adultPrice: parseFloat(formData.get('adultPrice')),
        childPrice: parseFloat(formData.get('childPrice')) || 0,
        available: formData.get('available') === 'on'
    };

    // 应用价格到日期范围
    if (!window.currentEditingProduct.priceCalendar) {
        window.currentEditingProduct.priceCalendar = {};
    }

    let count = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        window.currentEditingProduct.priceCalendar[dateStr] = { ...priceData };
        count++;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // 关闭模态框并重新生成日历
    closeRangeSetModal();
    generateCalendar();

    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);
    api.showMessage(`范围设置成功，从 ${startStr} 到 ${endStr}，共设置 ${count} 天`, 'success');
}

// 关闭范围设置模态框
function closeRangeSetModal() {
    const overlay = document.querySelector('.calendar-editor-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 图片上传处理函数
async function uploadImageToCloud(file) {
    try {
        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        const fileName = `web-upload/${timestamp}-${randomStr}.${extension}`;

        // 将文件转换为Base64
        const base64Data = await fileToBase64(file);

        try {
            // 尝试调用云函数上传文件
            const uploadResult = await api.callCloudFunction('httpAPI', {
                action: 'uploadFile',
                fileName: fileName,
                fileData: base64Data,
                contentType: file.type
            });

            if (uploadResult.success) {
                return {
                    success: true,
                    url: uploadResult.fileID,
                    fileName: fileName
                };
            } else {
                throw new Error(uploadResult.message || '云函数上传失败');
            }
        } catch (cloudError) {
            console.warn('云函数上传失败，使用备用方案:', cloudError.message);

            // 备用方案：创建本地blob URL用于预览
            const blob = new Blob([file], { type: file.type });
            const blobUrl = URL.createObjectURL(blob);

            // 提示用户需要手动部署云函数
            api.showMessage('提示：图片上传功能需要部署云函数才能正常使用。当前使用预览模式。', 'warning');

            return {
                success: true,
                url: blobUrl,
                fileName: fileName,
                isPreview: true
            };
        }
    } catch (error) {
        console.error('图片上传失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 将文件转换为Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // 移除data:image/jpeg;base64,前缀，只保留base64数据
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// 封面图片上传处理
async function handleCoverImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        api.showMessage('请选择图片文件', 'error');
        return;
    }

    // 验证文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
        api.showMessage('图片文件不能超过5MB', 'error');
        return;
    }

    api.showLoading('上传中...');

    try {
        // 创建预览
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('coverImagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="封面图片预览" style="max-width: 200px; max-height: 150px;">`;
        };
        reader.readAsDataURL(file);

        // 上传到云存储
        const uploadResult = await uploadImageToCloud(file);

        if (uploadResult.success) {
            // 更新输入框的值
            const coverImageInput = document.querySelector('input[name="coverImage"]');
            if (coverImageInput) {
                coverImageInput.value = uploadResult.url;
            }

            api.showMessage('封面图片上传成功', 'success');
        } else {
            api.showMessage('上传失败: ' + uploadResult.error, 'error');
        }
    } catch (error) {
        console.error('封面图片上传失败:', error);
        api.showMessage('上传失败', 'error');
    } finally {
        api.hideLoading();
    }
}

// 主图上传处理
async function handleMainImagesUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // 验证文件
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            api.showMessage('请只选择图片文件', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            api.showMessage('图片文件不能超过5MB', 'error');
            return;
        }
    }

    api.showLoading(`上传中... (0/${files.length})`);

    try {
        const uploadedUrls = [];
        const preview = document.getElementById('mainImagesPreview');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 更新进度
            api.showLoading(`上传中... (${i + 1}/${files.length})`);

            // 创建预览
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = '主图预览';
                img.style.cssText = 'max-width: 150px; max-height: 100px; margin: 5px;';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);

            // 上传到云存储
            const uploadResult = await uploadImageToCloud(file);

            if (uploadResult.success) {
                uploadedUrls.push(uploadResult.url);
            } else {
                api.showMessage(`第${i + 1}张图片上传失败: ${uploadResult.error}`, 'error');
            }
        }

        if (uploadedUrls.length > 0) {
            // 更新文本框的值
            const imagesTextarea = document.querySelector('textarea[name="images"]');
            if (imagesTextarea) {
                const existingUrls = imagesTextarea.value ? imagesTextarea.value.split(',').map(url => url.trim()).filter(url => url) : [];
                const allUrls = [...existingUrls, ...uploadedUrls];
                imagesTextarea.value = allUrls.join(',');
            }

            api.showMessage(`成功上传 ${uploadedUrls.length} 张主图`, 'success');
        }
    } catch (error) {
        console.error('主图上传失败:', error);
        api.showMessage('上传失败', 'error');
    } finally {
        api.hideLoading();
    }
}

// 详情图片上传处理
async function handleDetailImagesUpload(event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // 验证文件
    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            api.showMessage('请只选择图片文件', 'error');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            api.showMessage('图片文件不能超过5MB', 'error');
            return;
        }
    }

    api.showLoading(`上传中... (0/${files.length})`);

    try {
        const uploadedUrls = [];
        const preview = document.getElementById('detailImagesPreview');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 更新进度
            api.showLoading(`上传中... (${i + 1}/${files.length})`);

            // 创建预览
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = '详情图片预览';
                img.style.cssText = 'max-width: 150px; max-height: 100px; margin: 5px;';
                preview.appendChild(img);
            };
            reader.readAsDataURL(file);

            // 上传到云存储
            const uploadResult = await uploadImageToCloud(file);

            if (uploadResult.success) {
                uploadedUrls.push(uploadResult.url);
            } else {
                api.showMessage(`第${i + 1}张图片上传失败: ${uploadResult.error}`, 'error');
            }
        }

        if (uploadedUrls.length > 0) {
            // 更新文本框的值
            const detailImagesTextarea = document.querySelector('textarea[name="detailImages"]');
            if (detailImagesTextarea) {
                const existingUrls = detailImagesTextarea.value ? detailImagesTextarea.value.split(',').map(url => url.trim()).filter(url => url) : [];
                const allUrls = [...existingUrls, ...uploadedUrls];
                detailImagesTextarea.value = allUrls.join(',');
            }

            api.showMessage(`成功上传 ${uploadedUrls.length} 张详情图片`, 'success');
        }
    } catch (error) {
        console.error('详情图片上传失败:', error);
        api.showMessage('上传失败', 'error');
    } finally {
        api.hideLoading();
    }
}

// 轮播图上传处理
async function handleBannerImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        api.showMessage('请选择图片文件', 'error');
        return;
    }

    // 验证文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
        api.showMessage('图片文件不能超过5MB', 'error');
        return;
    }

    api.showLoading('上传中...');

    try {
        // 创建预览
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('bannerImagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="轮播图预览" style="max-width: 300px; max-height: 100px;">`;
        };
        reader.readAsDataURL(file);

        // 上传到云存储
        const uploadResult = await uploadImageToCloud(file);

        if (uploadResult.success) {
            // 更新输入框的值
            const imageUrlInput = document.querySelector('input[name="imageUrl"]');
            if (imageUrlInput) {
                imageUrlInput.value = uploadResult.url;
            }

            api.showMessage('轮播图上传成功', 'success');
        } else {
            api.showMessage('上传失败: ' + uploadResult.error, 'error');
        }
    } catch (error) {
        console.error('轮播图上传失败:', error);
        api.showMessage('上传失败', 'error');
    } finally {
        api.hideLoading();
    }
}

// 关闭管理员资料模态框
function closeAdminProfile() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// 初始化应用
const app = new SimpleApp();

// 测试函数
function testBanners() {
    console.log('测试轮播图管理...');
    switchPage('banners');
}

// 直接测试轮播图数据加载
function testLoadBanners() {
    console.log('直接测试轮播图数据加载...');
    if (app && app.loadBannersData) {
        app.loadBannersData();
    } else {
        console.error('app或loadBannersData方法不存在');
    }
}

// 确保DOM加载完成后再初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，app对象:', app);
    console.log('测试函数可用:', typeof testBanners);
});
