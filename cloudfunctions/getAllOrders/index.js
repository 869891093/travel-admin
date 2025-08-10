// 云函数入口文件
const cloud = require('wx-server-sdk')

// 明确指定环境ID
cloud.init({
  env: 'new-travel-2gy6d6oy7ee5fb0e'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('查询所有订单请求:', {
    openid
  })

  try {
    // 查询所有订单
    console.log('开始查询所有订单')
    const ordersResult = await db.collection('orders').get()
    console.log('查询结果:', ordersResult)
    
    return {
      success: true,
      message: '查询成功',
      orders: ordersResult.data,
      count: ordersResult.data.length
    }
    
  } catch (error) {
    console.error('查询所有订单失败:', error)
    return {
      success: false,
      message: '查询失败: ' + error.message,
      error: error.toString()
    }
  }
} 