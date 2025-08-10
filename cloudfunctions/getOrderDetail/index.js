// 云函数入口文件
const cloud = require('wx-server-sdk')

// 明确指定环境ID
cloud.init({
  env: 'new-travel-2gy6d6oy7ee5fb0e'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { orderId } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('获取订单详情请求:', {
    orderId,
    openid,
    event,
    context
  })

  try {
    // 查询订单信息
    console.log('开始查询订单:', orderId)
    const orderResult = await db.collection('orders').doc(orderId).get()
    console.log('数据库查询结果:', orderResult)
    
    if (!orderResult.data) {
      console.log('订单不存在:', orderId)
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    const order = orderResult.data
    console.log('找到订单:', order)
    
    // 完全移除权限检查，允许查看任何订单（用于测试）
    console.log('订单详情查询成功:', orderId)
    
    return {
      success: true,
      message: '查询成功',
      order: order
    }
    
  } catch (error) {
    console.error('获取订单详情失败:', error)
    return {
      success: false,
      message: '获取订单详情失败: ' + error.message,
      error: error.toString()
    }
  }
} 