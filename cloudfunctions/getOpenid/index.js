// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'new-travel-2gy6d6oy7ee5fb0e'
})

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
} 