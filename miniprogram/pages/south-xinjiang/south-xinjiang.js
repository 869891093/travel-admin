// south-xinjiang.js
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
    
    // 添加南疆关键词搜索
    const southXinjiangKeywords = ['南疆', '喀什', '和田', '阿克苏', '克孜勒苏', '巴音郭楞', '库尔勒', '轮台', '尉犁', '若羌', '且末', '焉耆', '和静', '和硕', '博湖', '塔里木', '塔克拉玛干', '帕米尔', '昆仑山', '慕士塔格', '公格尔', '乔戈里', '叶城', '莎车', '泽普', '麦盖提', '岳普湖', '伽师', '疏勒', '疏附', '英吉沙', '阿克陶', '阿图什', '乌恰', '阿合奇', '柯坪', '乌什', '温宿', '拜城', '新和', '沙雅', '库车', '阿瓦提', '策勒', '于田', '民丰', '皮山', '墨玉', '洛浦', '和田市', '和田县']
    
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
        console.log('加载南疆产品数据:', res.data.length, '条')
        
        // 在前端过滤产品状态和南疆相关
        const activeProducts = res.data.filter(product => {
          // 检查产品状态
          if (product.status && product.status !== 'active') {
            return false
          }
          
          // 检查是否包含南疆关键词
          const searchText = (product.title + ' ' + product.description + ' ' + 
                             (product.tags ? product.tags.join(' ') : '') + ' ' + 
                             (product.region || '')).toLowerCase()
          
          return southXinjiangKeywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          )
        })
        
        console.log('过滤后的南疆产品数量:', activeProducts.length)
        
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
        
        console.log('最终南疆产品数量:', newProducts.length)
      })
      .catch(err => {
        console.error('加载南疆产品失败', err)
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
    console.log('执行南疆搜索:', this.data.searchKeyword)
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