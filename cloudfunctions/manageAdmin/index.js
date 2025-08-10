// cloudfunctions/manageAdmin/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const { action, targetOpenid, adminData } = event
    const db = cloud.database()
    
    // 检查当前用户是否为超级管理员
    const currentAdminResult = await db.collection('admins').where({
      openid: OPENID,
      status: 'active',
      role: 'super_admin'
    }).get()
    
    if (currentAdminResult.data.length === 0) {
      return {
        success: false,
        message: '权限不足，需要超级管理员权限'
      }
    }
    
    switch (action) {
      case 'add':
        // 添加管理员
        const addResult = await db.collection('admins').add({
          data: {
            openid: targetOpenid,
            role: adminData.role || 'admin',
            name: adminData.name || '',
            phone: adminData.phone || '',
            permissions: adminData.permissions || ['products', 'orders', 'banners'],
            status: 'active',
            createTime: new Date(),
            updateTime: new Date(),
            createdBy: OPENID
          }
        })
        return {
          success: true,
          message: '管理员添加成功',
          adminId: addResult._id
        }
        
      case 'remove':
        // 移除管理员
        const removeResult = await db.collection('admins').where({
          openid: targetOpenid
        }).update({
          data: {
            status: 'inactive',
            updateTime: new Date(),
            removedBy: OPENID
          }
        })
        return {
          success: true,
          message: '管理员移除成功',
          updated: removeResult.stats.updated
        }
        
      case 'list':
        // 获取管理员列表
        const listResult = await db.collection('admins').where({
          status: 'active'
        }).orderBy('createTime', 'desc').get()
        return {
          success: true,
          admins: listResult.data
        }
        
      case 'update':
        // 更新管理员信息
        const updateResult = await db.collection('admins').where({
          openid: targetOpenid
        }).update({
          data: {
            ...adminData,
            updateTime: new Date()
          }
        })
        return {
          success: true,
          message: '管理员信息更新成功',
          updated: updateResult.stats.updated
        }
        
      default:
        return {
          success: false,
          message: '无效的操作'
        }
    }
  } catch (err) {
    console.error('管理管理员失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
} 