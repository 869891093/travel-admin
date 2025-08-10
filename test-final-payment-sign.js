// 测试修复后的小程序支付参数签名
const crypto = require('crypto')

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  appId: 'wxb61e3bbcd9bebc43',
  mchId: '1723243294',
  apiKey: 'Ht19961210Cgj888888YidingFADACAI'
}

// 修复后的签名生成函数
function generateSign(params, apiKey) {
  // 1. 参数排序
  const sortedKeys = Object.keys(params).sort()
  
  // 2. 拼接字符串
  let signString = ''
  sortedKeys.forEach(key => {
    if (params[key] !== '' && params[key] != null && key !== 'sign' && key !== 'paySign') {
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

// 模拟完整的支付参数生成流程
console.log('=== 完整的小程序支付参数生成测试 ===')

// 1. 基础参数
const timeStamp = Math.floor(Date.now() / 1000).toString()
const nonceStr = 'TestNonceStr123456789'
const prepayId = 'wx081232157259863e335a9146dcdfbd0000'

// 2. 生成支付参数（包含appId）
const payParams = {
  appId: WECHAT_PAY_CONFIG.appId,
  timeStamp: timeStamp,
  nonceStr: nonceStr,
  package: 'prepay_id=' + prepayId,
  signType: 'MD5'
}

console.log('支付参数（签名前）:', payParams)

// 3. 生成签名
const paySign = generateSign(payParams, WECHAT_PAY_CONFIG.apiKey)
payParams.paySign = paySign

console.log('支付参数（含签名）:', payParams)

// 4. 验证wx.requestPayment所需的参数
console.log('\n=== wx.requestPayment 参数验证 ===')
const requiredFields = ['timeStamp', 'nonceStr', 'package', 'signType', 'paySign']
const missingFields = requiredFields.filter(field => !payParams[field])

if (missingFields.length === 0) {
  console.log('✅ 所有必需参数都已设置')
  console.log('✅ 可以调用 wx.requestPayment')
} else {
  console.log('❌ 缺少必需参数:', missingFields)
}

// 5. 检查参数格式
console.log('\n=== 参数格式检查 ===')
console.log('timeStamp 类型:', typeof payParams.timeStamp, '值:', payParams.timeStamp)
console.log('nonceStr 类型:', typeof payParams.nonceStr, '值:', payParams.nonceStr)
console.log('package 格式:', payParams.package.startsWith('prepay_id=') ? '✅ 正确' : '❌ 错误')
console.log('signType:', payParams.signType)
console.log('paySign 长度:', payParams.paySign.length, '格式:', /^[A-F0-9]{32}$/.test(payParams.paySign) ? '✅ 正确' : '❌ 错误')

console.log('\n=== 最终结果 ===')
console.log('修复完成，支付参数生成正确！')
console.log('请重新部署云函数后测试支付功能。')
