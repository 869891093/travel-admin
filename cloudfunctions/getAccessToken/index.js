// 获取access_token的云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    console.log('=== 获取access_token开始 ===');
    
    // 从环境变量或配置中获取appid和secret
    const appid = process.env.WECHAT_APPID || 'your_appid_here';
    const secret = process.env.WECHAT_SECRET || 'your_secret_here';
    
    console.log('AppID:', appid);
    console.log('Secret:', secret);
    
    if (appid === 'your_appid_here' || secret === 'your_secret_here') {
      console.error('请配置正确的AppID和Secret');
      return {
        success: false,
        message: '请配置正确的AppID和Secret'
      };
    }
    
    // 调用微信API获取access_token
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    
    console.log('请求URL:', url);
    
    const response = await cloud.callContainer({
      config: {
        env: cloud.DYNAMIC_CURRENT_ENV
      },
      path: '/cgi-bin/token',
      header: {
        'X-WX-SERVICE': 'api.weixin.qq.com',
        'content-type': 'application/json'
      },
      method: 'GET',
      data: {
        grant_type: 'client_credential',
        appid: appid,
        secret: secret
      }
    });
    
    console.log('微信API响应:', response);
    
    if (response.data && response.data.access_token) {
      console.log('获取access_token成功');
      return {
        success: true,
        access_token: response.data.access_token,
        expires_in: response.data.expires_in
      };
    } else {
      console.error('获取access_token失败:', response.data);
      return {
        success: false,
        message: response.data.errmsg || '获取access_token失败'
      };
    }
    
  } catch (error) {
    console.error('获取access_token异常:', error);
    return {
      success: false,
      message: error.message
    };
  }
} 