// 测试支付参数生成
const crypto = require('crypto')

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  appId: 'wxb61e3bbcd9bebc43',
  mchId: '1723243294',
  apiKey: 'Ht19961210Cgj888888YidingFADACAI'
}

// 生成随机字符串
function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成签名
function generateSign(params, apiKey) {
  // 1. 参数排序
  const sortedKeys = Object.keys(params).sort()
  
  // 2. 拼接字符串
  let signString = ''
  sortedKeys.forEach(key => {
    if (params[key] !== '' && params[key] != null && key !== 'sign') {
      signString += key + '=' + params[key] + '&'
    }
  })
  
  // 3. 加上API密钥
  signString += 'key=' + apiKey
  
  console.log('签名字符串:', signString)
  
  // 4. MD5加密并转大写
  const sign = crypto.createHash('md5').update(signString, 'utf8').digest('hex').toUpperCase()
  
  return sign
}

// 测试订单数据
const testOrder = {
  totalPrice: 100.50, // 100.5元
  productTitle: '测试旅游产品',
  orderNo: 'TEST_ORDER_123'
}

const openid = 'test_openid_123'

// 生成支付参数
const nonceStr = generateNonceStr()
const timeStamp = Math.floor(Date.now() / 1000).toString()
const totalFee = Math.round(testOrder.totalPrice * 100) // 转换为分

console.log('=== 支付参数测试 ===')
console.log('原始金额:', testOrder.totalPrice, '元')
console.log('转换后金额:', totalFee, '分')

// 统一下单参数
const unifiedOrderParams = {
  appid: WECHAT_PAY_CONFIG.appId,
  mch_id: WECHAT_PAY_CONFIG.mchId,
  nonce_str: nonceStr,
  body: testOrder.productTitle,
  out_trade_no: testOrder.orderNo,
  total_fee: totalFee,
  spbill_create_ip: '127.0.0.1',
  notify_url: 'https://new-travel-2gy6d6oy7ee5fb0e.service.tcloudbase.com/paymentCallback',
  trade_type: 'JSAPI',
  openid: openid
}

console.log('\n=== 统一下单参数 ===')
console.log(JSON.stringify(unifiedOrderParams, null, 2))

// 生成签名
const sign = generateSign(unifiedOrderParams, WECHAT_PAY_CONFIG.apiKey)
unifiedOrderParams.sign = sign

console.log('\n=== 最终参数（含签名） ===')
console.log(JSON.stringify(unifiedOrderParams, null, 2))

// 验证必需参数
const requiredParams = ['appid', 'mch_id', 'nonce_str', 'body', 'out_trade_no', 'total_fee', 'spbill_create_ip', 'notify_url', 'trade_type', 'openid', 'sign']
const missingParams = requiredParams.filter(param => !unifiedOrderParams[param])

if (missingParams.length > 0) {
  console.log('\n❌ 缺少必需参数:', missingParams)
} else {
  console.log('\n✅ 所有必需参数都已设置')
}

// 检查total_fee
if (unifiedOrderParams.total_fee && unifiedOrderParams.total_fee > 0) {
  console.log('✅ total_fee 参数正确:', unifiedOrderParams.total_fee)
} else {
  console.log('❌ total_fee 参数错误:', unifiedOrderParams.total_fee)
}
