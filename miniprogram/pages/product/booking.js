// booking.js
const db = wx.cloud.database()
const app = getApp()

Page({
  data: {
    product: {},
    travelDate: '',
    adultPrice: 0,
    childPrice: 0,
    adultCount: 1,
    childCount: 0,
    contactName: '',
    contactPhone: '',
    specialRequirements: '',
    submitting: false,
    bookingNotices: [
      '请确保出行日期前至少提前3天预订',
      '如需取消订单，请提前24小时联系客服',
      '请携带有效身份证件出行',
      '特殊要求请提前与客服沟通确认'
    ],
    idCard: '',
    orderId: ''
  },

  onLoad: function (options) {
    const productId = options.id
    const travelDate = options.date
    const priceType = options.priceType
    const adultPrice = parseFloat(options.adultPrice) || 0
    const childPrice = parseFloat(options.childPrice) || 0

    console.log('订单页面参数:', {
      productId,
      travelDate,
      priceType,
      adultPrice,
      childPrice,
      originalAdultPrice: options.adultPrice,
      originalChildPrice: options.childPrice
    })
    
    // 确保初始数据存在
    this.setData({
      product: {},
      travelDate: travelDate,
      priceType: priceType,
      adultPrice: adultPrice,
      childPrice: childPrice,
      bookingNotices: this.data.bookingNotices || []
    })
    
    if (productId) {
      this.loadProductDetail(productId)
    }
  },

  // 加载产品详情
  loadProductDetail: function (productId) {
    wx.showLoading({ title: '加载中...' })
    
    db.collection('products').doc(productId).get().then(res => {
      const product = res.data
      this.setData({
        product: product,
        // 如果URL参数中没有价格，使用产品默认价格
        adultPrice: this.data.adultPrice || product.adultPrice || 1000,
        childPrice: this.data.childPrice || product.childPrice || 800,
        // 确保bookingNotices始终是数组
        bookingNotices: this.data.bookingNotices || []
      })
      this.calculateCost()
      wx.hideLoading()
    }).catch(err => {
      console.error('加载产品详情失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    })
  },

  // 增加成人数量
  increaseAdult: function () {
    this.setData({
      adultCount: this.data.adultCount + 1
    })
    this.calculateCost()
  },

  // 减少成人数量
  decreaseAdult: function () {
    if (this.data.adultCount > 1) {
      this.setData({
        adultCount: this.data.adultCount - 1
      })
      this.calculateCost()
    }
  },

  // 增加儿童数量
  increaseChild: function () {
    this.setData({
      childCount: this.data.childCount + 1
    })
    this.calculateCost()
  },

  // 减少儿童数量
  decreaseChild: function () {
    if (this.data.childCount > 0) {
      this.setData({
        childCount: this.data.childCount - 1
      })
      this.calculateCost()
    }
  },

  // 计算费用
  calculateCost: function () {
    const adultCost = this.data.adultCount * this.data.adultPrice
    const childCost = this.data.childCount * this.data.childPrice

    // 修复浮点数精度问题，保留2位小数
    const totalCost = Math.round((adultCost + childCost) * 100) / 100

    this.setData({
      adultCost: Math.round(adultCost * 100) / 100,
      childCost: Math.round(childCost * 100) / 100,
      totalCost: totalCost
    })
  },

  // 联系人姓名输入
  onContactNameInput: function (e) {
    this.setData({
      contactName: e.detail.value
    })
  },

  // 联系人手机号输入
  onContactPhoneInput: function (e) {
    this.setData({
      contactPhone: e.detail.value
    })
  },

  // 特殊要求输入
  onSpecialRequirementsInput: function (e) {
    this.setData({
      specialRequirements: e.detail.value
    })
  },

  // 身份证号输入
  onIdCardInput: function (e) {
    this.setData({
      idCard: e.detail.value
    })
  },

  // 验证表单
  validateForm: function () {
    if (!this.data.contactName.trim()) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      })
      return false
    }
    
    if (!this.data.contactPhone.trim()) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return false
    }
    
    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(this.data.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return false
    }
    
    if (this.data.adultCount + this.data.childCount === 0) {
      wx.showToast({
        title: '请至少选择1人',
        icon: 'none'
      })
      return false
    }

    if (!this.data.idCard.trim()) {
      wx.showToast({
        title: '请输入身份证号',
        icon: 'none'
      })
      return false
    }

    if (!/^\d{17}[\dXx]$/.test(this.data.idCard.trim())) {
      wx.showToast({
        title: '身份证号格式不正确',
        icon: 'none'
      })
      return false
    }
    
    return true
  },

  // 提交订单并支付
  submitOrder: function () {
    if (!this.validateForm()) {
      return
    }
    
    this.setData({ submitting: true })
    
    // 生成订单号
    const orderNo = 'T' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase()
    
    // 获取用户openid
    app.getOpenid().then(openid => {
      const orderData = {
        orderNo: orderNo,
        productId: this.data.product._id,
        productTitle: this.data.product.title,
        productImage: this.data.product.coverImage,
        travelDate: this.data.travelDate,
        adultCount: this.data.adultCount,
        childCount: this.data.childCount,
        adultPrice: this.data.adultPrice,
        childPrice: this.data.childPrice,
        adultCost: this.data.adultCost,
        childCost: this.data.childCost,
        totalPrice: this.data.totalCost,
        contactName: this.data.contactName,
        contactPhone: this.data.contactPhone,
        specialRequirements: this.data.specialRequirements,
        idCard: this.data.idCard,
        status: 'pending',
        openid: openid,
        createTime: new Date(),
        updateTime: new Date()
      }
      
      return db.collection('orders').add({
        data: orderData
      })
    }).then(res => {
      // 保存订单ID
      this.setData({
        orderId: res._id
      })
      
      // 创建支付订单
      return this.createPayment(res._id)
    }).then(paymentResult => {
      this.setData({ submitting: false })
      console.log('支付云函数返回结果:', paymentResult)

      if (paymentResult && paymentResult.success) {
        // 调用微信支付
        this.requestPayment(paymentResult.payment)
      } else {
        console.error('支付创建失败:', paymentResult)
        const errorMsg = paymentResult ? paymentResult.message : '支付创建失败'
        wx.showModal({
          title: '支付创建失败',
          content: errorMsg,
          showCancel: false
        })
      }
    }).catch(err => {
      console.error('提交订单失败', err)
      this.setData({ submitting: false })
      wx.showModal({
        title: '提交失败',
        content: '网络错误，请重试',
        showCancel: false
      })
    })
  },

  // 创建支付订单
  createPayment: function (orderId) {
    return wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'createPayment',
        orderId: orderId
      }
    }).then(res => {
      return res.result
    })
  },

  // 调用微信支付
  requestPayment: function (paymentData) {
    wx.requestPayment({
      timeStamp: paymentData.timeStamp,
      nonceStr: paymentData.nonceStr,
      package: paymentData.package,
      signType: paymentData.signType,
      paySign: paymentData.paySign,
      success: (res) => {
        console.log('支付成功:', res)
        this.handlePaymentSuccess()
      },
      fail: (err) => {
        console.error('支付失败:', err)
        this.handlePaymentFail(err)
      }
    })
  },

  // 处理支付成功
  handlePaymentSuccess: function () {
    console.log('支付成功，开始更新订单状态')

    // 显示支付成功提示
    wx.showToast({
      title: '支付成功',
      icon: 'success'
    })

    // 更新订单状态为已支付
    this.updateOrderStatus('paid').then(() => {
      console.log('订单状态更新成功')
      // 跳转到订单详情页面
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?id=${this.data.orderId}`
        })
      }, 1500)
    }).catch(err => {
      console.error('更新订单状态失败:', err)
      // 即使更新失败也跳转，用户可以在订单页面手动刷新
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?id=${this.data.orderId}`
        })
      }, 1500)
    })
  },

  // 处理支付失败
  handlePaymentFail: function (err) {
    console.log('支付失败详情:', err)
    
    if (err.errMsg.includes('cancel')) {
      wx.showToast({
        title: '支付已取消',
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: '支付失败',
        icon: 'none'
      })
    }
    
    // 跳转到订单页面
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/orders/orders'
      })
    }, 1500)
  },

  // 更新订单状态
  updateOrderStatus: function (status) {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      db.collection('orders').doc(this.data.orderId).update({
        data: {
          status: status,
          paymentTime: new Date(),
          updateTime: new Date()
        }
      }).then(res => {
        console.log('订单状态更新成功:', res)
        resolve(res)
      }).catch(err => {
        console.error('订单状态更新失败:', err)
        reject(err)
      })
    })
  },

  // 查询支付状态
  queryPaymentStatus: function (orderId) {
    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'queryPayment',
        orderId: orderId
      }
    }).then(res => {
      if (res.result.success) {
        wx.showToast({
          title: '支付状态查询成功',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '查询失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('查询支付状态失败:', err)
      wx.showToast({
        title: '查询失败，请重试',
        icon: 'none'
      })
    })
  }
})