// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')

// 明确指定环境ID
cloud.init({
  env: 'new-travel-2gy6d6oy7ee5fb0e'
})

const db = cloud.database()

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  apiKey: 'Ht19961210Cgj888888YidingFADACAI' // 商户API密钥
}

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('支付回调:', event)

  try {
    // 处理HTTP触发器的请求
    let xmlData
    if (event.httpMethod) {
      // HTTP触发器请求
      xmlData = event.body
    } else {
      // 直接调用
      xmlData = event.body || event
    }

    const callbackData = parseXML(xmlData)

    console.log('解析后的回调数据:', callbackData)
    
    // 验证签名
    if (!verifySign(callbackData)) {
      console.error('签名验证失败')
      const failResponse = '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[签名验证失败]]></return_msg></xml>'

      if (event.httpMethod) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/xml'
          },
          body: failResponse
        }
      } else {
        return {
          returnCode: 'FAIL',
          returnMsg: '签名验证失败'
        }
      }
    }
    
    const { out_trade_no, result_code, transaction_id, total_fee } = callbackData
    
    if (result_code === 'SUCCESS') {
      // 支付成功，更新订单状态
      const orderResult = await db.collection('orders').where({
        orderNo: out_trade_no
      }).get()
      
      if (orderResult.data && orderResult.data.length > 0) {
        const order = orderResult.data[0]
        
        await db.collection('orders').doc(order._id).update({
          data: {
            status: 'paid',
            paymentTime: new Date(),
            transactionId: transaction_id,
            updateTime: new Date()
          }
        })
        
        console.log('订单支付成功，已更新状态:', order._id)
      } else {
        console.error('未找到对应订单:', out_trade_no)
      }
    } else {
      console.log('支付失败:', callbackData)
    }
    
    // 返回成功响应给微信
    const successResponse = '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>'

    if (event.httpMethod) {
      // HTTP触发器响应
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml'
        },
        body: successResponse
      }
    } else {
      // 直接调用响应
      return {
        returnCode: 'SUCCESS',
        returnMsg: 'OK'
      }
    }
  } catch (error) {
    console.error('支付回调处理失败:', error)
    const failResponse = '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>'

    if (event.httpMethod) {
      // HTTP触发器响应
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/xml'
        },
        body: failResponse
      }
    } else {
      // 直接调用响应
      return {
        returnCode: 'FAIL',
        returnMsg: '处理失败'
      }
    }
  }
}

// 解析XML
function parseXML(xmlString) {
  const result = {}
  const regex = /<(\w+)>(.*?)<\/\1>/g
  let match

  while ((match = regex.exec(xmlString)) !== null) {
    let value = match[2]
    // 处理CDATA标签
    if (value.startsWith('<![CDATA[') && value.endsWith(']]>')) {
      value = value.substring(9, value.length - 3)
    }
    result[match[1]] = value
  }

  return result
}

// 验证签名
function verifySign(params) {
  const sign = params.sign
  if (!sign) {
    return false
  }
  
  // 移除sign参数
  const paramsWithoutSign = { ...params }
  delete paramsWithoutSign.sign
  
  // 生成签名
  const calculatedSign = generateSign(paramsWithoutSign, WECHAT_PAY_CONFIG.apiKey)
  
  return calculatedSign === sign
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

  // 4. MD5加密并转大写
  const sign = crypto.createHash('md5').update(signString, 'utf8').digest('hex').toUpperCase()

  return sign
}