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

  console.log('删除订单请求:', {
    orderId,
    openid
  })

  try {
    // 查询订单信息
    const orderResult = await db.collection('orders').doc(orderId).get()
    if (!orderResult.data) {
      return {
        success: false,
        message: '订单不存在'
      }
    }
    
    const order = orderResult.data
    
    // 检查订单是否属于当前用户
    if (order.openid !== openid) {
      return {
        success: false,
        message: '订单不属于当前用户'
      }
    }
    
    // 检查订单状态，只有已取消或已退款的订单才能删除
    if (order.status !== 'cancelled' && order.status !== 'refunded') {
      return {
        success: false,
        message: '只有已取消或已退款的订单才能删除'
      }
    }
    
    // 软删除订单（设置isDeleted为true）
    await db.collection('orders').doc(orderId).update({
      data: {
        isDeleted: true,
        deleteTime: new Date(),
        updateTime: new Date()
      }
    })
    
    console.log('订单删除成功:', orderId)
    
    return {
      success: true,
      message: '订单删除成功'
    }
    
  } catch (error) {
    console.error('删除订单失败:', error)
    return {
      success: false,
      message: '删除订单失败: ' + error.message
    }
  }
} 