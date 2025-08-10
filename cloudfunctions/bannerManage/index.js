// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, bannerId, bannerData, newSort } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 使用与 checkAdmin 完全相同的权限检查逻辑
    
    // 查询管理员表 - 添加 status: 'active' 条件
    const adminResult = await db.collection('admins').where({
      openid: openid,
      status: 'active'  // 添加这个条件，与 checkAdmin 保持一致
    }).get()

    // 检查是否有管理员权限
    if (!adminResult.data || adminResult.data.length === 0) {
      return {
        success: false,
        message: '权限不足，需要管理员权限'
      }
    }

    const adminInfo = adminResult.data[0]

    // 权限检查通过，执行操作
    switch (action) {
      case 'getBanner':
        return await getBanner(bannerId)
      case 'getMaxSort':
        return await getMaxSort()
      case 'delete':
        return await deleteBanner(bannerId, adminInfo)
      case 'updateStatus':
        return await updateBannerStatus(bannerId, bannerData.status)
      case 'updateSort':
        return await updateBannerSort(newSort)
      case 'add':
        return await addBanner(bannerData)
      case 'update':
        return await updateBanner(bannerId, bannerData)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('轮播图管理错误:', error)
    return {
      success: false,
      message: error.message || '操作失败'
    }
  }
}

// 删除轮播图
async function deleteBanner(bannerId, adminInfo) {
  try {
    // 检查轮播图是否存在
    const banner = await db.collection('banners').doc(bannerId).get()
    
    if (!banner.data) {
      return {
        success: false,
        message: '轮播图不存在'
      }
    }

    // 删除轮播图
    const deleteResult = await db.collection('banners').doc(bannerId).remove()
    
    return {
      success: true,
      message: '删除成功'
    }
  } catch (error) {
    console.error('删除轮播图失败:', error)
    return {
      success: false,
      message: '删除失败'
    }
  }
}

// 更新轮播图状态 - 修复参数问题
async function updateBannerStatus(bannerId, status) {
  try {
    const updateResult = await db.collection('banners').doc(bannerId).update({
      data: { status: status }
    })
    
    return {
      success: true,
      message: '状态更新成功',
      debug: { updateResult }
    }
  } catch (error) {
    console.error('更新轮播图状态失败:', error)
    return {
      success: false,
      message: '状态更新失败: ' + error.message,
      debug: {
        error: error.toString(),
        stack: error.stack
      }
    }
  }
}

// 更新轮播图排序 - 使用单个更新操作替代批量操作
async function updateBannerSort(newSort) {
  try {
    if (!newSort || !Array.isArray(newSort) || newSort.length === 0) {
      return {
        success: false,
        message: '排序数据无效',
        debug: { newSort }
      }
    }
    
    // 验证每个轮播图都有 _id 字段
    const invalidBanners = newSort.filter(banner => !banner._id)
    if (invalidBanners.length > 0) {
      return {
        success: false,
        message: '轮播图数据缺少ID字段',
        debug: { invalidBanners }
      }
    }
    
    // 使用 Promise.all 进行并发更新，替代批量操作
    const updatePromises = newSort.map((banner, index) => {
      return db.collection('banners').doc(banner._id).update({
        data: { sort: index + 1 }
      })
    })
    
    const updateResults = await Promise.all(updatePromises)
    
    return {
      success: true,
      message: '排序更新成功',
      debug: { 
        updateResults,
        updatedCount: newSort.length,
        banners: newSort.map((b, i) => ({ id: b._id, sort: i + 1, title: b.title }))
      }
    }
  } catch (error) {
    console.error('更新轮播图排序失败:', error)
    return {
      success: false,
      message: '排序更新失败: ' + error.message,
      debug: {
        error: error.toString(),
        stack: error.stack,
        newSort: newSort
      }
    }
  }
}

// 添加轮播图 - 修复参数问题
async function addBanner(bannerData) {
  try {
    const result = await db.collection('banners').add({
      data: {
        ...bannerData,
        createTime: new Date(),
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: '添加成功',
      data: result._id,
      debug: { result }
    }
  } catch (error) {
    console.error('添加轮播图失败:', error)
    return {
      success: false,
      message: '添加失败: ' + error.message,
      debug: {
        error: error.toString(),
        stack: error.stack
      }
    }
  }
}

// 更新轮播图 - 修复参数问题
async function updateBanner(bannerId, bannerData) {
  try {
    const updateResult = await db.collection('banners').doc(bannerId).update({
      data: {
        ...bannerData,
        updateTime: new Date()
      }
    })
    
    return {
      success: true,
      message: '更新成功',
      debug: { updateResult }
    }
  } catch (error) {
    console.error('更新轮播图失败:', error)
    return {
      success: false,
      message: '更新失败: ' + error.message,
      debug: {
        error: error.toString(),
        stack: error.stack
      }
    }
  }
} 

// 获取单个轮播图
async function getBanner(bannerId) {
  try {
    const banner = await db.collection('banners').doc(bannerId).get()
    
    if (!banner.data) {
      return {
        success: false,
        message: '轮播图不存在',
        debug: { bannerId }
      }
    }
    
    return {
      success: true,
      message: '获取成功',
      data: banner.data
    }
  } catch (error) {
    console.error('获取轮播图失败:', error)
    return {
      success: false,
      message: '获取失败: ' + error.message,
      debug: {
        error: error.toString(),
        stack: error.stack
      }
    }
  }
}

// 获取最大排序号
async function getMaxSort() {
  try {
    const result = await db.collection('banners')
      .orderBy('sort', 'desc')
      .limit(1)
      .get()
    
    const maxSort = result.data.length > 0 ? result.data[0].sort : 0
    
    return {
      success: true,
      message: '获取成功',
      maxSort: maxSort
    }
  } catch (error) {
    console.error('获取最大排序失败:', error)
    return {
      success: false,
      message: '获取失败: ' + error.message,
      debug: {
        error: error.toString(),
        stack: error.stack
      }
    }
  }
} 