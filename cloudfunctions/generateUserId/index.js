// cloudfunctions/generateUserId/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const db = cloud.database()
    
    // 生成8位随机数字ID
    function generateUserId() {
      return Math.floor(10000000 + Math.random() * 90000000).toString()
    }
    
    // 检查ID是否已存在，如果存在则重新生成
    async function getUniqueUserId() {
      let userId = generateUserId()
      let attempts = 0
      const maxAttempts = 10
      
      while (attempts < maxAttempts) {
        const result = await db.collection('users').where({
          userId: userId
        }).get()
        
        if (result.data.length === 0) {
          return userId // ID唯一，返回
        }
        
        userId = generateUserId() // 重新生成
        attempts++
      }
      
      throw new Error('无法生成唯一用户ID，请重试')
    }
    
    const uniqueUserId = await getUniqueUserId()
    
    return {
      success: true,
      userId: uniqueUserId
    }
  } catch (err) {
    console.error('生成用户ID失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
} 