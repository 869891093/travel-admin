// 云函数入口文件
const cloud = require('wx-server-sdk')
const crypto = require('crypto')
const fs = require('fs')
const https = require('https')

// 明确指定环境ID
cloud.init({
  env: 'new-travel-2gy6d6oy7ee5fb0e'
})

const db = cloud.database()

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  appId: 'wxb61e3bbcd9bebc43', // 小程序AppID
  mchId: '1723243294', // 商户号
  apiKey: 'Ht19961210Cgj888888YidingFADACAI', // 商户API密钥
  notifyUrl: 'https://new-travel-2gy6d6oy7ee5fb0e.service.tcloudbase.com/paymentCallback', // 支付回调地址
  apiUrl: 'https://api.mch.weixin.qq.com' // 微信支付API地址
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, orderId, paymentData } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('支付请求:', {
    action,
    orderId,
    paymentData,
    openid
  })

  try {
    switch (action) {
      case 'createPayment':
        return await createPayment(orderId, openid)
      case 'queryPayment':
        return await queryPayment(orderId)
      case 'refundPayment':
        return await refundPayment(orderId, paymentData)
      case 'reviewRefund':
        return await reviewRefund(event.refundId, event.reviewData)
      case 'getRefundList':
        return await getRefundList(event.status)
      case 'processRefund':
        return await processRefund(event.refundId)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('支付操作失败:', error)
    return {
      success: false,
      message: error.message || '操作失败',
      error: error.toString()
    }
  }
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
    if (params[key] !== '' && params[key] != null && key !== 'sign' && key !== 'paySign') {
      signString += key + '=' + params[key] + '&'
    }
  })

  // 3. 加上API密钥
  signString += 'key=' + apiKey

  console.log('签名字符串:', signString)

  // 4. MD5加密并转大写
  const sign = crypto.createHash('md5').update(signString, 'utf8').digest('hex').toUpperCase()

  console.log('生成的签名:', sign)

  return sign
}

// 构建XML
function buildXML(obj) {
  let xml = '<xml>'
  for (let key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      xml += `<${key}>${obj[key]}</${key}>`
    }
  }
  xml += '</xml>'
  return xml
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

// HTTP请求函数
async function makeHttpRequest(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const https = require('https')
    
    const postData = typeof data === 'string' ? data : JSON.stringify(data)
    
    const urlObj = new URL(url)
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }
    
    const req = https.request(options, (res) => {
      let responseData = ''
      
      res.on('data', (chunk) => {
        responseData += chunk
      })
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: responseData,
          headers: res.headers
        })
      })
    })
    
    req.on('error', (err) => {
      reject(err)
    })
    
    req.write(postData)
    req.end()
  })
}

// 创建支付订单 - 真实微信支付
async function createPayment(orderId, openid) {
  try {
    console.log('开始创建支付订单:', orderId)
    
    // 查询订单信息
    const orderResult = await db.collection('orders').doc(orderId).get()
    if (!orderResult.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    const order = orderResult.data

    console.log('订单详细信息:', {
      orderId,
      orderStatus: order.status,
      totalPrice: order.totalPrice,
      orderOpenid: order.openid,
      currentOpenid: openid
    })

    // 检查订单状态
    if (order.status !== 'pending') {
      return {
        success: false,
        message: '订单状态不正确，当前状态：' + order.status
      }
    }

    // 检查订单是否属于当前用户
    if (order.openid !== openid) {
      return {
        success: false,
        message: '订单不属于当前用户'
      }
    }

    // 检查订单金额
    if (!order.totalPrice || order.totalPrice <= 0) {
      return {
        success: false,
        message: '订单金额无效，totalPrice: ' + order.totalPrice
      }
    }
    
    // 生成支付参数
    const nonceStr = generateNonceStr()
    const timeStamp = Math.floor(Date.now() / 1000).toString()
    const outTradeNo = order.orderNo || `ORDER_${orderId}_${Date.now()}`

    // 计算支付金额（转换为分）
    const totalFee = Math.round(order.totalPrice * 100)

    console.log('支付金额计算:', {
      originalPrice: order.totalPrice,
      totalFeeInCents: totalFee,
      outTradeNo: outTradeNo
    })

    // 统一下单参数
    const unifiedOrderParams = {
      appid: WECHAT_PAY_CONFIG.appId,
      mch_id: WECHAT_PAY_CONFIG.mchId,
      nonce_str: nonceStr,
      body: order.productTitle || order.productName || '旅游产品',
      out_trade_no: outTradeNo,
      total_fee: totalFee, // 转换为分
      spbill_create_ip: '127.0.0.1',
      notify_url: WECHAT_PAY_CONFIG.notifyUrl,
      trade_type: 'JSAPI',
      openid: openid
    }
    
    // 生成签名
    unifiedOrderParams.sign = generateSign(unifiedOrderParams, WECHAT_PAY_CONFIG.apiKey)
    
    // 构建XML请求体
    const xmlBody = buildXML(unifiedOrderParams)
    
    console.log('统一下单请求参数:', unifiedOrderParams)
    console.log('XML请求体:', xmlBody)
    
    // 调用微信统一下单API
    const response = await makeHttpRequest(
      WECHAT_PAY_CONFIG.apiUrl + '/pay/unifiedorder',
      xmlBody
    )
    
    console.log('微信支付响应状态码:', response.statusCode)
    console.log('微信支付响应数据:', response.data)

    if (response.statusCode !== 200) {
      return {
        success: false,
        message: `微信支付API调用失败，状态码: ${response.statusCode}`,
        details: response.data
      }
    }

    // 解析XML响应
    const responseData = parseXML(response.data)
    console.log('解析后的响应数据:', responseData)
    
    if (responseData.return_code === 'SUCCESS' && responseData.result_code === 'SUCCESS') {
      // 生成小程序支付参数
      const payParams = {
        appId: WECHAT_PAY_CONFIG.appId,
        timeStamp: timeStamp,
        nonceStr: nonceStr,
        package: 'prepay_id=' + responseData.prepay_id,
        signType: 'MD5'
      }

      console.log('小程序支付参数（签名前）:', payParams)

      // 生成支付签名
      payParams.paySign = generateSign(payParams, WECHAT_PAY_CONFIG.apiKey)

      console.log('小程序支付参数（含签名）:', payParams)
      
      // 更新订单信息
      await db.collection('orders').doc(orderId).update({
        data: {
          orderNo: outTradeNo,
          updateTime: new Date()
        }
      })
      
      return {
        success: true,
        message: '支付订单创建成功',
        payment: payParams
      }
    } else {
      console.error('微信支付API返回错误:', responseData)
      return {
        success: false,
        message: responseData.return_msg || responseData.err_code_des || '支付订单创建失败',
        errorCode: responseData.err_code,
        returnCode: responseData.return_code,
        resultCode: responseData.result_code,
        details: responseData
      }
    }
    
  } catch (error) {
    console.error('创建支付订单失败:', error)
    return {
      success: false,
      message: '创建支付订单失败: ' + error.message
    }
  }
}

// 查询支付状态
async function queryPayment(orderId) {
  try {
    console.log('查询支付状态:', orderId)
    
    const orderResult = await db.collection('orders').doc(orderId).get()
    if (!orderResult.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    const order = orderResult.data
    
    if (!order.orderNo) {
      return {
        success: false,
        message: '订单号不存在'
      }
    }
    
    // 查询微信支付状态
    const queryParams = {
      appid: WECHAT_PAY_CONFIG.appId,
      mch_id: WECHAT_PAY_CONFIG.mchId,
      out_trade_no: order.orderNo,
      nonce_str: generateNonceStr()
    }
    
    queryParams.sign = generateSign(queryParams, WECHAT_PAY_CONFIG.apiKey)
    
    const xmlBody = buildXML(queryParams)
    
    const response = await makeHttpRequest(
      WECHAT_PAY_CONFIG.apiUrl + '/pay/orderquery',
      xmlBody
    )
    
    if (response.statusCode === 200) {
      const responseData = parseXML(response.data)
      
      if (responseData.return_code === 'SUCCESS' && responseData.result_code === 'SUCCESS') {
        // 更新订单状态
        if (responseData.trade_state === 'SUCCESS') {
          await db.collection('orders').doc(orderId).update({
            data: {
              status: 'paid',
              paymentTime: new Date(),
              transactionId: responseData.transaction_id,
              updateTime: new Date()
            }
          })
        }
        
        return {
          success: true,
          message: '查询成功',
          order: {
            ...order,
            tradeState: responseData.trade_state,
            transactionId: responseData.transaction_id
          }
        }
      } else {
        return {
          success: false,
          message: responseData.return_msg || '查询失败'
        }
      }
    } else {
      return {
        success: false,
        message: '查询支付状态失败'
      }
    }
    
  } catch (error) {
    console.error('查询支付状态失败:', error)
    return {
      success: false,
      message: '查询支付状态失败: ' + error.message
    }
  }
}

// 退款
async function refundPayment(orderId, refundData) {
  try {
    console.log('开始退款:', orderId, refundData)

    const orderResult = await db.collection('orders').doc(orderId).get()
    if (!orderResult.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }

    const order = orderResult.data
    console.log('订单信息:', {
      orderId,
      status: order.status,
      orderNo: order.orderNo,
      totalPrice: order.totalPrice
    })

    if (order.status !== 'paid') {
      return {
        success: false,
        message: `订单状态不正确，当前状态: ${order.status}，无法退款`
      }
    }

    if (!order.orderNo) {
      return {
        success: false,
        message: '订单号不存在，无法退款'
      }
    }

    // 检查是否已经退款
    if (order.status === 'refunded') {
      return {
        success: false,
        message: '订单已经退款，请勿重复申请'
      }
    }

    // 第一步：创建退款申请记录
    const refundAmount = refundData.amount || order.totalPrice
    const outRefundNo = 'REFUND_' + Date.now()

    console.log('退款金额:', refundAmount)
    console.log('退款单号:', outRefundNo)

    try {
      // 创建退款申请记录
      const refundRecord = await db.collection('refunds').add({
        data: {
          orderId: orderId,
          userId: order.openid,
          orderNo: order.orderNo,
          amount: refundAmount,
          reason: refundData.reason || '用户申请退款',
          status: 'pending', // pending, approved, rejected, completed
          applyTime: new Date(),
          outRefundNo: outRefundNo,
          createTime: new Date()
        }
      })

      console.log('退款申请记录创建成功:', refundRecord._id)

      // 更新订单状态为退款申请中
      await db.collection('orders').doc(orderId).update({
        data: {
          status: 'refund_pending',
          refundApplyTime: new Date(),
          updateTime: new Date()
        }
      })

      return {
        success: true,
        message: '退款申请已提交，等待审核',
        refund: {
          refundId: refundRecord._id,
          outRefundNo: outRefundNo,
          status: 'pending',
          message: '退款申请已提交，管理员审核后将进行退款处理'
        }
      }
    } catch (error) {
      console.error('创建退款申请失败:', error)
      return {
        success: false,
        message: '退款申请失败: ' + error.message
      }
    }

  } catch (error) {
    console.error('退款处理失败:', error)
    return {
      success: false,
      message: '退款处理失败: ' + error.message
    }
  }
}

// 管理员审核退款
async function reviewRefund(refundId, reviewData) {
  try {
    console.log('开始审核退款:', refundId, reviewData)

    const refundResult = await db.collection('refunds').doc(refundId).get()
    if (!refundResult.data) {
      return {
        success: false,
        message: '退款申请不存在'
      }
    }

    const refund = refundResult.data
    if (refund.status !== 'pending') {
      return {
        success: false,
        message: '退款申请状态不正确，无法审核'
      }
    }

    // 更新退款申请状态
    await db.collection('refunds').doc(refundId).update({
      data: {
        status: reviewData.approved ? 'approved' : 'rejected',
        reviewTime: new Date(),
        reviewerId: reviewData.reviewerId,
        reviewNote: reviewData.note,
        updateTime: new Date()
      }
    })

    if (reviewData.approved) {
      // 审核通过，调用真实的微信退款API
      const processResult = await processRefund(refundId)
      return processResult
    } else {
      // 审核拒绝，更新订单状态
      await db.collection('orders').doc(refund.orderId).update({
        data: {
          status: 'paid', // 恢复为已支付状态
          updateTime: new Date()
        }
      })

      return {
        success: true,
        message: '退款申请已拒绝',
        refund: {
          refundId: refundId,
          status: 'rejected'
        }
      }
    }
  } catch (error) {
    console.error('审核退款失败:', error)
    return {
      success: false,
      message: '审核失败: ' + error.message
    }
  }
}

// 处理真实的微信退款
async function processRefund(refundId) {
  try {
    console.log('开始处理微信退款:', refundId)

    const refundResult = await db.collection('refunds').doc(refundId).get()
    if (!refundResult.data) {
      return {
        success: false,
        message: '退款申请不存在'
      }
    }

    const refund = refundResult.data

    // 获取订单信息
    const orderResult = await db.collection('orders').doc(refund.orderId).get()
    if (!orderResult.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }

    const order = orderResult.data

    // 构建退款参数
    const refundParams = {
      appid: WECHAT_PAY_CONFIG.appId,
      mch_id: WECHAT_PAY_CONFIG.mchId,
      nonce_str: generateNonceStr(),
      out_trade_no: order.orderNo,
      out_refund_no: refund.outRefundNo,
      total_fee: Math.round(order.totalPrice * 100),
      refund_fee: Math.round(refund.amount * 100)
    }

    refundParams.sign = generateSign(refundParams, WECHAT_PAY_CONFIG.apiKey)

    console.log('退款请求参数:', refundParams)

    const xmlBody = buildXML(refundParams)
    console.log('退款XML请求体:', xmlBody)

    // 使用证书调用微信退款API
    const response = await makeHttpsRequestWithCert(
      WECHAT_PAY_CONFIG.apiUrl + '/secapi/pay/refund',
      xmlBody
    )

    console.log('微信退款API响应:', response)

    if (response.statusCode === 200) {
      const responseData = parseXML(response.data)
      console.log('解析后的退款响应:', responseData)

      if (responseData.return_code === 'SUCCESS' && responseData.result_code === 'SUCCESS') {
        // 退款成功，更新记录
        await db.collection('refunds').doc(refundId).update({
          data: {
            status: 'completed',
            refundTime: new Date(),
            wechatRefundId: responseData.refund_id,
            updateTime: new Date()
          }
        })

        // 更新订单状态
        await db.collection('orders').doc(refund.orderId).update({
          data: {
            status: 'refunded',
            refundTime: new Date(),
            refundAmount: refund.amount,
            updateTime: new Date()
          }
        })

        return {
          success: true,
          message: '退款成功',
          refund: {
            refundId: refundId,
            wechatRefundId: responseData.refund_id,
            status: 'completed'
          }
        }
      } else {
        console.error('微信退款API返回错误:', responseData)

        // 更新退款状态为失败
        await db.collection('refunds').doc(refundId).update({
          data: {
            status: 'failed',
            errorCode: responseData.err_code,
            errorMsg: responseData.err_code_des,
            updateTime: new Date()
          }
        })

        return {
          success: false,
          message: responseData.return_msg || responseData.err_code_des || '退款失败',
          errorCode: responseData.err_code
        }
      }
    } else {
      console.error('微信退款API调用失败，状态码:', response.statusCode)
      return {
        success: false,
        message: `退款请求失败，HTTP状态码: ${response.statusCode}`
      }
    }
  } catch (error) {
    console.error('处理微信退款失败:', error)
    return {
      success: false,
      message: '退款处理失败: ' + error.message
    }
  }
}

// 获取退款列表
async function getRefundList(status) {
  try {
    console.log('获取退款列表，状态:', status)

    let query = db.collection('refunds').orderBy('applyTime', 'desc')

    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }

    const result = await query.limit(50).get()

    return {
      success: true,
      data: result.data,
      total: result.data.length
    }
  } catch (error) {
    console.error('获取退款列表失败:', error)
    return {
      success: false,
      message: '获取退款列表失败: ' + error.message
    }
  }
}

// 带证书的HTTPS请求
function makeHttpsRequestWithCert(url, data) {
  return new Promise((resolve, reject) => {
    try {
      // 读取证书文件
      const cert = fs.readFileSync('./cert/apiclient_cert.pem')
      const key = fs.readFileSync('./cert/apiclient_key.pem')

      const urlObj = new URL(url)

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml',
          'Content-Length': Buffer.byteLength(data)
        },
        cert: cert,
        key: key,
        // 忽略证书验证（生产环境中应该验证）
        rejectUnauthorized: false
      }

      const req = https.request(options, (res) => {
        let responseData = ''

        res.on('data', (chunk) => {
          responseData += chunk
        })

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          })
        })
      })

      req.on('error', (error) => {
        console.error('HTTPS请求错误:', error)
        reject(error)
      })

      req.write(data)
      req.end()
    } catch (error) {
      console.error('创建HTTPS请求失败:', error)
      reject(error)
    }
  })
}