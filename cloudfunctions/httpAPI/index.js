// HTTP API网关云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, collection, data, id, query } = event
  
  console.log('=== 云函数调用开始 ===')
  console.log('环境ID:', cloud.DYNAMIC_CURRENT_ENV)
  console.log('调用参数:', { action, collection, data, id, query })
  
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
      case 'testConnection':
        return await testConnection()
      case 'uploadFile':
        return await uploadFile(event.fileName, event.fileData, event.contentType)
      case 'checkWebAdmin':
        return await checkWebAdmin(event.openid, event.adminKey)
      default:
        return { success: false, message: '未知操作' }
    }
  } catch (error) {
    console.error('云函数执行错误:', error)
    return { success: false, message: error.message }
  }
}

// 测试数据库连接
async function testConnection() {
  try {
    console.log('=== 测试数据库连接 ===')
    
    // 测试获取products集合的数据
    console.log('测试products集合...')
    const products = await db.collection('products').limit(1).get()
    console.log('products集合测试成功，数据条数:', products.data.length)
    
    // 测试获取regions集合的数据
    console.log('测试regions集合...')
    const regions = await db.collection('regions').limit(1).get()
    console.log('regions集合测试成功，数据条数:', regions.data.length)
    
    // 测试获取banners集合的数据
    console.log('测试banners集合...')
    const banners = await db.collection('banners').limit(1).get()
    console.log('banners集合测试成功，数据条数:', banners.data.length)
    
    // 测试获取orders集合的数据
    console.log('测试orders集合...')
    const orders = await db.collection('orders').limit(1).get()
    console.log('orders集合测试成功，数据条数:', orders.data.length)
    
    return { 
      success: true, 
      data: {
        products: products.data.length,
        regions: regions.data.length,
        banners: banners.data.length,
        orders: orders.data.length,
        message: '所有集合连接正常'
      }
    }
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    return { success: false, message: error.message }
  }
}

// 获取数据
async function getData(collection, query = {}) {
  try {
    console.log(`=== 获取${collection}数据 ===`)
    console.log('查询条件:', query)
    
    let dbQuery = db.collection(collection)
    
    // 应用查询条件
    if (query && query.where) {
      dbQuery = dbQuery.where(query.where)
    }
    
    if (query && query.orderBy) {
      dbQuery = dbQuery.orderBy(query.orderBy.field, query.orderBy.direction || 'asc')
    }
    
    if (query && query.limit) {
      dbQuery = dbQuery.limit(query.limit)
    }
    
    if (query && query.skip) {
      dbQuery = dbQuery.skip(query.skip)
    }
    
    const result = await dbQuery.get()
    console.log(`获取${collection}数据成功，数量:`, result.data.length)
    return { success: true, data: result.data }
  } catch (error) {
    console.error(`获取${collection}数据失败:`, error)
    return { success: false, message: error.message }
  }
}

// 添加数据
async function addData(collection, data) {
    try {
        console.log(`=== 添加数据到${collection} ===`)
        console.log('完整数据:', JSON.stringify(data, null, 2))
        
        // 添加创建时间
        data.createTime = new Date()
        data.updateTime = new Date()
        
        console.log('添加的数据:', data)
        const result = await db.collection(collection).add({ data })
        console.log(`添加${collection}成功:`, result)
        
        // 验证数据是否真的保存了
        const savedData = await db.collection(collection).doc(result._id).get()
        console.log('保存后的数据:', savedData.data)
        
        return { success: true, data: result }
    } catch (error) {
        console.error(`添加${collection}失败:`, error)
        return { success: false, message: error.message }
    }
}

// 更新数据
async function updateData(collection, id, data) {
  try {
    console.log(`=== 更新${collection}数据 ===`)
    
    // 添加更新时间
    data.updateTime = new Date()
    
    console.log('更新ID:', id)
    console.log('更新数据:', data)
    const result = await db.collection(collection).doc(id).update({ data })
    console.log(`更新${collection}成功:`, result)
    return { success: true, data: result }
  } catch (error) {
    console.error(`更新${collection}失败:`, error)
    return { success: false, message: error.message }
  }
}

// 删除数据
async function deleteData(collection, id) {
  try {
    console.log(`=== 删除${collection}数据 ===`)
    console.log('删除ID:', id)
    
    const result = await db.collection(collection).doc(id).remove()
    console.log(`删除${collection}成功:`, result)
    return { success: true, data: result }
  } catch (error) {
    console.error(`删除${collection}失败:`, error)
    return { success: false, message: error.message }
  }
}

// 获取统计数据
async function getStats() {
  try {
    console.log('=== 获取统计数据 ===')
    
    const stats = {
      productCount: 0,
      regionCount: 0,
      orderCount: 0,
      userCount: 0
    }
    
    // 逐个测试每个集合
    const collections = ['products', 'regions', 'orders', 'users']
    
    for (const collectionName of collections) {
      try {
        console.log(`测试集合: ${collectionName}`)
        
        // 先尝试获取一条数据来测试集合是否存在
        const testResult = await db.collection(collectionName).limit(1).get()
        console.log(`${collectionName}集合测试成功，数据条数:`, testResult.data.length)
        
        // 如果集合存在，再获取总数
        if (collectionName === 'products' || collectionName === 'regions') {
          const countResult = await db.collection(collectionName).where({ status: 'active' }).count()
          stats[`${collectionName.replace('s', '')}Count`] = countResult.total
          console.log(`${collectionName}总数:`, countResult.total)
        } else {
          const countResult = await db.collection(collectionName).count()
          stats[`${collectionName.replace('s', '')}Count`] = countResult.total
          console.log(`${collectionName}总数:`, countResult.total)
        }
        
      } catch (error) {
        console.error(`测试集合${collectionName}失败:`, error.message)
        // 如果某个集合有问题，继续测试其他集合
      }
    }
    
    console.log('最终统计数据:', stats)
    return { success: true, data: stats }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return { success: false, message: error.message }
  }
}

// 上传文件到云存储
async function uploadFile(fileName, fileData, contentType) {
  try {
    console.log('开始上传文件:', fileName, '类型:', contentType)

    // 将base64数据转换为Buffer
    const buffer = Buffer.from(fileData, 'base64')
    console.log('文件大小:', buffer.length, 'bytes')

    // 上传到云存储
    const result = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: buffer,
    })

    console.log('上传成功:', result.fileID)

    return {
      success: true,
      message: '上传成功',
      fileID: result.fileID,
      fileName: fileName
    }
  } catch (error) {
    console.error('上传文件失败:', error)
    return {
      success: false,
      message: '上传失败: ' + error.message
    }
  }
}

// 检查网页端管理员权限
async function checkWebAdmin(openid, adminKey) {
  try {
    console.log('检查网页端管理员权限:', openid)

    if (!openid) {
      return {
        success: false,
        message: '请提供OpenID'
      }
    }

    // 查询管理员表
    const adminResult = await db.collection('admins').where({
      openid: openid,
      status: 'active'
    }).get()

    console.log('管理员查询结果:', adminResult.data)

    if (adminResult.data.length === 0) {
      return {
        success: false,
        message: '该OpenID不是管理员，请联系超级管理员添加权限'
      }
    }

    const adminInfo = adminResult.data[0]

    // 如果设置了管理密钥，需要验证
    if (adminInfo.adminKey && adminInfo.adminKey !== adminKey) {
      return {
        success: false,
        message: '管理密钥不正确'
      }
    }

    // 记录登录日志
    try {
      await db.collection('admin_login_logs').add({
        data: {
          openid: openid,
          loginTime: new Date(),
          loginType: 'web',
          userAgent: 'Web Admin',
          ip: 'unknown'
        }
      })
    } catch (logError) {
      console.warn('记录登录日志失败:', logError)
    }

    return {
      success: true,
      isAdmin: true,
      message: '验证成功',
      adminInfo: {
        openid: adminInfo.openid,
        name: adminInfo.name || '管理员',
        role: adminInfo.role || 'admin',
        permissions: adminInfo.permissions || ['products', 'orders', 'banners', 'refunds'],
        phone: adminInfo.phone || '',
        createTime: adminInfo.createTime
      }
    }

  } catch (error) {
    console.error('检查网页端管理员权限失败:', error)
    return {
      success: false,
      message: '权限验证失败: ' + error.message
    }
  }
}