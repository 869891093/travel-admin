// custom.js
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
    
    // 添加定制关键词搜索
    const customKeywords = ['定制', '私人定制', '专属定制', '个性化', '量身定制', '定制旅行', '定制旅游', '定制服务', '定制方案', '定制路线', '定制行程', '定制攻略', '定制向导', '定制领队', '定制团队', '定制俱乐部', '定制协会', '定制论坛', '定制博客', '定制视频', '定制照片', '定制游记', '定制攻略', '定制心得', '定制经验', '定制技巧', '定制安全', '定制急救', '定制保险', '定制许可证', '定制营地', '定制客栈', '定制餐厅', '定制商店', '定制服务', '定制咨询', '定制预订', '定制价格', '定制费用', '定制预算', '定制时间', '定制距离', '定制难度', '定制海拔', '定制气候', '定制季节', '定制天气', '定制地形', '定制地貌', '定制植被', '定制动物', '定制风景', '定制景观', '定制文化', '定制历史', '定制民俗', '定制美食', '定制特产', '定制纪念品', '定制交通', '定制住宿', '定制餐饮', '定制娱乐', '定制购物', '定制医疗', '定制银行', '定制邮局', '定制通讯', '定制网络', '定制电力', '定制水源', '定制垃圾', '定制环保', '定制文明', '定制礼仪', '定制规则', '定制法律', '定制政策', '定制管理', '定制监督', '定制检查', '定制处罚', '定制奖励', '定制荣誉', '定制证书', '定制徽章', '定制奖牌', '定制奖杯', '定制奖状']
    
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
        console.log('加载定制产品数据:', res.data.length, '条')
        
        // 在前端过滤产品状态和定制相关
        const activeProducts = res.data.filter(product => {
          // 检查产品状态
          if (product.status && product.status !== 'active') {
            return false
          }
          
          // 检查是否包含定制关键词
          const searchText = (product.title + ' ' + product.description + ' ' + 
                             (product.tags ? product.tags.join(' ') : '') + ' ' + 
                             (product.region || '')).toLowerCase()
          
          return customKeywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          )
        })
        
        console.log('过滤后的定制产品数量:', activeProducts.length)
        
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
        
        console.log('最终定制产品数量:', newProducts.length)
      })
      .catch(err => {
        console.error('加载定制产品失败', err)
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
    console.log('执行定制搜索:', this.data.searchKeyword)
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