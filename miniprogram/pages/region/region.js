// region.js
const db = wx.cloud.database()

Page({
  data: {
    selectedRegion: '热门推荐', // 默认选中热门推荐
    regionProducts: [],
    regionList: [], // 从产品数据中提取的区域列表
    loading: false
  },

  onLoad: function () {
    this.loadRegions()
    this.loadRegionProducts()
  },

  // 加载所有区域列表
  loadRegions: function () {
    db.collection('products').where({
      status: 'active'
    }).field({
      region: true
    }).get().then(res => {
      // 提取所有不重复的区域
      const regions = [...new Set(res.data.map(item => item.region).filter(Boolean))]
      this.setData({
        regionList: regions
      })
      console.log('加载的区域列表:', regions)
    }).catch(err => {
      console.error('加载区域列表失败', err)
    })
  },

  // 选择区域
  selectRegion: function (e) {
    const region = e.currentTarget.dataset.region
    console.log('选择区域:', region)
    this.setData({
      selectedRegion: region
    })
    this.loadRegionProducts()
  },

  // 加载区域产品
  loadRegionProducts: function () {
    this.setData({ loading: true })
    console.log('开始加载产品，当前区域:', this.data.selectedRegion)
    
    if (this.data.selectedRegion === '热门推荐') {
      // 加载热门推荐产品
      this.loadHotProducts()
    } else {
      // 加载指定区域的产品
      this.loadRegionSpecificProducts()
    }
  },

  // 加载热门推荐产品
  loadHotProducts: function () {
    console.log('加载热门推荐产品...')
    
    // 查询所有产品，然后在前端过滤
    db.collection('products').where({
      status: 'active'
    }).get().then(res => {
      console.log('所有产品数据:', res.data)
      
      // 过滤出热门推荐产品（处理字段可能不存在的情况）
      const hotProducts = res.data.filter(product => {
        return product.isHot === true || product.isHot === 'true'
      })
      
      console.log('过滤后的热门产品:', hotProducts)
      
      // 按hotSort排序
      hotProducts.sort((a, b) => {
        const sortA = a.hotSort || 0
        const sortB = b.hotSort || 0
        return sortA - sortB
      })
      
      const products = this.processProducts(hotProducts)
      this.setData({
        regionProducts: products,
        loading: false
      })
      console.log('设置的热门产品:', products)
    }).catch(err => {
      console.error('加载热门产品失败', err)
      this.setData({ loading: false })
    })
  },

  // 加载指定区域的产品
  loadRegionSpecificProducts: function () {
    console.log('加载区域产品:', this.data.selectedRegion)
    
    db.collection('products').where({
      status: 'active',
      region: this.data.selectedRegion
    }).orderBy('createTime', 'desc').get().then(res => {
      console.log('区域产品数据:', res.data)
      const products = this.processProducts(res.data)
      this.setData({
        regionProducts: products,
        loading: false
      })
    }).catch(err => {
      console.error('加载区域产品失败', err)
      this.setData({ loading: false })
    })
  },

  // 处理产品数据
  processProducts: function (products) {
    return products.map(product => ({
      ...product,
      duration: Math.floor(Math.random() * 20) + 1,
      days: Math.floor(Math.random() * 10) + 1,
      registeredCount: Math.floor(Math.random() * 50),
      satisfaction: Math.floor(Math.random() * 20) + 80
    }))
  },

  // 搜索输入
  onSearchInput: function (e) {
    // 实现搜索功能
    console.log('搜索:', e.detail.value)
  },

  // 跳转到产品详情
  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  }
}) 