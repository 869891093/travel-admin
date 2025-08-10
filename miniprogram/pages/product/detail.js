// detail.js
const db = wx.cloud.database()

Page({
  data: {
    product: {},
    priceType: 'adult', // adult 或 child
    currentMonth: null,
    currentMonthText: '',
    selectedDate: null,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: []
  },

  onLoad: function (options) {
    // 初始化当前月份
    this.setData({
      currentMonth: new Date()
    })
    
    const productId = options.id
    if (productId) {
      this.loadProductDetail(productId)
    } else {
      // 如果没有产品ID，也生成一个默认日历
      this.generateCalendar()
    }
  },

  // 加载产品详情
  loadProductDetail: function (productId) {
    wx.showLoading({ title: '加载中...' })
    
    db.collection('products').doc(productId).get().then(res => {
      // 确保detailImages字段存在
      const product = res.data
      if (!product.detailImages) {
        product.detailImages = []
      }
      
      this.setData({
        product: product
      })
      
      // 加载产品后立即生成日历
      this.generateCalendar()
      wx.hideLoading()
    }).catch(err => {
      console.error('加载产品详情失败', err)
      wx.hideLoading()
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      })
    })
  },

  // 切换价格类型
  switchPriceType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      priceType: type
    })
    this.generateCalendar()
  },

  // 生成日历
  generateCalendar: function () {
    const currentMonth = this.data.currentMonth
    
    // 确保 currentMonth 是有效的 Date 对象
    if (!currentMonth || !(currentMonth instanceof Date)) {
      console.error('currentMonth 不是有效的 Date 对象:', currentMonth)
      this.setData({
        currentMonth: new Date()
      })
      return
    }
    
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // 设置月份文本
    const monthText = `${year}年${month + 1}月`
    this.setData({
      currentMonthText: monthText
    })
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // 获取上个月的最后几天
    const firstDayWeek = firstDay.getDay()
    const prevMonthLastDay = new Date(year, month, 0)
    const prevMonthDays = []
    
    for (let i = firstDayWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay.getDate() - i
      const date = new Date(year, month - 1, day)
      prevMonthDays.push({
        date: this.formatDate(date),
        day: day,
        isCurrentMonth: false,
        isSelected: false,
        isAvailable: false,
        price: 0
      })
    }
    
    // 获取当月的天数
    const currentMonthDays = []
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const isAvailable = this.checkDateAvailability(date)
      const price = this.getDatePrice(date)
      
      currentMonthDays.push({
        date: this.formatDate(date),
        day: day,
        isCurrentMonth: true,
        isSelected: this.data.selectedDate === this.formatDate(date),
        isAvailable: isAvailable,
        price: price
      })
    }
    
    // 获取下个月的前几天
    const lastDayWeek = lastDay.getDay()
    const nextMonthDays = []
    
    for (let day = 1; day <= 6 - lastDayWeek; day++) {
      const date = new Date(year, month + 1, day)
      nextMonthDays.push({
        date: this.formatDate(date),
        day: day,
        isCurrentMonth: false,
        isSelected: false,
        isAvailable: false,
        price: 0
      })
    }
    
    // 合并所有天数
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
    
    this.setData({
      calendarDays: allDays
    })
  },

  // 检查日期是否可用
  checkDateAvailability: function (date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 今天之前的日期不可用
    if (date < today) {
      return false
    }
    
    // 检查价格日历中的可用性
    const dateStr = this.formatDate(date)
    const priceData = this.data.product.priceCalendar && this.data.product.priceCalendar[dateStr]
    
    if (priceData) {
      return priceData.available
    }
    
    // 如果没有价格日历数据，默认可用
    return true
  },

  // 获取日期价格
  getDatePrice: function (date) {
    const dateStr = this.formatDate(date)
    
    const priceData = this.data.product.priceCalendar && this.data.product.priceCalendar[dateStr]
    
    if (priceData && priceData.available) {
      const price = this.data.priceType === 'adult' ? priceData.adultPrice : priceData.childPrice
      return price
    }
    
    // 如果没有价格日历数据，使用默认价格
    const basePrice = this.data.priceType === 'adult' ? 
      (this.data.product.adultPrice || 1000) : 
      (this.data.product.childPrice || 800)
    
    return basePrice
  },

  // 格式化日期
  formatDate: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 选择日期
  selectDate: function (e) {
    const date = e.currentTarget.dataset.date
    const dayItem = this.data.calendarDays.find(item => item.date === date)
    
    if (!dayItem || !dayItem.isAvailable) {
      return
    }
    
    // 更新选中状态
    const calendarDays = this.data.calendarDays.map(item => ({
      ...item,
      isSelected: item.date === date
    }))
    
    this.setData({
      selectedDate: date,
      calendarDays: calendarDays
    })
  },

  // 上个月
  prevMonth: function () {
    const currentMonth = this.data.currentMonth
    if (!currentMonth || !(currentMonth instanceof Date)) {
      currentMonth = new Date()
    }
    
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    
    this.setData({
      currentMonth: prevMonth
    })
    this.generateCalendar()
  },

  // 下个月
  nextMonth: function () {
    const currentMonth = this.data.currentMonth
    if (!currentMonth || !(currentMonth instanceof Date)) {
      currentMonth = new Date()
    }
    
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    
    this.setData({
      currentMonth: nextMonth
    })
    this.generateCalendar()
  },

  // 跳转到预订页面
  goToBooking: function () {
    if (!this.data.selectedDate) {
      wx.showToast({
        title: '请选择出行日期',
        icon: 'none'
      })
      return
    }
    
    const productId = this.data.product._id
    const dateStr = this.data.selectedDate
    const priceData = this.data.product.priceCalendar && this.data.product.priceCalendar[dateStr]
    
    // 获取选中日期的价格
    const adultPrice = priceData ? priceData.adultPrice : this.data.product.adultPrice
    const childPrice = priceData ? priceData.childPrice : this.data.product.childPrice
    
    wx.navigateTo({
      url: `/pages/product/booking?id=${productId}&date=${this.data.selectedDate}&priceType=${this.data.priceType}&adultPrice=${adultPrice}&childPrice=${childPrice}`
    })
  },

  // 新增预览详情图方法
  previewDetailImage: function(e) {
    const url = e.currentTarget.dataset.url;
    console.log('预览图片:', url);
    wx.previewImage({
      current: url,
      urls: this.data.product.detailImages
    });
  }

  
})