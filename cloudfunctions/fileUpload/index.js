// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, fileName, fileData, contentType } = event
  const wxContext = cloud.getWXContext()

  try {
    switch (action) {
      case 'upload':
        return await uploadFile(fileName, fileData, contentType)
      default:
        return {
          success: false,
          message: '未知操作'
        }
    }
  } catch (error) {
    console.error('文件上传错误:', error)
    return {
      success: false,
      message: error.message || '上传失败'
    }
  }
}

// 上传文件到云存储
async function uploadFile(fileName, fileData, contentType) {
  try {
    // 将base64数据转换为Buffer
    const buffer = Buffer.from(fileData, 'base64')
    
    // 上传到云存储
    const result = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: buffer,
    })
    
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
