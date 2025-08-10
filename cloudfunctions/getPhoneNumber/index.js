// cloudfunctions/getPhoneNumber/index.js
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const res = await cloud.getOpenData({
      list: [event.cloudID]
    })
    
    return {
      success: true,
      phoneNumber: res.list[0].data.phoneNumber
    }
  } catch (err) {
    console.error('获取手机号失败:', err)
    return {
      success: false,
      error: err
    }
  }
} 