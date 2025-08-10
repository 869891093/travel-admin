// hiking.js
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
    
    // 添加徒步关键词搜索
    const hikingKeywords = ['徒步', '登山', '爬山', '户外', '徒步旅行', '徒步路线', '徒步路线', '徒步攻略', '徒步装备', '徒步鞋', '徒步包', '徒步杖', '徒步帐篷', '徒步睡袋', '徒步炉具', '徒步水壶', '徒步服装', '徒步帽子', '徒步手套', '徒步袜子', '徒步眼镜', '徒步手表', '徒步相机', '徒步地图', '徒步指南', '徒步向导', '徒步领队', '徒步团队', '徒步俱乐部', '徒步协会', '徒步论坛', '徒步博客', '徒步视频', '徒步照片', '徒步游记', '徒步攻略', '徒步心得', '徒步经验', '徒步技巧', '徒步安全', '徒步急救', '徒步保险', '徒步许可证', '徒步营地', '徒步客栈', '徒步餐厅', '徒步商店', '徒步服务', '徒步咨询', '徒步预订', '徒步价格', '徒步费用', '徒步预算', '徒步时间', '徒步距离', '徒步难度', '徒步海拔', '徒步气候', '徒步季节', '徒步天气', '徒步地形', '徒步地貌', '徒步植被', '徒步动物', '徒步风景', '徒步景观', '徒步文化', '徒步历史', '徒步民俗', '徒步美食', '徒步特产', '徒步纪念品', '徒步交通', '徒步住宿', '徒步餐饮', '徒步娱乐', '徒步购物', '徒步医疗', '徒步银行', '徒步邮局', '徒步通讯', '徒步网络', '徒步电力', '徒步水源', '徒步垃圾', '徒步环保', '徒步文明', '徒步礼仪', '徒步规则', '徒步法律', '徒步政策', '徒步管理', '徒步监督', '徒步检查', '徒步处罚', '徒步奖励', '徒步荣誉', '徒步证书', '徒步徽章', '徒步奖牌', '徒步奖杯', '徒步奖状', '徒步奖牌', '徒步奖杯', '徒步奖状']
    
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
        console.log('加载徒步产品数据:', res.data.length, '条')
        
        // 在前端过滤产品状态和徒步相关
        const activeProducts = res.data.filter(product => {
          // 检查产品状态
          if (product.status && product.status !== 'active') {
            return false
          }
          
          // 检查是否包含徒步关键词
          const searchText = (product.title + ' ' + product.description + ' ' + 
                             (product.tags ? product.tags.join(' ') : '') + ' ' + 
                             (product.region || '')).toLowerCase()
          
          return hikingKeywords.some(keyword => 
            searchText.includes(keyword.toLowerCase())
          )
        })
        
        console.log('过滤后的徒步产品数量:', activeProducts.length)
        
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
        
        console.log('最终徒步产品数量:', newProducts.length)
      })
      .catch(err => {
        console.error('加载徒步产品失败', err)
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
    console.log('执行徒步搜索:', this.data.searchKeyword)
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