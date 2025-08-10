// orders.js
const db = wx.cloud.database()
const app = getApp()

Page({
  data: {
    orders: [],
    currentStatus: 'all',
    loading: false,
    hasMore: true,
    page: 0,
    pageSize: 10
  },

  onLoad: function () {
    this.loadOrders()
  },

  onShow: function () {
    // 每次显示页面时刷新订单列表
    this.refreshOrders()
  },

  // 切换订单状态
  switchStatus: function (e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentStatus: status,
      orders: [],
      page: 0,
      hasMore: true
    })
    this.loadOrders()
  },

  // 加载订单
  loadOrders: function () {
    if (this.data.loading || !this.data.hasMore) {
      return
    }

    this.setData({ loading: true })

    app.getOpenid().then(openid => {
      let query = db.collection('orders').where({
        openid: openid,
        isDeleted: db.command.neq(true) // 排除已删除的订单
      })

      // 根据状态筛选
      if (this.data.currentStatus !== 'all') {
        query = query.where({
          status: this.data.currentStatus
        })
      }

      return query.orderBy('createTime', 'desc')
        .skip(this.data.page * this.data.pageSize)
        .limit(this.data.pageSize)
        .get()
    }).then(res => {
      const newOrders = res.data.map(order => {
        // 调试：打印订单状态
        console.log(`订单 ${order.orderNo} 状态: ${order.status}`);

        return {
          ...order,
          statusText: this.getStatusText(order.status),
          // 修复价格显示精度问题
          totalPrice: this.formatPrice(order.totalPrice)
        };
      })

      // 如果没有订单数据，显示提示
      if (newOrders.length === 0 && this.data.page === 0) {
        wx.showToast({
          title: '暂无订单',
          icon: 'none',
          duration: 2000
        })
      }

      this.setData({
        orders: [...this.data.orders, ...newOrders],
        page: this.data.page + 1,
        hasMore: newOrders.length === this.data.pageSize,
        loading: false
      })
    }).catch(err => {
      console.error('加载订单失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    })
  },

  // 刷新订单
  refreshOrders: function () {
    this.setData({
      orders: [],
      page: 0,
      hasMore: true
    })
    this.loadOrders()
  },

  // 加载更多
  loadMore: function () {
    this.loadOrders()
  },

  // 获取状态文本
  getStatusText: function (status) {
    const statusMap = {
      'pending': '待付款',
      'paying': '支付中',
      'paid': '已付款',
      'confirmed': '已确认',
      'completed': '已完成',
      'cancelled': '已取消',
      'refund_pending': '退款申请中',
      'refunded': '已退款'
    }
    return statusMap[status] || status
  },

  // 格式化价格，修复浮点数精度问题
  formatPrice: function (price) {
    if (typeof price !== 'number') {
      price = parseFloat(price) || 0;
    }
    return Math.round(price * 100) / 100;
  },

  // 支付订单
  payOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showLoading({ title: '创建支付...' })
    
    // 创建支付订单
    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'createPayment',
        orderId: orderId
      }
    }).then(res => {
      wx.hideLoading()
      console.log('支付云函数返回结果:', res)

      if (res.result && res.result.success) {
        // 调用微信支付
        this.requestPayment(res.result.payment, orderId)
      } else {
        console.error('支付创建失败:', res.result)
        const errorMsg = res.result ? res.result.message : '支付创建失败'
        wx.showModal({
          title: '支付创建失败',
          content: errorMsg,
          showCancel: false
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('创建支付失败:', err)
      wx.showModal({
        title: '支付创建失败',
        content: '网络错误，请重试',
        showCancel: false
      })
    })
  },

  // 调用微信支付
  requestPayment: function (paymentData, orderId) {
    wx.requestPayment({
      timeStamp: paymentData.timeStamp,
      nonceStr: paymentData.nonceStr,
      package: paymentData.package,
      signType: paymentData.signType,
      paySign: paymentData.paySign,
      success: (res) => {
        console.log('支付成功:', res)
        this.handlePaymentSuccess(orderId)
      },
      fail: (err) => {
        console.error('支付失败:', err)
        this.handlePaymentFail(err)
      }
    })
  },

  // 支付成功处理
  handlePaymentSuccess: function (orderId) {
    console.log('支付成功，开始更新订单状态:', orderId)

    wx.showToast({
      title: '支付成功',
      icon: 'success'
    })

    // 更新订单状态
    this.updateOrderStatus(orderId, 'paid').then(() => {
      console.log('订单状态更新成功')
      // 刷新订单列表
      setTimeout(() => {
        this.refreshOrders()
      }, 1500)
    }).catch(err => {
      console.error('更新订单状态失败:', err)
      // 即使更新失败也刷新列表
      setTimeout(() => {
        this.refreshOrders()
      }, 1500)
    })
  },

  // 退款订单
  refundOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认退款',
      content: '确定要申请退款吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '申请退款中...' })
          
          wx.cloud.callFunction({
            name: 'payment',
            data: {
              action: 'refund',
              orderId: orderId
            }
          }).then(res => {
            wx.hideLoading()
            
            if (res.result.success) {
              wx.showToast({
                title: '退款申请成功',
                icon: 'success'
              })
              this.refreshOrders()
            } else {
              wx.showToast({
                title: res.result.message || '退款申请失败',
                icon: 'none'
              })
            }
          }).catch(err => {
            wx.hideLoading()
            console.error('退款失败:', err)
            wx.showToast({
              title: '退款申请失败，请重试',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 处理支付失败
  handlePaymentFail: function (err) {
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
  },

  // 更新订单状态
  updateOrderStatus: function (orderId, status) {
    return new Promise((resolve, reject) => {
      const db = wx.cloud.database()
      db.collection('orders').doc(orderId).update({
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

  // 申请退款
  requestRefund: function (e) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '申请退款',
      content: '确定要申请退款吗？退款将在1-3个工作日内处理。',
      success: (res) => {
        if (res.confirm) {
          this.processRefund(orderId)
        }
      }
    })
  },

  // 处理退款
  processRefund: function (orderId) {
    wx.showLoading({ title: '申请退款中...' })

    console.log('开始申请退款，订单ID:', orderId)

    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'refundPayment',
        orderId: orderId,
        paymentData: {
          amount: 0, // 全额退款
          reason: '用户申请退款'
        }
      }
    }).then(res => {
      wx.hideLoading()
      console.log('退款云函数完整返回结果:', res)
      console.log('退款结果详情:', res.result)

      if (res.result && res.result.success) {
        wx.showModal({
          title: '退款申请成功',
          content: '退款申请已提交，预计1-3个工作日内到账',
          showCancel: false,
          confirmText: '确定',
          success: () => {
            // 刷新订单列表
            this.refreshOrders()
          }
        })
      } else {
        const errorMsg = res.result ? res.result.message : '退款申请失败'
        console.error('退款失败原因:', errorMsg)
        wx.showModal({
          title: '退款申请失败',
          content: errorMsg,
          showCancel: false,
          confirmText: '确定'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('退款云函数调用失败:', err)
      wx.showModal({
        title: '退款申请失败',
        content: '网络错误，请检查网络连接后重试',
        showCancel: false,
        confirmText: '确定'
      })
    })
  },

  // 取消订单
  cancelOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '取消订单',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.processCancelOrder(orderId)
        }
      }
    })
  },

  // 处理取消订单
  processCancelOrder: function (orderId) {
    wx.showLoading({ title: '取消订单...' })
    
    db.collection('orders').doc(orderId).update({
      data: {
        status: 'cancelled',
        updateTime: new Date()
      }
    }).then(() => {
      wx.hideLoading()
      wx.showToast({
        title: '订单已取消',
        icon: 'success'
      })
      
      // 刷新订单列表
      setTimeout(() => {
        this.refreshOrders()
      }, 1500)
    }).catch(err => {
      wx.hideLoading()
      console.error('取消订单失败:', err)
      wx.showToast({
        title: '取消失败',
        icon: 'none'
      })
    })
  },

  // 查看订单详情
  goToOrderDetail: function (e) {
    const orderId = e.currentTarget.dataset.id
    console.log('点击订单内容查看详情，订单ID:', orderId);

    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    }).then(res => {
      console.log('订单详情页面跳转成功');
    }).catch(err => {
      console.error('订单详情页面跳转失败:', err)
      wx.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    })
  },

  // 查看详情（与WXML中的调用保持一致）
  viewDetails: function (e) {
    const orderId = e.currentTarget.dataset.id
    console.log('查看订单详情，订单ID:', orderId);

    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    }).then(res => {
      console.log('页面跳转成功');
    }).catch(err => {
      console.error('页面跳转失败:', err)
      wx.showToast({
        title: '页面跳转失败',
        icon: 'none'
      })
    })
  },

  // 写评价
  writeReview: function (e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/review/review?orderId=${orderId}`
    })
  },

  // 删除订单
  deleteOrder: function (e) {
    const orderId = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个订单吗？删除后无法恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          wx.cloud.callFunction({
            name: 'deleteOrder',
            data: {
              orderId: orderId
            }
          }).then(res => {
            wx.hideLoading()
            
            if (res.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              this.refreshOrders()
            } else {
              wx.showToast({
                title: res.result.message || '删除失败',
                icon: 'none'
              })
            }
          }).catch(err => {
            wx.hideLoading()
            console.error('删除订单失败:', err)
            wx.showToast({
              title: '删除失败，请重试',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 测试订单详情功能
  testOrderDetail: function () {
    if (this.data.orders.length > 0) {
      const firstOrder = this.data.orders[0]
      
      wx.navigateTo({
        url: `/pages/order-detail/order-detail?id=${firstOrder._id}`
      }).then(res => {
        // 测试页面跳转成功
      }).catch(err => {
        console.error('测试页面跳转失败:', err)
        wx.showToast({
          title: '测试失败',
          icon: 'none'
        })
      })
    } else {
      wx.showToast({
        title: '没有订单数据，无法测试',
        icon: 'none'
      })
    }
  },

  // 初始化数据库
  initDatabase: function () {
    wx.showLoading({ title: '初始化中...' })
    
    wx.cloud.callFunction({
      name: 'initDatabase'
    }).then(res => {
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showToast({
          title: '初始化成功',
          icon: 'success'
        })
        this.refreshOrders()
      } else {
        wx.showToast({
          title: res.result.message || '初始化失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('初始化失败:', err)
      wx.showToast({
        title: '初始化失败，请重试',
        icon: 'none'
      })
    })
  },

  // 测试查询所有订单
  testGetAllOrders: function () {
    wx.showLoading({ title: '查询中...' })
    
    wx.cloud.callFunction({
      name: 'getAllOrders'
    }).then(res => {
      wx.hideLoading()
      
      if (res.result.success) {
        wx.showToast({
          title: `查询成功，共${res.result.orders.length}条订单`,
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: res.result.message || '查询失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('查询失败:', err)
      wx.showToast({
        title: '查询失败，请重试',
        icon: 'none'
      })
    })
  }
})