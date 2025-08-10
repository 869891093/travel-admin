// 删除数据云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { collection, id, updateData } = event
  
  try {
    // 检查文档是否存在
    const doc = await db.collection(collection).doc(id).get()
    
    if (!doc.data) {
      return {
        success: false,
        message: '文档不存在'
      }
    }
    
    // 如果提供了updateData，则执行更新操作
    if (updateData) {
      console.log('执行更新操作:', { collection, id, updateData })
      const result = await db.collection(collection).doc(id).update({
        data: {
          ...updateData,
          updateTime: new Date()
        }
      })
      
      return {
        success: true,
        message: '更新成功',
        data: result
      }
    } else {
      // 否则执行删除操作
      console.log('执行删除操作:', { collection, id })
      const result = await db.collection(collection).doc(id).remove()
      
      return {
        success: true,
        message: '删除成功',
        data: result
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    return {
      success: false,
      message: error.message
    }
  }
} 