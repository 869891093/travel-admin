// north-xinjiang.js
const db = wx.cloud.database()

Page({
  data: {
    products: [],
    loading: false,
    hasMore: true,
    page: 0,
    pageSize: 10,
    searchKeyword: '',
  },

  onLoad: function () {
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

  // 加载产品数据
  loadProducts: function () {
    if (this.data.loading) return Promise.resolve()
    
    this.setData({ loading: true })
    
    let query = db.collection('products')
    
    // 添加北疆关键词搜索
    const northXinjiangKeywords = ['北疆', '阿勒泰', '喀纳斯', '布尔津', '富蕴', '青河', '福海', '哈巴河', '吉木乃', '塔城', '额敏', '乌苏', '沙湾', '托里', '裕民', '和布克赛尔', '伊犁', '伊宁', '奎屯', '霍尔果斯', '新源', '巩留', '尼勒克', '昭苏', '特克斯', '察布查尔', '霍城']
    
    // 构建搜索条件
    const searchConditions = northXinjiangKeywords.map(keyword => ({
      title: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }))
    
    // 或者搜索描述和标签
    const descConditions = northXinjiangKeywords.map(keyword => ({
      description: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    }))
    
    // 如果有搜索关键词，添加搜索条件
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
        console.log('加载北疆产品数据:', res.data.length, '条')
        
        // 在前端过滤产品状态和北疆相关
        const activeProducts = res.data.filter(product => {
          // 检查产品状态
          if (product.status && product.status !== 'active') {
            return false
          }
          
          // 检查是否包含北疆关键词
          const searchText = (product.title + ' ' + product.description + ' ' + 
                             (product.tags ? product.tags.join(' ') : '') + ' ' + 
                             (product.region || '')).toLowerCase()
          
          return northXinjiangKeywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          )
        })
        
        console.log('过滤后的北疆产品数量:', activeProducts.length)
        
        // 去重逻辑
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
        
        console.log('最终北疆产品数量:', newProducts.length)
      })
      .catch(err => {
        console.error('加载北疆产品失败', err)
        this.setData({ loading: false })
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      })
  },

  // 加载更多
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
    console.log('执行北疆搜索:', this.data.searchKeyword)
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

  // 跳转到产品详情
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  }
}) 