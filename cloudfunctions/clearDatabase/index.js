// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'new-travel-2gy6d6oy7ee5fb0e'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 删除所有产品数据
    const productsResult = await db.collection('products').where({
      status: 'active'
    }).remove()
    
    // 删除所有轮播图数据
    const bannersResult = await db.collection('banners').where({
      status: 'active'
    }).remove()
    
    // 删除所有区域数据
    const regionsResult = await db.collection('regions').where({
      status: 'active'
    }).remove()
    
    return {
      success: true,
      message: '数据库清理成功',
      results: {
        products: productsResult,
        banners: bannersResult,
        regions: regionsResult
      }
    }
    
  } catch (error) {
    console.error('数据库清理失败:', error)
    return {
      success: false,
      message: '数据库清理失败',
      error: error
    }
  }
} 