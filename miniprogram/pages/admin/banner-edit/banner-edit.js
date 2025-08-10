// banner-edit.js
Page({
  data: {
    id: '',
    isEdit: false,
    banner: {
      title: '',
      desc: '',
      imageUrl: '',
      productId: '',
      linkUrl: '',
      sort: 1,
      status: 'active'
    },
    statusOptions: [
      { value: 'active', label: '启用' },
      { value: 'inactive', label: '禁用' }
    ],
    statusIndex: 0  // 添加状态索引
  },

  onLoad: function (options) {
    console.log('页面加载，参数:', options)
    
    if (options.id) {
      this.setData({
        isEdit: true,
        id: options.id
      })
      this.loadBanner(options.id)
    } else {
      this.setData({
        isEdit: false
      })
      this.setDefaultSort()
    }
  },

  // 加载轮播图数据
  loadBanner: function (id) {
    wx.showLoading({ title: '加载中...' })
    
    wx.cloud.callFunction({
      name: 'bannerManage',
      data: {
        action: 'getBanner',
        bannerId: id
      }
    }).then(res => {
      wx.hideLoading()
      console.log('加载轮播图结果:', res)
      
      if (res.result && res.result.success) {
        const banner = res.result.data
        // 设置状态索引
        const statusIndex = this.data.statusOptions.findIndex(item => item.value === banner.status)
        
        this.setData({
          banner: banner,
          statusIndex: statusIndex >= 0 ? statusIndex : 0
        })
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('加载轮播图失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 设置默认排序
  setDefaultSort: function () {
    wx.cloud.callFunction({
      name: 'bannerManage',
      data: {
        action: 'getMaxSort'
      }
    }).then(res => {
      if (res.result && res.result.success) {
        const maxSort = res.result.maxSort || 0
        this.setData({
          'banner.sort': maxSort + 1
        })
      }
    }).catch(err => {
      console.error('获取最大排序失败:', err)
    })
  },

  // 输入处理
  onInput: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    console.log('输入:', field, value)
    this.setData({
      [`banner.${field}`]: value
    })
  },

  // 状态选择
  onStatusChange: function (e) {
    const index = parseInt(e.detail.value)
    const status = this.data.statusOptions[index].value
    console.log('状态改变:', status, index)
    this.setData({
      'banner.status': status,
      statusIndex: index
    })
  },

  // 选择并上传轮播图
  chooseBannerImage: function() {
    const that = this;
    wx.chooseImage({
      count: 1, // 只选择一张图片
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        wx.showLoading({ title: '上传中...' });

        const filePath = res.tempFilePaths[0];
        const cloudPath = 'banner/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + filePath.match(/\.[^.]+?$/)[0];

        wx.cloud.uploadFile({
          cloudPath,
          filePath
        }).then(result => {
          wx.hideLoading();

          // 更新轮播图URL
          that.setData({
            'banner.imageUrl': result.fileID
          });

          wx.showToast({
            title: '上传成功',
            icon: 'success'
          });
        }).catch(err => {
          wx.hideLoading();
          console.error('上传失败:', err);
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          });
        });
      },
      fail(err) {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取状态文本
  getStatusText: function (status) {
    const option = this.data.statusOptions.find(item => item.value === status)
    return option ? option.label : '启用'
  },

  // 返回上一页
  goBack: function () {
    console.log('返回按钮被点击')
    wx.navigateBack({
      success: function() {
        console.log('返回成功')
      },
      fail: function(err) {
        console.error('返回失败:', err)
        // 如果返回失败，尝试跳转到管理页面
        wx.navigateTo({
          url: '/pages/admin/admin'
        })
      }
    })
  },

  // 保存轮播图
  saveBanner: function () {
    const { banner, isEdit, id } = this.data
    
    console.log('保存轮播图:', { banner, isEdit, id })
    
    // 验证必填字段
    if (!banner.title.trim()) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }
    
    if (!banner.imageUrl.trim()) {
      wx.showToast({
        title: '请输入图片URL',
        icon: 'none'
      })
      return
    }

    // 验证排序数字
    if (isNaN(banner.sort) || banner.sort < 1) {
      wx.showToast({
        title: '请输入有效的排序数字',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })
    
    // 修复：使用正确的action名称
    const action = isEdit ? 'update' : 'add'

    // 过滤掉_id字段，避免更新时出错
    const { _id, ...bannerDataWithoutId } = banner

    const data = {
      action: action,
      bannerData: bannerDataWithoutId
    }

    if (isEdit) {
      data.bannerId = id
    }
    
    console.log('发送到云函数的数据:', data)
    
    wx.cloud.callFunction({
      name: 'bannerManage',
      data: data
    }).then(res => {
      wx.hideLoading()
      console.log('保存轮播图结果:', res)
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      } else {
        wx.showToast({
          title: res.result.message || '保存失败',
          icon: 'none'
        })
        console.error('保存失败详情:', res.result)
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('保存轮播图失败:', err)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    })
  }
}) 