// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'new-travel-2gy6d6oy7ee5fb0e',
        traceUser: true,
      })
    }

    this.globalData = {
      userInfo: null,
      openid: null
    }
  },

  // 获取用户openid
  getOpenid: function() {
    return new Promise((resolve, reject) => {
      if (this.globalData.openid) {
        resolve(this.globalData.openid)
        return
      }
      
      // 测试模式：返回固定的openid
      const testMode = false // 设置为false关闭测试模式
      if (testMode) {
        this.globalData.openid = 'test_openid_123'
        resolve('test_openid_123')
        return
      }
      
      wx.cloud.callFunction({
        name: 'getOpenid',
        success: res => {
          this.globalData.openid = res.result.openid
          resolve(res.result.openid)
        },
        fail: err => {
          console.error('获取openid失败', err)
          reject(err)
        }
      })
    })
  }
})
