// pages/profile/profile.js
const db = wx.cloud.database()

Page({
  data: {
    userInfo: null,
    phone: '',
    loading: false,
    isLoggedIn: false,
    isEditing: false,
    genderOptions: ['未知', '男', '女'],
    genderIndex: 0,
    regionValue: ['', '', ''],
    editingNickName: '', // 编辑时的昵称
    isSuperAdmin: false // 是否为超级管理员
  },

  onLoad: function () {
    this.checkLoginStatus()
  },

  onShow: function () {
    // 只有在用户信息不存在时才重新检查登录状态
    if (!this.data.userInfo) {
      this.checkLoginStatus()
    }
  },

  // 检查登录状态
  checkLoginStatus: function () {
    const that = this
    wx.showLoading({ title: '加载中...' })

    getApp().getOpenid().then(openid => {
      console.log('当前用户openid:', openid)
      
      // 查询用户信息
      return db.collection('users').where({
        openid: openid
      }).get()
    }).then(res => {
      wx.hideLoading()
      console.log('用户信息查询结果:', res)
      
      if (res.data.length > 0) {
        const userInfo = res.data[0]
        console.log('加载的用户信息:', userInfo)
        
        // 如果用户没有userId，生成一个
        if (!userInfo.userId) {
          console.log('用户没有userId，正在生成...')
          return this.generateUserId(userInfo._id)
        }
        
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true,
          phone: userInfo.phone || '' // 设置手机号
        })
        
        // 异步检查管理员权限
        this.checkSuperAdminAsync(userInfo)
        
        // 初始化编辑数据
        this.initEditData(userInfo)
      } else {
        this.setData({
          userInfo: null,
          isLoggedIn: false
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('检查登录状态失败:', err)
      that.setData({
        isLoggedIn: false
      })
      wx.showToast({
        title: '加载用户信息失败',
        icon: 'none'
      })
    })
  },

  // 异步检查超级管理员权限（不阻塞页面显示）
  checkSuperAdminAsync: function (userInfo) {
    const that = this
    
    // 调用云函数检查管理员权限
    wx.cloud.callFunction({
      name: 'checkAdmin',
      data: {
        openid: userInfo.openid
      }
    }).then(res => {
      console.log('管理员权限检查结果:', res)
      
      if (res.result && res.result.isAdmin) {
        that.setData({
          isSuperAdmin: true
        })
        console.log('用户是超级管理员')
      } else {
        that.setData({
          isSuperAdmin: false
        })
        console.log('用户不是超级管理员')
      }
    }).catch(err => {
      console.error('检查管理员权限失败:', err)
      that.setData({
        isSuperAdmin: false
      })
    })
  },

  // 初始化编辑数据
  initEditData: function (userInfo) {
    // 设置性别索引 - 修复性别映射逻辑
    let genderIndex = 0
    if (userInfo.gender === 1) {
      genderIndex = 1
    } else if (userInfo.gender === 2) {
      genderIndex = 2
    } else {
      genderIndex = 0
    }
    
    // 设置地区值
    const regionValue = [
      userInfo.province || '',
      userInfo.city || '',
      userInfo.country || ''
    ]
    
    console.log('初始化编辑数据:', { genderIndex, regionValue, originalGender: userInfo.gender })
    
    this.setData({
      genderIndex: genderIndex,
      regionValue: regionValue,
      editingNickName: userInfo.nickName || '', // 初始化编辑昵称
      phone: userInfo.phone || '' // 确保手机号被正确设置
    })
  },

  // 切换编辑模式
  toggleEdit: function () {
    const isEditing = !this.data.isEditing
    this.setData({
      isEditing: isEditing
    })
    
    if (!isEditing) {
      // 退出编辑模式时保存数据
      this.saveUserInfo()
    }
  },

  // 昵称输入
  onNickNameInput: function (e) {
    this.setData({
      editingNickName: e.detail.value
    })
  },

  // 性别选择
  onGenderChange: function (e) {
    const index = parseInt(e.detail.value)
    console.log('性别选择改变:', index, '对应选项:', this.data.genderOptions[index])
    this.setData({
      genderIndex: index
    })
  },

  // 地区选择
  onRegionChange: function (e) {
    const regionValue = e.detail.value
    console.log('地区选择改变:', regionValue)
    this.setData({
      regionValue: regionValue
    })
  },

  // 保存用户信息
  saveUserInfo: function () {
    if (!this.data.userInfo) {
      wx.showToast({
        title: '用户信息不存在',
        icon: 'none'
      })
      return
    }

    const genderIndex = this.data.genderIndex
    const gender = genderIndex === 1 ? 1 : genderIndex === 2 ? 2 : 0
    
    const updateData = {
      nickName: this.data.editingNickName,
      gender: gender,
      province: this.data.regionValue[0],
      city: this.data.regionValue[1],
      country: this.data.regionValue[2],
      updateTime: new Date()
    }
    
    console.log('准备更新的数据:', updateData)
    console.log('性别索引:', genderIndex, '转换后的性别值:', gender)
    console.log('编辑的昵称:', this.data.editingNickName)
    
    wx.showLoading({ title: '保存中...' })
    
    db.collection('users').doc(this.data.userInfo._id).update({
      data: updateData
    }).then(res => {
      wx.hideLoading()
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 更新本地数据
      const updatedUserInfo = { ...this.data.userInfo, ...updateData }
      this.setData({
        userInfo: updatedUserInfo,
        isEditing: false
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('保存用户信息失败:', err)
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      })
    })
  },

  // 生成用户ID
  generateUserId: function (userId) {
    return wx.cloud.callFunction({
      name: 'generateUserId'
    }).then(res => {
      if (res.result && res.result.success) {
        const newUserId = res.result.userId
        console.log('为现有用户生成的ID:', newUserId)
        
        // 更新用户的userId
        return db.collection('users').doc(userId).update({
          data: {
            userId: newUserId,
            updateTime: new Date()
          }
        })
      } else {
        throw new Error('生成用户ID失败')
      }
    }).then(updateRes => {
      console.log('更新用户ID成功:', updateRes)
      
      // 重新加载用户信息
      return this.checkLoginStatus()
    }).catch(err => {
      console.error('生成用户ID失败:', err)
      wx.showToast({
        title: '用户ID生成失败',
        icon: 'none'
      })
      throw err
    })
  },

  // 为现有用户生成userId
  generateUserIdForExistingUser: function (userInfo) {
    const that = this
    wx.showLoading({ title: '生成用户ID...' })
    
    wx.cloud.callFunction({
      name: 'generateUserId'
    }).then(res => {
      if (!res.result.success) {
        throw new Error('生成用户ID失败')
      }
      
      const userId = res.result.userId
      console.log('为现有用户生成的ID:', userId)
      
      // 更新用户记录，添加userId
      return db.collection('users').doc(userInfo._id).update({
        data: {
          userId: userId,
          updateTime: new Date()
        }
      })
    }).then(updateRes => {
      wx.hideLoading()
      console.log('更新用户ID成功:', updateRes)
      
      // 重新加载用户信息
      that.checkLoginStatus()
    }).catch(err => {
      wx.hideLoading()
      console.error('生成用户ID失败:', err)
      wx.showToast({
        title: '生成用户ID失败',
        icon: 'none'
      })
    })
  },

  // 生成随机AI星球头像
  generateRandomAvatar: function () {
    // AI星球头像URL列表 - 使用DiceBear的identicon风格，生成星球样式的头像
    const planetAvatars = [
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet1&backgroundColor=4b6e58&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet2&backgroundColor=6b8e78&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet3&backgroundColor=8baa8a&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet4&backgroundColor=a5c69c&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet5&backgroundColor=bfe2ae&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet6&backgroundColor=d9fec0&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet7&backgroundColor=f3ffd2&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet8&backgroundColor=4b6e58&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet9&backgroundColor=6b8e78&radius=50',
      'https://api.dicebear.com/7.x/identicon/jpg?seed=planet10&backgroundColor=8baa8a&radius=50'
    ]
    
    // 随机选择一个头像
    const randomIndex = Math.floor(Math.random() * planetAvatars.length)
    return planetAvatars[randomIndex]
  },

  // 一键登录 - 只需要手机号
  oneClickLogin: function (e) {
    const that = this
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      wx.showLoading({ title: '登录中...' })
      
      // 解密手机号
      wx.cloud.callFunction({
        name: 'getPhoneNumber',
        data: {
          cloudID: e.detail.cloudID
        }
      }).then(res => {
        console.log('手机号解密结果:', res)
        
        if (res.result && res.result.phoneNumber) {
          const phoneNumber = res.result.phoneNumber
          console.log('获取到手机号:', phoneNumber)
          
          // 根据手机号查找用户
          return that.findUserByPhone(phoneNumber)
        } else {
          throw new Error('获取手机号失败')
        }
      }).then(userResult => {
        if (userResult.userExists) {
          // 用户已存在，更新openid
          console.log('用户已存在，更新openid')
          return that.updateExistingUser(userResult.user, userResult.phoneNumber)
        } else {
          // 用户不存在，创建新用户
          console.log('用户不存在，创建新用户')
          return that.createNewUserWithPhone(userResult.phoneNumber)
        }
      }).then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 重新检查登录状态
        that.checkLoginStatus()
      }).catch(err => {
        wx.hideLoading()
        console.error('登录失败:', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      })
    } else if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
      wx.showToast({
        title: '需要授权手机号才能登录',
        icon: 'none'
      })
    }
  },

  // 根据手机号查找用户
  findUserByPhone: function (phoneNumber) {
    return db.collection('users').where({
      phone: phoneNumber
    }).get().then(res => {
      console.log('根据手机号查找用户结果:', res)
      
      if (res.data && res.data.length > 0) {
        return {
          userExists: true,
          user: res.data[0],
          phoneNumber: phoneNumber
        }
      } else {
        return {
          userExists: false,
          phoneNumber: phoneNumber
        }
      }
    })
  },

  // 更新现有用户（添加新的openid）
  updateExistingUser: function (existingUser, phoneNumber) {
    const that = this
    
    // 获取当前openid
    return wx.cloud.callFunction({
      name: 'getOpenid'
    }).then(res => {
      const openid = res.result.openid
      
      const updateData = {
        openid: openid, // 更新openid
        updateTime: new Date()
      }
      
      console.log('更新现有用户数据:', updateData)
      
      return db.collection('users').doc(existingUser._id).update({
        data: updateData
      })
    })
  },

  // 创建新用户（只需要手机号）
  createNewUserWithPhone: function (phoneNumber) {
    const that = this
    
    // 生成用户ID
    return wx.cloud.callFunction({
      name: 'generateUserId'
    }).then(userIdRes => {
      if (!userIdRes.result.success) {
        throw new Error('生成用户ID失败')
      }
      
      const userId = userIdRes.result.userId
      
      // 获取openid
      return wx.cloud.callFunction({
        name: 'getOpenid'
      }).then(openidRes => {
        const openid = openidRes.result.openid
        
        // 生成随机AI星球头像
        const randomAvatar = that.generateRandomAvatar()
        
        // 生成昵称：辰光星球用户XXX
        const nickName = `辰光星球用户${userId}`
        
        const userData = {
          openid: openid,
          userId: userId,
          phone: phoneNumber, // 使用获取到的手机号
          nickName: nickName, // 自动生成的昵称
          avatarUrl: randomAvatar, // 随机AI星球头像
          gender: 0, // 默认性别未知
          country: '',
          province: '',
          city: '',
          createTime: new Date(),
          updateTime: new Date()
        }
        
        console.log('创建新用户数据:', userData)
        
        return db.collection('users').add({
          data: userData
        })
      })
    })
  },

  // 获取手机号（用于更新）
  getPhoneNumber: function (e) {
    const that = this
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      wx.showLoading({ title: '获取中...' })
      
      wx.cloud.callFunction({
        name: 'getPhoneNumber',
        data: {
          cloudID: e.detail.cloudID
        }
      }).then(res => {
        wx.hideLoading()
        console.log('手机号解密结果:', res)
        
        if (res.result && res.result.phoneNumber) {
          that.setData({
            phone: res.result.phoneNumber
          })
          that.updateUserInfo({ phone: res.result.phoneNumber })
          wx.showToast({
            title: '手机号获取成功',
            icon: 'success'
          })
        }
      }).catch(err => {
        wx.hideLoading()
        console.error('获取手机号失败:', err)
        wx.showToast({
          title: '获取手机号失败',
          icon: 'none'
        })
      })
    } else if (e.detail.errMsg === 'getPhoneNumber:fail user deny') {
      wx.showToast({
        title: '用户拒绝授权',
        icon: 'none'
      })
    }
  },

  // 更新用户信息
  updateUserInfo: function (updateData) {
    const that = this
    if (!this.data.userInfo || !this.data.userInfo._id) {
      console.error('用户信息不存在，尝试重新加载')
      that.checkLoginStatus()
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    updateData.updateTime = new Date()
    
    db.collection('users').doc(this.data.userInfo._id).update({
      data: updateData
    }).then(res => {
      wx.hideLoading()
      console.log('更新用户信息成功:', res)
      
      // 更新本地数据
      const newUserInfo = { ...that.data.userInfo, ...updateData }
      that.setData({
        userInfo: newUserInfo
      })
      
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
    }).catch(err => {
      wx.hideLoading()
      console.error('更新用户信息失败:', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    })
  },

  // 跳转到管理后台
  goToAdmin: function () {
    if (!this.data.isSuperAdmin) {
      wx.showToast({
        title: '权限不足',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/admin/admin'
    })
  },

  // 退出登录
  logout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地数据
          this.setData({
            userInfo: null,
            phone: '',
            isLoggedIn: false,
            isEditing: false,
            editingNickName: '',
            isSuperAdmin: false
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到订单页面
  goToOrders: function () {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    wx.switchTab({
      url: '/pages/orders/orders'
    })
  },

  // 跳转到设置页面
  goToSettings: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 联系客服
  contactService: function () {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 手动刷新用户信息
  refreshUserInfo: function () {
    console.log('手动刷新用户信息')
    this.setData({
      userInfo: null,
      isLoggedIn: false,
      isSuperAdmin: false
    })
    this.checkLoginStatus()
  }
})