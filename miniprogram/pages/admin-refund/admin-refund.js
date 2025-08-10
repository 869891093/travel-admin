// miniprogram/pages/admin-refund/admin-refund.js
Page({
  data: {
    refundList: [],
    loading: false,
    statusFilter: 'all', // all, pending, approved, rejected, completed
    statusOptions: [
      { value: 'all', label: '全部' },
      { value: 'pending', label: '待审核' },
      { value: 'approved', label: '已通过' },
      { value: 'rejected', label: '已拒绝' },
      { value: 'completed', label: '已完成' }
    ]
  },

  onLoad: function (options) {
    this.loadRefundList()
  },

  onShow: function () {
    this.loadRefundList()
  },

  // 加载退款列表
  loadRefundList: function () {
    this.setData({ loading: true })

    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'getRefundList',
        status: this.data.statusFilter
      }
    }).then(res => {
      console.log('退款列表:', res)
      if (res.result.success) {
        this.setData({
          refundList: res.result.data,
          loading: false
        })
      } else {
        wx.showToast({
          title: res.result.message || '加载失败',
          icon: 'none'
        })
        this.setData({ loading: false })
      }
    }).catch(err => {
      console.error('加载退款列表失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  },

  // 状态筛选
  onStatusChange: function (e) {
    this.setData({
      statusFilter: e.detail.value
    })
    this.loadRefundList()
  },

  // 审核退款
  reviewRefund: function (e) {
    const refundId = e.currentTarget.dataset.id
    const refund = this.data.refundList.find(item => item._id === refundId)
    
    if (!refund) return

    wx.showModal({
      title: '退款审核',
      content: `订单金额：¥${refund.amount}\n退款原因：${refund.reason}\n\n请选择审核结果：`,
      confirmText: '通过',
      cancelText: '拒绝',
      success: (res) => {
        if (res.confirm) {
          this.approveRefund(refundId)
        } else if (res.cancel) {
          this.rejectRefund(refundId)
        }
      }
    })
  },

  // 通过退款
  approveRefund: function (refundId) {
    wx.showLoading({ title: '处理中...' })

    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'reviewRefund',
        refundId: refundId,
        reviewData: {
          approved: true,
          reviewerId: 'admin', // 实际应用中应该是当前管理员ID
          note: '审核通过'
        }
      }
    }).then(res => {
      wx.hideLoading()
      console.log('审核结果:', res)
      
      if (res.result.success) {
        wx.showToast({
          title: '审核通过，退款处理中',
          icon: 'success'
        })
        this.loadRefundList()
      } else {
        wx.showToast({
          title: res.result.message || '审核失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('审核失败:', err)
      wx.showToast({
        title: '审核失败',
        icon: 'none'
      })
    })
  },

  // 拒绝退款
  rejectRefund: function (refundId) {
    wx.showModal({
      title: '拒绝退款',
      content: '请输入拒绝原因：',
      editable: true,
      placeholderText: '请输入拒绝原因',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })

          wx.cloud.callFunction({
            name: 'payment',
            data: {
              action: 'reviewRefund',
              refundId: refundId,
              reviewData: {
                approved: false,
                reviewerId: 'admin',
                note: res.content || '管理员拒绝'
              }
            }
          }).then(result => {
            wx.hideLoading()
            
            if (result.result.success) {
              wx.showToast({
                title: '已拒绝退款',
                icon: 'success'
              })
              this.loadRefundList()
            } else {
              wx.showToast({
                title: result.result.message || '操作失败',
                icon: 'none'
              })
            }
          }).catch(err => {
            wx.hideLoading()
            console.error('拒绝退款失败:', err)
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 查看详情
  viewDetail: function (e) {
    const refundId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/refund-detail/refund-detail?id=${refundId}`
    })
  },

  // 刷新
  onRefresh: function () {
    this.loadRefundList()
  }
})
