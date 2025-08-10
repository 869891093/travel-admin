// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, collection, data, id, query } = event
  
  try {
    switch (action) {
      case 'get':
        return await getData(collection, query)
      case 'add':
        return await addData(collection, data)
      case 'update':
        return await updateData(collection, id, data)
      case 'delete':
        return await deleteData(collection, id)
      case 'getStats':
        return await getStats()
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { success: false, message: error.message }
  }
}

// 获取数据
async function getData(collection, query = {}) {
  try {
    let dbQuery = db.collection(collection)
    
    // 应用查询条件
    if (query.where) {
      dbQuery = dbQuery.where(query.where)
    }
    
    if (query.orderBy) {
      dbQuery = dbQuery.orderBy(query.orderBy.field, query.orderBy.direction || 'asc')
    }
    
    if (query.limit) {
      dbQuery = dbQuery.limit(query.limit)
    }
    
    if (query.skip) {
      dbQuery = dbQuery.skip(query.skip)
    }
    
    const result = await dbQuery.get()
    return { success: true, data: result.data }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// 添加数据
async function addData(collection, data) {
  try {
    // 添加创建时间
    data.createTime = new Date()
    data.updateTime = new Date()
    
    const result = await db.collection(collection).add({ data })
    return { success: true, data: result }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// 更新数据
async function updateData(collection, id, data) {
  try {
    // 添加更新时间
    data.updateTime = new Date()
    
    const result = await db.collection(collection).doc(id).update({ data })
    return { success: true, data: result }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// 删除数据
async function deleteData(collection, id) {
  try {
    const result = await db.collection(collection).doc(id).remove()
    return { success: true, data: result }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

// 获取统计数据
async function getStats() {
  try {
    const [products, regions, orders, users] = await Promise.all([
      db.collection('products').where({ status: 'active' }).count(),
      db.collection('regions').where({ status: 'active' }).count(),
      db.collection('orders').count(),
      db.collection('users').count()
    ])
    
    return {
      success: true,
      data: {
        productCount: products.total,
        regionCount: regions.total,
        orderCount: orders.total,
        userCount: users.total
      }
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
} 