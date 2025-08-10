// 登录页面逻辑
class LoginManager {
    constructor() {
        this.currentMethod = 'openid';
        this.init();
    }

    init() {
        // 检查是否已经登录
        this.checkExistingLogin();

        // 绑定事件监听器
        this.bindEvents();
    }

    // 绑定事件监听器
    bindEvents() {
        // 登录表单提交
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (event) => {
                this.loginWithOpenid(event);
            });
        }

        // 登录方式切换按钮
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.getAttribute('data-method');
                this.switchLoginMethod(method);
            });
        });
    }

    // 检查现有登录状态
    checkExistingLogin() {
        const adminInfo = localStorage.getItem('adminInfo');
        if (adminInfo) {
            try {
                const admin = JSON.parse(adminInfo);
                if (admin.openid && admin.loginTime) {
                    // 检查登录是否过期（24小时）
                    const loginTime = new Date(admin.loginTime);
                    const now = new Date();
                    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
                    
                    if (hoursDiff < 24) {
                        // 登录未过期，直接跳转到管理后台
                        this.showMessage('检测到已登录，正在跳转...', 'success');
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1000);
                        return;
                    } else {
                        // 登录已过期，清除本地存储
                        localStorage.removeItem('adminInfo');
                    }
                }
            } catch (error) {
                console.error('解析登录信息失败:', error);
                localStorage.removeItem('adminInfo');
            }
        }
    }

    // 切换登录方式
    switchLoginMethod(method) {
        this.currentMethod = method;
        
        // 更新按钮状态
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');
        
        // 切换表单显示
        document.querySelectorAll('.login-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${method}Login`).classList.add('active');
    }

    // OpenID登录
    async loginWithOpenid(event) {
        event.preventDefault();

        // 检查api是否已加载
        if (typeof api === 'undefined') {
            this.showMessage('系统初始化中，请稍后再试', 'error');
            return;
        }

        const formData = new FormData(event.target);
        const openid = formData.get('openid').trim();
        const adminKey = formData.get('adminKey').trim();

        if (!openid) {
            this.showMessage('请输入OpenID', 'error');
            return;
        }

        // 验证OpenID格式（微信OpenID通常是28位字符）
        if (openid.length < 20) {
            this.showMessage('OpenID格式不正确，请检查输入', 'error');
            return;
        }

        this.showLoading('验证管理员权限...');

        try {
            // 调用云函数验证管理员权限
            const result = await api.callCloudFunction('httpAPI', {
                action: 'checkWebAdmin',
                openid: openid,
                adminKey: adminKey
            });
            
            if (result.success && result.isAdmin) {
                // 登录成功，保存管理员信息
                const adminInfo = {
                    openid: openid,
                    name: result.adminInfo.name || '管理员',
                    role: result.adminInfo.role || 'admin',
                    permissions: result.adminInfo.permissions || [],
                    isSuperAdmin: result.adminInfo.role === 'super_admin',
                    loginTime: new Date().toISOString()
                };
                
                localStorage.setItem('adminInfo', JSON.stringify(adminInfo));
                
                this.showMessage(`登录成功！欢迎 ${adminInfo.name}`, 'success');
                
                // 延迟跳转到管理后台
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } else {
                this.showMessage(result.message || '权限验证失败，请确认您是否为管理员', 'error');
            }
            
        } catch (error) {
            console.error('登录失败:', error);
            this.showMessage('登录失败: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    // 显示加载状态
    showLoading(message = '加载中...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.style.display = 'flex';
    }

    // 隐藏加载状态
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = 'none';
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.innerHTML = `
            <div class="message-content">
                <i class="fas fa-${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="message-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(messageEl);
        
        // 自动移除消息
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.remove();
            }
        }, 5000);
    }

    // 获取消息图标
    getMessageIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// 全局函数（保留以防其他地方调用）
function switchLoginMethod(method) {
    if (loginManager) {
        loginManager.switchLoginMethod(method);
    } else {
        console.warn('登录管理器未初始化，忽略调用');
    }
}

function loginWithOpenid(event) {
    if (loginManager) {
        loginManager.loginWithOpenid(event);
    } else {
        console.warn('登录管理器未初始化，忽略调用');
        if (event) event.preventDefault();
    }
}

// 初始化登录管理器
let loginManager;

// 等待DOM和api加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 检查api是否已加载
    function initLoginManager() {
        if (typeof api !== 'undefined') {
            loginManager = new LoginManager();
            console.log('登录管理器初始化完成');
        } else {
            console.log('等待api加载...');
            setTimeout(initLoginManager, 100);
        }
    }
    initLoginManager();
});

// 添加消息样式
const messageStyles = `
<style>
.message {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-width: 300px;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
}

.message-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.message-success { border-left: 4px solid #28a745; }
.message-error { border-left: 4px solid #dc3545; }
.message-warning { border-left: 4px solid #ffc107; }
.message-info { border-left: 4px solid #17a2b8; }

.message-success i { color: #28a745; }
.message-error i { color: #dc3545; }
.message-warning i { color: #ffc107; }
.message-info i { color: #17a2b8; }

.message-close {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: #6c757d;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.message-close:hover {
    color: #495057;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', messageStyles);
