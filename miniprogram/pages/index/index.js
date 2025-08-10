// index.js
const db = wx.cloud.database()

Page({
  data: {
    banners: [],
    products: [],
    loading: false,
    hasMore: true,
    page: 0,
    pageSize: 10,
    searchKeyword: '',
    initLoading: false,
    clearLoading: false,
  },

  onLoad: function () {
    this.loadBanners()
    this.loadProducts()
  },

  onPullDownRefresh: function () {
    this.setData({
      products: [],
      page: 0,
      hasMore: true
    })
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore()
    }
  },

  // 加载轮播图数据
  loadBanners: function () {
    db.collection('banners').where({
      status: 'active'
    }).orderBy('sort', 'asc').get().then(res => {
      this.setData({
        banners: res.data
      })
    }).catch(err => {
      console.error('加载轮播图失败', err)
      // 设置空数组，避免页面报错
      this.setData({
        banners: []
      })
      wx.showToast({
        title: '轮播图加载失败',
        icon: 'none'
      })
    })
  },

  // 加载产品数据
  loadProducts: function () {
    if (this.data.loading) return Promise.resolve()
    
    this.setData({ loading: true })
    
    let query = db.collection('products')
    
    if (this.data.searchKeyword) {
      query = query.where({
        title: db.RegExp({
          regexp: this.data.searchKeyword,
          options: 'i'
        })
      })
    }
    
    return query.skip(this.data.page * this.data.pageSize)
      .limit(this.data.pageSize)
      .orderBy('createTime', 'desc')
      .get()
      .then(res => {
        // 在前端过滤产品状态
        const activeProducts = res.data.filter(product => {
          if (!product.status) {
            return true
          }
          return product.status === 'active'
        })
        
        // 去重逻辑：根据_id去重
        let newProducts
        if (this.data.page === 0) {
          newProducts = activeProducts
        } else {
          const existingIds = this.data.products.map(p => p._id)
          const uniqueNewProducts = activeProducts.filter(p => !existingIds.includes(p._id))
          newProducts = [...this.data.products, ...uniqueNewProducts]
        }
        
        this.setData({
          products: newProducts,
          hasMore: res.data.length === this.data.pageSize,
          loading: false
        })
      })
      .catch(err => {
        console.error('加载产品失败', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        })
      })
  },

  loadMore: function () {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadProducts()
    }
  },

  // 搜索输入
  onSearchInput: function (e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  // 搜索确认
  onSearchConfirm: function () {
    this.setData({
      products: [],
      page: 0,
      hasMore: true
    })
    this.loadProducts()
  },

  // 清除搜索
  clearSearch: function () {
    this.setData({
      searchKeyword: '',
      products: [],
      page: 0,
      hasMore: true
    })
    this.loadProducts()
  },

  // 轮播图点击事件
  onBannerTap: function (e) {
    const banner = e.currentTarget.dataset.banner;
    console.log('轮播图点击:', banner);

    // 优先使用产品ID跳转到产品详情
    if (banner.productId) {
      console.log('跳转到产品详情:', banner.productId);
      wx.navigateTo({
        url: `/pages/product/detail?id=${banner.productId}`
      });
      return;
    }

    // 如果有自定义链接，使用自定义链接
    if (banner.linkUrl) {
      console.log('使用自定义链接:', banner.linkUrl);
      // 如果是小程序内部页面路径
      if (banner.linkUrl.startsWith('/pages/')) {
        wx.navigateTo({
          url: banner.linkUrl
        });
      } else {
        // 如果是外部链接，可以复制到剪贴板或其他处理
        wx.setClipboardData({
          data: banner.linkUrl,
          success: function () {
            wx.showToast({
              title: '链接已复制',
              icon: 'success'
            });
          }
        });
      }
      return;
    }

    // 如果没有配置跳转，显示提示
    wx.showToast({
      title: '暂无跳转配置',
      icon: 'none'
    });
  },

  // 跳转到产品详情
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  // 导航点击事件
  onNavTap: function(e) {
    const nav = e.currentTarget.dataset.nav;
    
    // 根据导航跳转到对应页面
    let url = '';
    switch(nav) {
      case '北疆':
        url = '/pages/north-xinjiang/north-xinjiang';
        break;
      case '南疆':
        url = '/pages/south-xinjiang/south-xinjiang';
        break;
      case '徒步':
        url = '/pages/hiking/hiking';
        break;
      case '定制':
        url = '/pages/custom/custom';
        break;
      default:
        wx.showToast({
          title: '页面开发中',
          icon: 'none'
        });
        return;
    }
    
    wx.navigateTo({
      url: url
    });
  },
})
