// 简化版配置文件
const CONFIG = {
    // 云开发环境配置
    envId: 'new-travel-2gy6d6oy7ee5fb0e', // 您的环境ID
    
    // 应用配置
    appName: '旅游小程序管理后台',
    version: '1.0.0',
    
    // 页面配置
    pageSize: 20,
    cacheTimeout: 5 * 60 * 1000, // 5分钟缓存
    
    // 状态映射
    statusMap: {
        'active': '启用',
        'inactive': '禁用',
        'pending': '待付款',
        'paid': '已付款',
        'confirmed': '已确认',
        'completed': '已完成',
        'cancelled': '已取消',
        'refunded': '已退款'
    },
    
    // 退款状态映射
    refundStatusMap: {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝',
        'completed': '已完成',
        'failed': '失败'
    },
    
    // 状态颜色
    statusColors: {
        'active': '#28a745',
        'inactive': '#dc3545',
        'pending': '#ffc107',
        'paid': '#17a2b8',
        'confirmed': '#007bff',
        'completed': '#28a745',
        'cancelled': '#dc3545',
        'refunded': '#6c757d'
    },
    
    // 退款状态颜色
    refundStatusColors: {
        'pending': '#ffc107',
        'approved': '#28a745',
        'rejected': '#dc3545',
        'completed': '#007bff',
        'failed': '#dc3545'
    }
};

// 从localStorage加载配置
function loadConfig() {
    const savedEnvId = localStorage.getItem('envId');
    if (savedEnvId) {
        CONFIG.envId = savedEnvId;
    }
}

// 保存配置到localStorage
function saveConfig() {
    localStorage.setItem('envId', CONFIG.envId);
}

// 初始化时加载配置
loadConfig();
