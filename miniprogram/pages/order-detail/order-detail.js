// order-detail.js
const db = wx.cloud.database()
const app = getApp()

Page({
  data: {
    order: null,
    loading: true
  },

  onLoad: function (options) {
    const orderId = options.id
    if (orderId) {
      this.loadOrderDetail(orderId)
    } else {
      console.error('没有提供订单ID')
      wx.showToast({
        title: '订单ID无效',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载订单详情
  loadOrderDetail: function (orderId) {
    this.setData({ loading: true })
    
    // 直接使用云函数查询，避免权限问题
    wx.cloud.callFunction({
      name: 'getOrderDetail',
      data: { orderId: orderId }
    }).then(res => {
      if (res.result.success && res.result.order) {
        const order = res.result.order
        
        order.statusText = this.getStatusText(order.status)
        order.createTime = this.formatTime(order.createTime)
        order.paymentTime = order.paymentTime ? this.formatTime(order.paymentTime) : null
        order.updateTime = order.updateTime ? this.formatTime(order.updateTime) : null

        // 修复价格显示精度问题
        order.totalPrice = this.formatPrice(order.totalPrice)
        order.adultPrice = this.formatPrice(order.adultPrice)
        order.childPrice = this.formatPrice(order.childPrice)
        
        this.setData({
          order: order,
          loading: false
        })
      } else {
        console.error('云函数返回错误:', res.result)
        this.setData({ loading: false })
        wx.showToast({
          title: res.result.message || '订单不存在',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }).catch(err => {
      console.error('云函数调用失败:', err)
      this.setData({ loading: false })
      wx.showToast({
        title: '加载订单详情失败',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    })
  },

  // 格式化时间
  formatTime: function (time) {
    if (!time) return ''
    
    let date
    if (time instanceof Date) {
      date = time
    } else if (typeof time === 'string') {
      date = new Date(time)
    } else {
      return time.toString()
    }
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
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

  // 复制订单号
  copyOrderNo: function () {
    if (this.data.order) {
      wx.setClipboardData({
        data: this.data.order.orderNo,
        success: () => {
          wx.showToast({
            title: '订单号已复制',
            icon: 'success'
          })
        }
      })
    }
  },

  // 申请退款
  requestRefund: function () {
    const order = this.data.order
    if (!order) return

    wx.showModal({
      title: '申请退款',
      content: `确定要申请退款吗？\n订单金额：¥${order.totalPrice}\n退款将在1-3个工作日内处理。`,
      confirmText: '确定退款',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.processRefund(order._id)
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
            // 刷新订单详情
            this.loadOrderDetail(this.data.order._id)
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

  // 返回上一页
  goBack: function () {
    wx.navigateBack()
  }
}) 