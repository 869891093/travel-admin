// 真实数据后台服务器
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// 微信小程序配置 - 从环境变量读取
const WECHAT_CONFIG = {
    appId: process.env.WECHAT_APP_ID || 'wxb61e3bbcd9bebc43',
    appSecret: process.env.WECHAT_APP_SECRET || '01d388ccf17991b83c1db9597b910822',
    envId: process.env.WECHAT_ENV_ID || 'new-travel-2gy6d6oy7ee5fb0e'
};

// Access Token 缓存
let accessTokenCache = {
    token: null,
    expireTime: 0
};

// 中间件
app.use(cors());
// 增加请求体大小限制，支持图片上传（最大50MB）
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static('.'));

// 云函数代理接口
app.post('/api/cloud-function', async (req, res) => {
    const startTime = Date.now();

    try {
        const { envId, functionName, data } = req.body;

        console.log('=== 代理云函数调用 ===');
        console.log('时间:', new Date().toISOString());
        console.log('环境ID:', envId);
        console.log('函数名:', functionName);
        console.log('数据:', data);

        // 设置30秒超时
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('云函数调用超时 (30秒)')), 30000);
        });

        // 调用真实的云函数
        const result = await Promise.race([
            callRealCloudFunction(envId, functionName, data),
            timeoutPromise
        ]);

        const duration = Date.now() - startTime;
        console.log(`云函数调用完成，耗时: ${duration}ms`);
        console.log('返回结果:', result);

        res.json(result);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`代理调用失败 (耗时: ${duration}ms):`, error.message);
        console.error('错误堆栈:', error.stack);

        res.status(500).json({
            success: false,
            message: error.message,
            duration: duration
        });
    }
});

// 获取微信Access Token
async function getAccessToken() {
    try {
        // 检查缓存是否有效
        if (accessTokenCache.token && Date.now() < accessTokenCache.expireTime) {
            console.log('使用缓存的access_token');
            return accessTokenCache.token;
        }

        console.log('获取新的access_token...');
        console.log('微信配置:', {
            appId: WECHAT_CONFIG.appId,
            appSecret: WECHAT_CONFIG.appSecret ? '***已设置***' : '未设置',
            envId: WECHAT_CONFIG.envId
        });

        const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}`;

        console.log('请求微信API获取access_token...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

        const response = await fetch(url, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('微信API响应:', result);

        if (result.errcode) {
            throw new Error(`获取access_token失败: ${result.errmsg}`);
        }

        // 缓存token（提前5分钟过期）
        accessTokenCache.token = result.access_token;
        accessTokenCache.expireTime = Date.now() + (result.expires_in - 300) * 1000;

        console.log('access_token获取成功');
        return result.access_token;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('获取access_token超时');
            throw new Error('获取access_token超时，请检查网络连接');
        }
        console.error('获取access_token失败:', error.message);
        throw error;
    }
}

// 调用真实的云函数
async function callRealCloudFunction(envId, functionName, data) {
    try {
        console.log('=== 调用真实云函数 ===');
        console.log('环境ID:', envId);
        console.log('函数名:', functionName);
        console.log('数据:', JSON.stringify(data, null, 2));

        // 获取access_token
        const accessToken = await getAccessToken();

        // 调用云函数
        const url = `https://api.weixin.qq.com/tcb/invokecloudfunction?access_token=${accessToken}&env=${envId}&name=${functionName}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('微信API原始响应:', result);

        if (result.errcode && result.errcode !== 0) {
            throw new Error(`微信API错误 ${result.errcode}: ${result.errmsg}`);
        }

        // 解析响应数据
        let parsedResult;
        if (result.resp_data) {
            try {
                parsedResult = JSON.parse(result.resp_data);
            } catch (parseError) {
                console.error('解析resp_data失败:', parseError);
                parsedResult = { success: false, message: '数据解析失败' };
            }
        } else {
            parsedResult = result;
        }

        console.log('解析后的结果:', parsedResult);
        return parsedResult;

    } catch (error) {
        console.error('真实云函数调用失败:', error.message);
        throw error;
    }
}

// 获取access_token的接口
app.get('/api/get-access-token', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        res.json({
            success: true,
            access_token: accessToken,
            expires_in: 7200
        });
    } catch (error) {
        console.error('获取access_token失败:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});





// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: '简化版后台服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 启动服务器
app.listen(port, '0.0.0.0', () => {
    console.log('🚀 简化版后台服务器启动成功!');
    console.log(`📡 服务端口: ${port}`);
    console.log(`🌐 管理后台: /index.html`);
    console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
    console.log('⏹️  按 Ctrl+C 停止服务器');
});

module.exports = app;
