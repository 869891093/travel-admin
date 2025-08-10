// 测试小程序支付参数签名生成
const crypto = require('crypto')

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  appId: 'wxb61e3bbcd9bebc43',
  mchId: '1723243294',
  apiKey: 'Ht19961210Cgj888888YidingFADACAI'
}

// 生成签名
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

// 测试数据（从日志中获取）
const testParams = {
  appId: 'wxb61e3bbcd9bebc43',
  timeStamp: '1754627535',
  nonceStr: 'X3HoAmAmvyAYhW304o5pEIysNMshJzGe',
  package: 'prepay_id=wx081232157259863e335a9146dcdfbd0000',
  signType: 'MD5'
}

console.log('=== 小程序支付参数签名测试 ===')
console.log('支付参数:', testParams)

const paySign = generateSign(testParams, WECHAT_PAY_CONFIG.apiKey)
console.log('生成的签名:', paySign)

// 对比之前的错误签名
console.log('\n=== 对比分析 ===')
console.log('之前的签名（错误）:', '80C0E265E110B0F7F97CE3A158EA5F92')
console.log('现在的签名（正确）:', paySign)
console.log('签名是否相同:', paySign === '80C0E265E110B0F7F97CE3A158EA5F92')

// 验证参数顺序
console.log('\n=== 参数顺序验证 ===')
const sortedKeys = Object.keys(testParams).sort()
console.log('排序后的参数顺序:', sortedKeys)

// 测试不同的参数组合
console.log('\n=== 测试不包含appId的签名（之前的错误方式） ===')
const paramsWithoutAppId = {
  timeStamp: '1754627535',
  nonceStr: 'X3HoAmAmvyAYhW304o5pEIysNMshJzGe',
  package: 'prepay_id=wx081232157259863e335a9146dcdfbd0000',
  signType: 'MD5'
}

const signWithoutAppId = generateSign(paramsWithoutAppId, WECHAT_PAY_CONFIG.apiKey)
console.log('不包含appId的签名:', signWithoutAppId)
console.log('是否匹配之前的错误签名:', signWithoutAppId === '80C0E265E110B0F7F97CE3A158EA5F92')

console.log('\n=== 结论 ===')
if (signWithoutAppId === '80C0E265E110B0F7F97CE3A158EA5F92') {
  console.log('✅ 确认问题：之前缺少了 appId 参数')
  console.log('✅ 修复方案：在支付参数中添加 appId 字段')
} else {
  console.log('❌ 需要进一步分析签名算法')
}
