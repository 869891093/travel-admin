// cloudfunctions/checkAdmin/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext()
    const db = cloud.database()
    
    console.log('检查管理员权限，openid:', OPENID)
    
    // 先查询所有管理员记录（不限制status）
    const allAdmins = await db.collection('admins').where({
      openid: OPENID
    }).get()
    
    console.log('查询到的管理员记录:', allAdmins.data)
    
    // 如果有管理员记录，就认为是管理员
    const isAdmin = allAdmins.data.length > 0
    
    // 如果查询到管理员记录，再检查是否有status字段
    let adminInfo = null
    if (isAdmin) {
      adminInfo = allAdmins.data[0]
      
      // 如果有status字段且不是active，给出警告但不阻止
      if (adminInfo.status && adminInfo.status !== 'active') {
        console.log('管理员状态不是active:', adminInfo.status)
      }
    }
    
    console.log('权限检查结果:', {
      isAdmin: isAdmin,
      adminInfo: adminInfo,
      openid: OPENID
    })
    
    return {
      success: true,
      isAdmin: isAdmin,
      openid: OPENID,
      adminInfo: adminInfo
    }
  } catch (err) {
    console.error('检查管理员权限失败:', err)
    return {
      success: false,
      isAdmin: false,
      error: err.message
    }
  }
}