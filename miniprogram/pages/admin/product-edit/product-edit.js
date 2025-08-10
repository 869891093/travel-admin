// 产品编辑页面
const db = wx.cloud.database()

Page({
  data: {
    id: '',
    isEdit: false,
    product: {
      title: '',
      description: '',
      adultPrice: '',
      childPrice: '',
      region: '',
      coverImage: '',
      images: [],
      tags: [],
      status: 'active',
      fees: [
        { type: '包含', description: '' },
        { type: '不包含', description: '' }
      ],
      itinerary: [],
      notices: [],
      priceCalendar: {},
      detailImages: [],
    },
    regions: [],
    currentMonth: new Date(),
    currentMonthText: '',
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    showCalendarEditor: false,
    editingDate: null,
    editingPrice: {
      adultPrice: '',
      childPrice: '',
      available: true
    },
    newTag: '',
    // 富文本编辑器实例
    itineraryEditors: {},
    feeEditors: {},
    noticeEditors: {},
  },

  onLoad: function (options) {
    console.log('产品编辑页面加载，参数:', options);
    console.log('初始数据:', this.data.product);
    
    try {
      this.loadRegions();
      this.generateCalendar();
      
      if (options.id) {
        console.log('编辑模式，产品ID:', options.id);
        this.loadProduct(options.id);
      } else {
        console.log('新增模式');
        // 确保新增模式下所有数组字段都被正确初始化
        const product = {
          title: '',
          description: '',
          adultPrice: '',
          childPrice: '',
          region: '',
          coverImage: '',
          images: [],
          tags: [],
          status: 'active',
          fees: [
            { type: '包含', description: '' },
            { type: '不包含', description: '' }
          ],
          itinerary: [],
          notices: [],
          priceCalendar: {},
          detailImages: [],
        };
        
        this.setData({
          isEdit: false,
          id: '',
          product: product
        });
        
        console.log('新增模式初始化后的数据:', this.data.product);
      }
    } catch (error) {
      console.error('页面加载失败:', error);
      wx.showToast({
        title: '页面加载失败',
        icon: 'none'
      });
    }
  },

  onShow: function () {
    console.log('产品编辑页面显示');
  },

  onReady: function () {
    console.log('产品编辑页面准备完成');
  },

  onHide: function () {
    console.log('产品编辑页面隐藏');
  },

  onUnload: function () {
    console.log('产品编辑页面卸载');
  },

  // 返回上一页
  goBack: function () {
    wx.navigateBack({
      success: function() {
        console.log('返回成功');
      },
      fail: function(err) {
        console.error('返回失败:', err);
        wx.navigateTo({
          url: '/pages/admin/admin'
        });
      }
    });
  },

  // 行程安排管理
  addItineraryItem: function() {
    console.log('添加行程项目');
    const itinerary = this.data.product.itinerary || [];
    itinerary.push('');
    this.setData({
      'product.itinerary': itinerary
    });
    console.log('添加后行程:', this.data.product.itinerary);
  },

  removeItineraryItem: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log('删除行程项目，索引:', index);
    const itinerary = this.data.product.itinerary || [];
    itinerary.splice(index, 1);

    // 删除对应的编辑器实例
    delete this.data.itineraryEditors[index];

    this.setData({
      'product.itinerary': itinerary
    });
    console.log('删除后行程:', this.data.product.itinerary);
  },

  // 行程富文本编辑器事件
  onItineraryEditorReady: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log(`行程编辑器${index}准备就绪`);

    // 通过选择器获取编辑器实例
    setTimeout(() => {
      wx.createSelectorQuery().in(this).select(`#itinerary-editor-${index}`).context((res) => {
        const editor = res.context;
        this.data.itineraryEditors[index] = editor;

        // 如果有现有内容，设置到编辑器中
        const content = this.data.product.itinerary[index];
        if (content) {
          console.log(`行程${index}现有内容:`, content);
          try {
            editor.setContents({
              html: content
            });
            console.log(`行程编辑器${index}内容已设置`);
          } catch (error) {
            console.error(`设置行程编辑器${index}内容失败:`, error);
          }
        }
      }).exec();
    }, 300);
  },

  onItineraryEditorInput: function(e) {
    const index = e.currentTarget.dataset.index;
    const html = e.detail.html;
    console.log('行程编辑器输入，索引:', index, '内容:', html);
    this.setData({
      [`product.itinerary[${index}]`]: html
    });
  },

  onItineraryEditorBlur: function(e) {
    const index = e.currentTarget.dataset.index;
    const html = e.detail.html;
    console.log('行程编辑器失去焦点，索引:', index, '内容:', html);
    this.setData({
      [`product.itinerary[${index}]`]: html
    });
  },

  // 费用说明管理
  addFeeItem: function(e) {
    const type = e.currentTarget.dataset.type;
    console.log('添加费用项目，类型:', type);
    const fees = this.data.product.fees || [];
    fees.push({
      type: type,
      description: ''
    });
    this.setData({
      'product.fees': fees
    });
    console.log('添加后费用:', this.data.product.fees);
  },

  removeFeeItem: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log('删除费用项目，索引:', index);
    const fees = this.data.product.fees || [];
    fees.splice(index, 1);

    // 删除对应的编辑器实例
    delete this.data.feeEditors[index];

    this.setData({
      'product.fees': fees
    });
    console.log('删除后费用:', this.data.product.fees);
  },

  // 费用富文本编辑器事件
  onFeeEditorReady: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log(`费用编辑器${index}准备就绪`);

    // 通过选择器获取编辑器实例
    setTimeout(() => {
      wx.createSelectorQuery().in(this).select(`#fee-editor-${index}`).context((res) => {
        const editor = res.context;
        this.data.feeEditors[index] = editor;

        // 如果有现有内容，设置到编辑器中
        const content = this.data.product.fees[index]?.description;
        if (content) {
          console.log(`费用${index}现有内容:`, content);
          try {
            editor.setContents({
              html: content
            });
            console.log(`费用编辑器${index}内容已设置`);
          } catch (error) {
            console.error(`设置费用编辑器${index}内容失败:`, error);
          }
        }
      }).exec();
    }, 300);
  },

  onFeeEditorInput: function(e) {
    const index = e.currentTarget.dataset.index;
    const html = e.detail.html;
    console.log('费用编辑器输入，索引:', index, '内容:', html);
    this.setData({
      [`product.fees[${index}].description`]: html
    });
  },

  onFeeEditorBlur: function(e) {
    const index = e.currentTarget.dataset.index;
    const html = e.detail.html;
    console.log('费用编辑器失去焦点，索引:', index, '内容:', html);
    this.setData({
      [`product.fees[${index}].description`]: html
    });
  },

  // 预订须知管理
  addNoticeItem: function() {
    console.log('添加预订须知');
    const notices = this.data.product.notices || [];
    notices.push('');
    this.setData({
      'product.notices': notices
    });
    console.log('添加后须知:', this.data.product.notices);
  },

  removeNoticeItem: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log('删除预订须知，索引:', index);
    const notices = this.data.product.notices || [];
    notices.splice(index, 1);

    // 删除对应的编辑器实例
    delete this.data.noticeEditors[index];

    this.setData({
      'product.notices': notices
    });
    console.log('删除后须知:', this.data.product.notices);
  },

  // 预订须知富文本编辑器事件
  onNoticeEditorReady: function(e) {
    const index = e.currentTarget.dataset.index;
    console.log(`须知编辑器${index}准备就绪`);

    // 通过选择器获取编辑器实例
    setTimeout(() => {
      wx.createSelectorQuery().in(this).select(`#notice-editor-${index}`).context((res) => {
        const editor = res.context;
        this.data.noticeEditors[index] = editor;

        // 如果有现有内容，设置到编辑器中
        const content = this.data.product.notices[index];
        if (content) {
          console.log(`须知${index}现有内容:`, content);
          try {
            editor.setContents({
              html: content
            });
            console.log(`须知编辑器${index}内容已设置`);
          } catch (error) {
            console.error(`设置须知编辑器${index}内容失败:`, error);
          }
        }
      }).exec();
    }, 300);
  },

  onNoticeEditorInput: function(e) {
    const index = e.currentTarget.dataset.index;
    const html = e.detail.html;
    console.log('须知编辑器输入，索引:', index, '内容:', html);
    this.setData({
      [`product.notices[${index}]`]: html
    });
  },

  onNoticeEditorBlur: function(e) {
    const index = e.currentTarget.dataset.index;
    const html = e.detail.html;
    console.log('须知编辑器失去焦点，索引:', index, '内容:', html);
    this.setData({
      [`product.notices[${index}]`]: html
    });
  },



  // 加载产品数据
  loadProduct: function (id) {
    wx.showLoading({ title: '加载中...' })
    
    db.collection('products').doc(id).get().then(res => {
      wx.hideLoading()
      const product = res.data
      
      console.log('原始产品数据:', product)
      
      // 确保priceCalendar字段存在
      if (!product.priceCalendar) {
        product.priceCalendar = {}
      }
      
      // 确保所有数组字段都存在且不为null
      if (!product.images || !Array.isArray(product.images)) product.images = []
      if (!product.tags || !Array.isArray(product.tags)) product.tags = []
      if (!product.fees || !Array.isArray(product.fees)) product.fees = []
      if (!product.itinerary || !Array.isArray(product.itinerary)) product.itinerary = []
      if (!product.notices || !Array.isArray(product.notices)) product.notices = []
      
      // 特别处理detailImages
      if (!product.detailImages || !Array.isArray(product.detailImages)) {
        console.log('detailImages被重置为空数组')
        product.detailImages = []
      }
      
      // 如果封面图片URL为空，但有主图，则使用第一张主图作为封面
      if (!product.coverImage && product.images.length > 0) {
        product.coverImage = product.images[0]
      }
      
      // 先设置产品数据
      this.setData({ 
        product: product,
        id: id,
        isEdit: true
      })
      
      // 延迟生成日历和设置编辑器内容，确保产品数据已经设置
      setTimeout(() => {
        this.generateCalendar()
        this.setEditorsContent()
      }, 500)
      
    }).catch(err => {
      wx.hideLoading()
      console.error('加载产品失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 设置富文本编辑器内容
  setEditorsContent: function() {
    console.log('开始设置编辑器内容，跳过此函数，改为在编辑器准备就绪时设置')
    // 不在这里设置内容，改为在各个编辑器的 onReady 事件中设置
  },

  // 加载区域列表
  loadRegions: function () {
    console.log('开始加载区域列表');
    db.collection('regions').where({
      status: 'active'
    }).get().then(res => {
      console.log('区域列表加载成功:', res.data);
      this.setData({ regions: res.data })
    }).catch(err => {
      console.error('加载区域列表失败:', err);
      // 设置默认区域，避免页面崩溃
      this.setData({ 
        regions: [
          { _id: 'north_xinjiang', name: '北疆' },
          { _id: 'south_xinjiang', name: '南疆' },
          { _id: 'inner_mongolia', name: '内蒙' },
          { _id: 'northeast', name: '东北' }
        ]
      });
      wx.showToast({
        title: '区域数据加载失败，使用默认区域',
        icon: 'none',
        duration: 2000
      });
    })
  },

  // 生成日历
  generateCalendar: function () {
    let currentMonth = this.data.currentMonth
    // 容错：确保 currentMonth 是 Date 对象
    if (!(currentMonth instanceof Date)) {
      currentMonth = new Date(currentMonth)
      if (isNaN(currentMonth.getTime())) {
        currentMonth = new Date()
      }
      this.setData({ currentMonth })
    }
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    const monthText = `${year}年${month + 1}月`
    
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
        isAvailable: false,
        price: 0
      })
    }
    
    // 获取当月的天数
    const currentMonthDays = []
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateStr = this.formatDate(date)
      const priceData = this.data.product.priceCalendar[dateStr]
      
      currentMonthDays.push({
        date: dateStr,
        day: day,
        isCurrentMonth: true,
        isAvailable: priceData ? priceData.available : true,
        adultPrice: priceData ? priceData.adultPrice : this.data.product.adultPrice,
        childPrice: priceData ? priceData.childPrice : this.data.product.childPrice
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
        isAvailable: false,
        price: 0
      })
    }
    
    const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays]
    
    // 只更新日历相关数据，不覆盖产品数据
    this.setData({ 
      calendarDays: allDays,
      currentMonthText: monthText
    })
  },

  // 格式化日期
  formatDate: function (date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  // 输入处理
  onInput: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    console.log('输入:', field, value)
    this.setData({
      [`product.${field}`]: value
    })
  },

  // 选择并上传详情图片
  chooseDetailImage: function() {
    const that = this;
    wx.chooseImage({
      count: 9, // 最多选择9张图片
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        wx.showLoading({ title: '上传中...' });
        
        const uploadPromises = res.tempFilePaths.map(filePath => {
          const cloudPath = 'product-detail/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + filePath.match(/\.[^.]+?$/)[0];
          return wx.cloud.uploadFile({
            cloudPath,
            filePath
          });
        });
        
        Promise.all(uploadPromises).then(results => {
          wx.hideLoading();
          const newImages = results.map(result => result.fileID);
          const currentImages = that.data.product.detailImages || [];
          that.setData({
            'product.detailImages': [...currentImages, ...newImages]
          });
          wx.showToast({ title: '上传成功', icon: 'success' });
        }).catch(err => {
          wx.hideLoading();
          console.error('上传失败:', err);
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },

  // 删除详情图片
  removeDetailImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const detailImages = this.data.product.detailImages || [];
    detailImages.splice(index, 1);
    this.setData({
      'product.detailImages': detailImages
    });
    wx.showToast({ title: '删除成功', icon: 'success' });
  },

  // 上移详情图片
  moveDetailImageUp: function(e) {
    const index = e.currentTarget.dataset.index;
    const detailImages = this.data.product.detailImages || [];
    if (index > 0) {
      const temp = detailImages[index];
      detailImages[index] = detailImages[index - 1];
      detailImages[index - 1] = temp;
      this.setData({
        'product.detailImages': detailImages
      });
    }
  },

  // 下移详情图片
  moveDetailImageDown: function(e) {
    const index = e.currentTarget.dataset.index;
    const detailImages = this.data.product.detailImages || [];
    if (index < detailImages.length - 1) {
      const temp = detailImages[index];
      detailImages[index] = detailImages[index + 1];
      detailImages[index + 1] = temp;
      this.setData({
        'product.detailImages': detailImages
      });
    }
  },

  // 选择并上传主图
  chooseCoverImage: function() {
    const that = this;
    wx.chooseImage({
      count: 9, // 最多选择9张图片
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        wx.showLoading({ title: '上传中...' });
        
        const uploadPromises = res.tempFilePaths.map(filePath => {
          const cloudPath = 'product-cover/' + Date.now() + '-' + Math.floor(Math.random() * 10000) + filePath.match(/\.[^.]+?$/)[0];
          return wx.cloud.uploadFile({
            cloudPath,
            filePath
          });
        });
        
        Promise.all(uploadPromises).then(results => {
          wx.hideLoading();
          const newImages = results.map(result => result.fileID);
          const currentImages = that.data.product.images || [];
          const allImages = [...currentImages, ...newImages];
          
          that.setData({
            'product.images': allImages
          });
          
          // 如果这是第一张主图，自动同步到封面图片URL
          if (currentImages.length === 0 && newImages.length > 0) {
            that.setData({
              'product.coverImage': newImages[0]
            });
          }
          
          wx.showToast({ title: '上传成功', icon: 'success' });
        }).catch(err => {
          wx.hideLoading();
          console.error('上传失败:', err);
          wx.showToast({ title: '上传失败', icon: 'none' });
        });
      }
    });
  },

  // 删除主图
  removeCoverImage: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.product.images || [];
    images.splice(index, 1);
    
    this.setData({
      'product.images': images
    });
    
    // 如果删除的是第一张图片，且封面图片URL与第一张图片相同，则更新封面图片URL
    if (index === 0 && images.length > 0 && this.data.product.coverImage === images[0]) {
      this.setData({
        'product.coverImage': images[0]
      });
    } else if (index === 0 && images.length === 0) {
      // 如果删除了所有主图，清空封面图片URL
      this.setData({
        'product.coverImage': ''
      });
    }
  },

  // 上移主图
  moveCoverImageUp: function(e) {
    const index = e.currentTarget.dataset.index;
    if (index === 0) return;
    const images = this.data.product.images.slice();
    [images[index - 1], images[index]] = [images[index], images[index - 1]];
    
    this.setData({
      'product.images': images
    });
    
    // 如果移动后第一张图片发生变化，且封面图片URL与原来的第一张相同，则更新封面图片URL
    if (this.data.product.coverImage === images[index]) {
      this.setData({
        'product.coverImage': images[index - 1]
      });
    }
  },

  // 下移主图
  moveCoverImageDown: function(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.product.images.slice();
    if (index >= images.length - 1) return;
    [images[index], images[index + 1]] = [images[index + 1], images[index]];
    
    this.setData({
      'product.images': images
    });
    
    // 如果移动后第一张图片发生变化，且封面图片URL与原来的第一张相同，则更新封面图片URL
    if (this.data.product.coverImage === images[index + 1]) {
      this.setData({
        'product.coverImage': images[index]
      });
    }
  },

  // 标签输入
  onTagInput: function(e) {
    this.setData({ newTag: e.detail.value });
  },

  // 添加标签
  addTag: function() {
    let tag = (this.data.newTag || '').trim();
    if (!tag) return;
    let tags = this.data.product.tags || [];
    if (tags.includes(tag)) {
      wx.showToast({ title: '标签已存在', icon: 'none' });
      return;
    }
    tags.push(tag);
    this.setData({
      'product.tags': tags,
      newTag: ''
    });
  },

  // 删除标签
  removeTag: function(e) {
    const index = e.currentTarget.dataset.index;
    let tags = this.data.product.tags || [];
    tags.splice(index, 1);
    this.setData({
      'product.tags': tags
    });
  },

  // 保存产品
  saveProduct: function () {
    const { product, isEdit, id } = this.data
    
    console.log('保存产品:', { product, isEdit, id })
    console.log('原始产品数据:', product)
    
    // 验证必填字段
    if (!product.title.trim()) {
      wx.showToast({
        title: '请输入产品标题',
        icon: 'none'
      })
      return
    }
    
    if (!product.adultPrice) {
      wx.showToast({
        title: '请输入成人价格',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '保存中...' })
    
    // 手动构建更新数据，排除系统字段
    const productData = {
      title: product.title,
      description: product.description,
      adultPrice: product.adultPrice,
      childPrice: product.childPrice,
      region: product.region,
      coverImage: product.coverImage,
      images: product.images || [],
      tags: product.tags || [],
      status: product.status,
      fees: product.fees || [],
      itinerary: product.itinerary || [],
      notices: product.notices || [],
      priceCalendar: product.priceCalendar || {},
      detailImages: product.detailImages || [],
      updateTime: new Date()
    }
    
    if (!isEdit) {
      productData.createTime = new Date()
    }
    
    console.log('准备保存的数据:', productData)
    
    if (isEdit) {
      // 更新产品
      db.collection('products').doc(id).update({
        data: productData
      }).then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }).catch(err => {
        wx.hideLoading()
        console.error('更新失败:', err)
        console.error('更新失败详情:', {
          error: err,
          data: productData,
          id: id
        })
        wx.showToast({
          title: '更新失败: ' + (err.message || '未知错误'),
          icon: 'none',
          duration: 3000
        })
      })
    } else {
      // 创建产品
      db.collection('products').add({
        data: productData
      }).then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '创建成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }).catch(err => {
        wx.hideLoading()
        console.error('创建失败:', err)
        wx.showToast({
          title: '创建失败: ' + (err.message || '未知错误'),
          icon: 'none',
          duration: 3000
        })
      })
    }
  },

  // 编辑日期价格
  editDatePrice: function (e) {
    const date = e.currentTarget.dataset.date
    console.log('编辑日期价格:', date)
    
    // 获取当前日期的价格信息
    const currentPrice = this.data.product.priceCalendar[date] || {
      adultPrice: this.data.product.adultPrice || '',
      childPrice: this.data.product.childPrice || '',
      available: true
    }
    
    this.setData({
      showCalendarEditor: true,
      editingDate: date,
      editingPrice: currentPrice
    })
  },

  // 批量设置日历价格
  addCalendarPrice: function () {
    wx.showModal({
      title: '批量设置价格',
      content: '确定要为当前月份的所有日期设置相同的价格吗？',
      success: (res) => {
        if (res.confirm) {
          const { product } = this.data
          const currentMonth = this.data.currentMonth
          const year = currentMonth.getFullYear()
          const month = currentMonth.getMonth()
          const lastDay = new Date(year, month + 1, 0).getDate()
          
          const priceCalendar = { ...product.priceCalendar }
          
          for (let day = 1; day <= lastDay; day++) {
            const date = this.formatDate(new Date(year, month, day))
            priceCalendar[date] = {
              adultPrice: product.adultPrice || '',
              childPrice: product.childPrice || '',
              available: true
            }
          }
          
          this.setData({
            'product.priceCalendar': priceCalendar
          })
          
          this.generateCalendar()
          
          wx.showToast({
            title: '批量设置成功',
            icon: 'success'
          })
        }
      }
    })
  },

  // 保存日期价格
  saveDatePrice: function () {
    const { editingDate, editingPrice, product } = this.data
    
    if (!editingPrice.adultPrice) {
      wx.showToast({
        title: '请输入成人价格',
        icon: 'none'
      })
      return
    }
    
    const priceCalendar = { ...product.priceCalendar }
    priceCalendar[editingDate] = editingPrice
    
    this.setData({
      'product.priceCalendar': priceCalendar,
      showCalendarEditor: false,
      editingDate: null,
      editingPrice: {
        adultPrice: '',
        childPrice: '',
        available: true
      }
    })
    
    this.generateCalendar()
    
    wx.showToast({
      title: '价格设置成功',
      icon: 'success'
    })
  },

  // 取消编辑日期价格
  cancelEdit: function () {
    this.setData({
      showCalendarEditor: false,
      editingDate: null,
      editingPrice: {
        adultPrice: '',
        childPrice: '',
        available: true
      }
    })
  },

  // 测试输入数据
  testInput: function () {
    console.log('测试输入数据')
    console.log('当前产品数据:', this.data.product)
    console.log('价格日历数据:', this.data.product.priceCalendar)
    
    wx.showModal({
      title: '测试数据',
      content: JSON.stringify(this.data.product, null, 2),
      showCancel: false
    })
  },

  // 处理价格输入
  onPriceInput: function (e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    console.log('价格输入:', field, value)
    
    this.setData({
      [`editingPrice.${field}`]: value
    })
  },

  // 切换可售状态
  toggleAvailable: function (e) {
    const available = e.detail.value
    console.log('切换可售状态:', available)
    
    this.setData({
      'editingPrice.available': available
    })
  },

  // 处理区域选择
  onRegionChange: function (e) {
    const index = e.detail.value
    const region = this.data.regions[index]
    console.log('选择区域:', region)
    
    this.setData({
      'product.region': region.name
    })
  }
}) 