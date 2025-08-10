// 批量删除订单云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { orderIds } = event
  
  console.log('批量删除订单请求:', { orderIds })
  
  try {
    // 验证参数
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return {
        success: false,
        message: '请提供要删除的订单ID列表'
      }
    }
    
    // 限制批量删除数量
    if (orderIds.length > 50) {
      return {
        success: false,
        message: '单次最多只能删除50个订单'
      }
    }
    
    // 获取当前用户openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    console.log('操作用户openid:', openid)
    
    // 检查管理员权限
    const adminResult = await db.collection('admins').where({
      openid: openid,
      status: 'active'
    }).get()
    
    if (adminResult.data.length === 0) {
      return {
        success: false,
        message: '权限不足，只有管理员可以删除订单'
      }
    }
    
    console.log('管理员权限验证通过')
    
    // 批量删除订单
    let deletedCount = 0
    const failedIds = []
    
    for (const orderId of orderIds) {
      try {
        const deleteResult = await db.collection('orders').doc(orderId).remove()
        if (deleteResult.stats.removed > 0) {
          deletedCount++
          console.log(`订单 ${orderId} 删除成功`)
        } else {
          failedIds.push(orderId)
          console.log(`订单 ${orderId} 删除失败：未找到记录`)
        }
      } catch (error) {
        failedIds.push(orderId)
        console.error(`删除订单 ${orderId} 失败:`, error)
      }
    }
    
    console.log('批量删除完成:', {
      总数: orderIds.length,
      成功: deletedCount,
      失败: failedIds.length,
      失败ID列表: failedIds
    })
    
    // 记录操作日志
    try {
      await db.collection('admin_logs').add({
        data: {
          adminOpenid: openid,
          action: 'batch_delete_orders',
          details: {
            totalCount: orderIds.length,
            deletedCount: deletedCount,
            failedCount: failedIds.length,
            failedIds: failedIds
          },
          createTime: new Date()
        }
      })
    } catch (logError) {
      console.error('记录操作日志失败:', logError)
    }
    
    return {
      success: true,
      message: `批量删除完成，成功删除 ${deletedCount} 个订单`,
      deletedCount: deletedCount,
      failedCount: failedIds.length,
      failedIds: failedIds
    }
    
  } catch (error) {
    console.error('批量删除订单失败:', error)
    return {
      success: false,
      message: '批量删除失败: ' + error.message,
      error: error.toString()
    }
  }
}
