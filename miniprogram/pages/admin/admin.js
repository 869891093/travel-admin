// pages/admin/admin.js
const db = wx.cloud.database()

Page({
  data: {
    currentPage: 'products',
    products: [],
    orders: [],
    banners: [],
    regions: [],
    refunds: [], // 退款列表
    loading: false,
    isAdmin: false,
    isSuperAdmin: false,
    currentOpenid: '',
    // 管理员管理相关数据
    showAdminManage: false,
    admins: [],
    newAdmin: {
      openid: '',
      name: '',
      phone: '',
      role: 'admin',
      permissions: ['products', 'orders', 'banners', 'refunds']
    },
    initLoading: false,
    clearLoading: false,
    // 订单管理新增功能
    searchOrderNo: '', // 搜索的订单号
    selectedOrders: [], // 选中的订单ID列表
    selectAll: false, // 全选状态
    showBatchActions: false, // 显示批量操作按钮
    // 退款管理相关数据
    refundStatusIndex: 0, // 当前选择的状态筛选索引
    refundStatusOptions: [
      { value: '', text: '全部状态' },
      { value: 'pending', text: '待审核' },
      { value: 'approved', text: '已通过' },
      { value: 'rejected', text: '已拒绝' },
      { value: 'completed', text: '已完成' }
    ]
  },

  onLoad: function () {
    console.log('页面加载，开始检查权限');
    this.checkAdminPermission()
  },

  onShow: function () {
    if (this.data.isAdmin) {
      this.loadPageData()
    }
  },

  // 检查管理员权限
  checkAdminPermission: function () {
    const that = this
    wx.showLoading({ title: '检查权限...' })
    
    wx.cloud.callFunction({
      name: 'checkAdmin'
    }).then(res => {
      wx.hideLoading()
      console.log('权限检查结果:', res)
      
      if (res.result && res.result.isAdmin) {
        const isSuperAdmin = res.result.adminInfo && res.result.adminInfo.role === 'super_admin';
        console.log('用户权限信息:', {
          isAdmin: true,
          isSuperAdmin: isSuperAdmin,
          adminInfo: res.result.adminInfo,
          openid: res.result.openid
        });
        
        that.setData({
          isAdmin: true,
          isSuperAdmin: isSuperAdmin,
          currentOpenid: res.result.openid
        })
        
        // 显示权限信息
        wx.showToast({
          title: isSuperAdmin ? '超级管理员' : '管理员',
          icon: 'none',
          duration: 2000
        });
        
        that.loadPageData()
      } else {
        wx.showToast({
          title: '权限不足',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('权限检查失败:', err)
      wx.showToast({
        title: '权限检查失败',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    })
  },

  // 加载页面数据
  loadPageData: function () {
    const { currentPage } = this.data
    this.setData({ loading: true })
    switch (currentPage) {
      case 'products':
        this.loadProducts()
        break
      case 'orders':
        this.loadOrders()
        break
      case 'banners':
        this.loadBanners()
        break
      case 'refunds':
        this.loadRefunds()
        break
      case 'admins':
        if (this.data.isSuperAdmin) {
          this.loadAdmins()
        } else {
          this.setData({ loading: false })
          wx.showToast({ title: '无超级管理员权限', icon: 'none' })
        }
        break
      default:
        this.setData({ loading: false })
        break
    }
  },

  // 切换页面
  switchPage: function (e) {
    const page = e.currentTarget.dataset.page
    console.log('切换到页面:', page)
    this.setData({
      currentPage: page
    })
    this.loadPageData()
  },

  // 加载产品数据
  loadProducts: function () {
    const that = this
    this.setData({ loading: true })
    
    db.collection('products').orderBy('createTime', 'desc').get().then(res => {
      console.log('加载产品数据:', res.data.length, '条')
      console.log('产品数据:', res.data)
      
      that.setData({
        products: res.data,
        loading: false
      })
    }).catch(err => {
      console.error('加载产品数据失败:', err)
      that.setData({ loading: false })
    })
  },

  // 加载订单数据
  loadOrders: function () {
    const that = this
    this.setData({ loading: true })

    let query = db.collection('orders').orderBy('createTime', 'desc')

    // 如果有搜索条件，添加搜索
    if (this.data.searchOrderNo.trim()) {
      query = query.where({
        orderNo: db.RegExp({
          regexp: this.data.searchOrderNo.trim(),
          options: 'i'
        })
      })
    }

    query.get().then(res => {
      console.log('加载订单数据:', res.data.length, '条')

      // 添加状态文本
      const ordersWithStatus = res.data.map(order => ({
        ...order,
        statusText: that.getOrderStatusText(order.status)
      }))

      that.setData({
        orders: ordersWithStatus,
        loading: false,
        selectedOrders: [], // 重置选中状态
        selectAll: false,
        showBatchActions: false
      })
    }).catch(err => {
      console.error('加载订单数据失败:', err)
      that.setData({ loading: false })
    })
  },

  // 加载轮播图数据
  loadBanners: function () {
    const that = this
    this.setData({ loading: true })
    
    db.collection('banners').orderBy('sort', 'asc').get().then(res => {
      console.log('加载轮播图数据:', res.data.length, '条')
      
      that.setData({
        banners: res.data,
        loading: false
      })
    }).catch(err => {
      console.error('加载轮播图数据失败:', err)
      that.setData({ loading: false })
    })
  },

  // 添加产品
  addProduct: function() {
    console.log('跳转到产品编辑页面');
    wx.navigateTo({
      url: '/pages/admin/product-edit/product-edit',
      success: function() {
        console.log('跳转成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 编辑产品
  editProduct: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('编辑产品，ID:', id);
    wx.navigateTo({
      url: `/pages/admin/product-edit/product-edit?id=${id}`,
      success: function() {
        console.log('跳转到编辑页面成功');
      },
      fail: function(err) {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除产品
  deleteProduct: function(e) {
    const id = e.currentTarget.dataset.id;
    console.log('删除产品，ID:', id);
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个产品吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          // 调用云函数删除产品
          wx.cloud.callFunction({
            name: 'deleteData',
            data: {
              collection: 'products',
              id: id
            }
          }).then(res => {
            wx.hideLoading();
            console.log('删除产品结果:', res);
            
            if (res.result && res.result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              this.loadProducts();
            } else {
              wx.showToast({
                title: res.result.message || '删除失败',
                icon: 'none'
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('删除产品失败:', err);
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            });
          });
        }
      }
    });
  },

  // 切换产品热门状态
  toggleHot: function(e) {
    const id = e.currentTarget.dataset.id;
    const isHot = e.currentTarget.dataset.hot;
    const newHotStatus = !isHot;
    
    console.log('切换热门状态，ID:', id, '当前状态:', isHot, '新状态:', newHotStatus);
    
    wx.showLoading({ title: '处理中...' });
    
    // 调用云函数更新产品热门状态
    wx.cloud.callFunction({
      name: 'deleteData', // 复用deleteData云函数，但用于更新
      data: {
        collection: 'products',
        id: id,
        updateData: {
          isHot: newHotStatus,
          hotSort: newHotStatus ? 1 : 0
        }
      }
    }).then(res => {
      wx.hideLoading();
      console.log('热门状态切换结果:', res);
      
      if (res.result && res.result.success) {
        wx.showToast({
          title: newHotStatus ? '设为热门成功' : '取消热门成功',
          icon: 'success'
        });
        this.loadProducts();
      } else {
        wx.showToast({
          title: res.result.message || '操作失败',
          icon: 'none'
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('热门状态切换失败:', err);
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
  },

  // 显示管理员管理
  showAdminManagement: function () {
    this.setData({
      showAdminManage: true
    })
    this.loadAdmins()
  },

  // 隐藏管理员管理
  hideAdminManagement: function () {
    this.setData({
      showAdminManage: false
    })
  },

  // 加载管理员列表
  loadAdmins: function () {
    const that = this
    wx.showLoading({ title: '加载中...' })
    
    wx.cloud.callFunction({
      name: 'manageAdmin',
      data: {
        action: 'list'
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        that.setData({
          admins: res.result.admins
        })
      } else {
        wx.showToast({
          title: res.result.message,
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('加载管理员列表失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 管理员表单输入处理
  onAdminOpenidInput: function (e) {
    this.setData({
      'newAdmin.openid': e.detail.value
    })
  },

  onAdminNameInput: function (e) {
    this.setData({
      'newAdmin.name': e.detail.value
    })
  },

  onAdminPhoneInput: function (e) {
    this.setData({
      'newAdmin.phone': e.detail.value
    })
  },

  onAdminRoleChange: function (e) {
    const role = e.detail.value === '1' ? 'super_admin' : 'admin'
    this.setData({
      'newAdmin.role': role
    })
  },

  // 添加管理员
  addAdmin: function () {
    const that = this
    const { newAdmin } = this.data
    
    if (!newAdmin.openid.trim()) {
      wx.showToast({
        title: '请输入用户openid',
        icon: 'none'
      })
      return
    }
    
    wx.showLoading({ title: '添加中...' })
    
    wx.cloud.callFunction({
      name: 'manageAdmin',
      data: {
        action: 'add',
        targetOpenid: newAdmin.openid,
        adminData: {
          name: newAdmin.name,
          phone: newAdmin.phone,
          role: newAdmin.role,
          permissions: newAdmin.permissions
        }
      }
    }).then(res => {
      wx.hideLoading()
      if (res.result.success) {
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        })
        // 重置表单
        that.setData({
          newAdmin: {
            openid: '',
            name: '',
            phone: '',
            role: 'admin',
            permissions: ['products', 'orders', 'banners']
          }
        })
        // 重新加载列表
        that.loadAdmins()
      } else {
        wx.showToast({
          title: res.result.message,
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('添加管理员失败:', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    })
  },

  // 移除管理员
  removeAdmin: function (e) {
    const openid = e.currentTarget.dataset.openid
    const that = this
    
    wx.showModal({
      title: '确认移除',
      content: '确定要移除这个管理员吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '移除中...' })
          
          wx.cloud.callFunction({
            name: 'manageAdmin',
            data: {
              action: 'remove',
              targetOpenid: openid
            }
          }).then(res => {
            wx.hideLoading()
            if (res.result.success) {
              wx.showToast({
                title: '移除成功',
                icon: 'success'
              })
              that.loadAdmins()
            } else {
              wx.showToast({
                title: res.result.message,
                icon: 'none'
              })
            }
          }).catch(err => {
            wx.hideLoading()
            console.error('移除管理员失败:', err)
            wx.showToast({
              title: '移除失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 切换产品状态 - 优化版本
  toggleProductStatus: function (e) {
    const id = e.currentTarget.dataset.id
    const currentStatus = e.currentTarget.dataset.status
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const actionText = newStatus === 'active' ? '上架' : '下架'
    const product = this.data.products.find(p => p._id === id)

    console.log('切换产品状态:', {
      id,
      currentStatus,
      newStatus,
      actionText,
      product
    })

    wx.showModal({
      title: `确认${actionText}`,
      content: `确定要将产品"${product.title}"${actionText}吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          // 直接尝试更新
          db.collection('products').doc(id).update({
            data: {
              status: newStatus,
              updateTime: new Date()
            }
          }).then(result => {
            wx.hideLoading()
            console.log('更新结果:', result)
            wx.showToast({ title: `${actionText}成功`, icon: 'success' })
            
            // 延迟重新加载
            setTimeout(() => {
              this.loadProducts()
            }, 1000)
          }).catch(err => {
            wx.hideLoading()
            console.error('更新失败:', err)
            
            let errorMsg = `${actionText}失败`
            if (err.errMsg) {
              errorMsg += ': ' + err.errMsg
            } else if (err.message) {
              errorMsg += ': ' + err.message
            }
            
            wx.showToast({ 
              title: errorMsg, 
              icon: 'none',
              duration: 3000
            })
          })
        }
      }
    })
  },

  // 简化版的下架方法
  simpleToggleStatus: function (e) {
    const id = e.currentTarget.dataset.id
    const currentStatus = e.currentTarget.dataset.status
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const actionText = newStatus === 'active' ? '上架' : '下架'
    
    console.log('简化版切换状态:', { id, currentStatus, newStatus })
    
    wx.showModal({
      title: `确认${actionText}`,
      content: `确定要${actionText}此产品吗？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' })
          
          // 直接尝试更新，不做权限检查
          db.collection('products').doc(id).update({
            data: {
              status: newStatus,
              updateTime: new Date()
            }
          }).then(result => {
            wx.hideLoading()
            console.log('简化版更新结果:', result)
            wx.showToast({ title: `${actionText}成功`, icon: 'success' })
            
            // 延迟重新加载
            setTimeout(() => {
              this.loadProducts()
            }, 1000)
          }).catch(err => {
            wx.hideLoading()
            console.error('简化版更新失败:', err)
            
            let errorMsg = `${actionText}失败`
            if (err.errMsg) {
              errorMsg += ': ' + err.errMsg
            } else if (err.message) {
              errorMsg += ': ' + err.message
            }
            
            wx.showToast({ 
              title: errorMsg, 
              icon: 'none',
              duration: 3000
            })
          })
        }
      }
    })
  },

  initDatabase: function () {
    this.setData({ initLoading: true })
    
    wx.cloud.callFunction({
      name: 'initDatabase',
      success: res => {
        console.log('数据库初始化成功', res)
        wx.showToast({
          title: '初始化成功',
          icon: 'success'
        })
        // 重新加载数据
        this.loadPageData()
      },
      fail: err => {
        console.error('数据库初始化失败', err)
        wx.showToast({
          title: '初始化失败',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ initLoading: false })
      }
    })
  },

  clearDatabase: function () {
    this.setData({ clearLoading: true })
    
    wx.showModal({
      title: '确认清理',
      content: '这将删除所有产品数据，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'clearDatabase',
            success: res => {
              console.log('数据库清理成功', res)
              wx.showToast({
                title: '清理成功',
                icon: 'success'
              })
              // 重新加载数据
              this.loadPageData()
            },
            fail: err => {
              console.error('数据库清理失败', err)
              wx.showToast({
                title: '清理失败',
                icon: 'none'
              })
            },
            complete: () => {
              this.setData({ clearLoading: false })
            }
          })
        } else {
          this.setData({ clearLoading: false })
        }
      }
    })
  },

  // 添加轮播图 - 跳转到编辑页面
  addBanner: function() {
    wx.navigateTo({
      url: '/pages/admin/banner-edit/banner-edit'
    });
  },

  // 编辑轮播图 - 跳转到编辑页面
  editBanner: function(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/banner-edit/banner-edit?id=${id}`
    });
  },

  // 删除轮播图 - 通过云函数
  deleteBanner: function(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条轮播图吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' });
          
          wx.cloud.callFunction({
            name: 'bannerManage',
            data: {
              action: 'delete',
              bannerId: id
            }
          }).then(res => {
            wx.hideLoading();
            
            if (res.result && res.result.success) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              this.loadBanners();
            } else {
              wx.showToast({ 
                title: res.result.message || '删除失败', 
                icon: 'none',
                duration: 3000
              });
            }
          }).catch(err => {
            wx.hideLoading();
            console.error('删除轮播图失败:', err);
            wx.showToast({ 
              title: '删除失败，请重试', 
              icon: 'none',
              duration: 3000
            });
          });
        }
      }
    });
  },

  // 上移轮播图 - 添加错误处理
  moveBannerUp: function(e) {
    const index = e.currentTarget.dataset.index;
    if (index === 0) return;
    const banners = this.data.banners.slice();
    [banners[index - 1], banners[index]] = [banners[index], banners[index - 1]];
    this.updateBannerSort(banners);
  },

  // 下移轮播图 - 添加错误处理
  moveBannerDown: function(e) {
    const index = e.currentTarget.dataset.index;
    const banners = this.data.banners.slice();
    if (index >= banners.length - 1) return;
    [banners[index], banners[index + 1]] = [banners[index + 1], banners[index]];
    this.updateBannerSort(banners);
  },

  // 批量更新排序 - 通过云函数
  updateBannerSort: function(banners) {
    wx.showLoading({ title: '排序中...' });
    
    wx.cloud.callFunction({
      name: 'bannerManage',
      data: {
        action: 'updateSort',
        newSort: banners
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        wx.showToast({ title: '排序成功', icon: 'success' });
        this.loadBanners();
      } else {
        wx.showToast({ 
          title: res.result.message || '排序失败', 
          icon: 'none',
          duration: 3000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('排序失败:', err);
      wx.showToast({ 
        title: '排序失败，请重试', 
        icon: 'none',
        duration: 3000
      });
    });
  },

  // 启用/禁用轮播图 - 通过云函数
  toggleBannerStatus: function(e) {
    const id = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    const newStatus = status === 'active' ? 'inactive' : 'active';
    
    wx.showLoading({ title: '处理中...' });
    
    wx.cloud.callFunction({
      name: 'bannerManage',
      data: {
        action: 'updateStatus',
        bannerId: id,
        bannerData: { status: newStatus }
      }
    }).then(res => {
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        wx.showToast({ title: '操作成功', icon: 'success' });
        this.loadBanners();
      } else {
        wx.showToast({ 
          title: res.result.message || '操作失败', 
          icon: 'none',
          duration: 3000
        });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('状态切换失败:', err);
      wx.showToast({ 
        title: '操作失败，请重试', 
        icon: 'none',
        duration: 3000
      });
    });
  },

  // 订单管理新增功能

  // 获取订单状态文本
  getOrderStatusText: function(status) {
    const statusMap = {
      'pending': '待支付',
      'paying': '支付中',
      'paid': '已支付',
      'confirmed': '已确认',
      'completed': '已完成',
      'cancelled': '已取消',
      'refund_pending': '退款申请中',
      'refunded': '已退款'
    }
    return statusMap[status] || status
  },

  // 检查订单是否被选中
  isOrderSelected: function(orderId) {
    const isSelected = this.data.selectedOrders.indexOf(orderId) > -1
    console.log(`订单 ${orderId} 是否被选中:`, isSelected)
    return isSelected
  },

  // 搜索订单号输入
  onSearchOrderInput: function(e) {
    this.setData({
      searchOrderNo: e.detail.value
    })
  },

  // 搜索订单
  searchOrders: function() {
    console.log('搜索订单，关键词:', this.data.searchOrderNo)
    this.loadOrders()
  },

  // 清空搜索
  clearSearch: function() {
    this.setData({
      searchOrderNo: ''
    })
    this.loadOrders()
  },

  // 全选/取消全选
  toggleSelectAll: function() {
    const selectAll = !this.data.selectAll
    const selectedOrders = selectAll ? this.data.orders.map(order => order._id) : []

    this.setData({
      selectAll: selectAll,
      selectedOrders: selectedOrders,
      showBatchActions: selectedOrders.length > 0
    })
  },

  // 选择/取消选择订单
  toggleSelectOrder: function(e) {
    const orderId = e.currentTarget.dataset.id
    console.log('点击订单复选框，订单ID:', orderId)

    let selectedOrders = [...this.data.selectedOrders]
    console.log('当前选中的订单:', selectedOrders)

    const index = selectedOrders.indexOf(orderId)
    console.log('订单在选中列表中的索引:', index)

    if (index > -1) {
      selectedOrders.splice(index, 1)
      console.log('取消选择订单:', orderId)
    } else {
      selectedOrders.push(orderId)
      console.log('选择订单:', orderId)
    }

    const selectAll = selectedOrders.length === this.data.orders.length
    console.log('更新后的选中订单:', selectedOrders)
    console.log('是否全选:', selectAll)

    this.setData({
      selectedOrders: selectedOrders,
      selectAll: selectAll,
      showBatchActions: selectedOrders.length > 0
    }, () => {
      console.log('setData完成后的selectedOrders:', this.data.selectedOrders)
      console.log('检查订单是否在选中列表中:', this.data.selectedOrders.indexOf(orderId) > -1)
    })
  },

  // 批量删除订单
  batchDeleteOrders: function() {
    const selectedOrders = this.data.selectedOrders
    if (selectedOrders.length === 0) {
      wx.showToast({
        title: '请选择要删除的订单',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedOrders.length} 个订单吗？此操作不可恢复。`,
      success: (res) => {
        if (res.confirm) {
          this.performBatchDelete(selectedOrders)
        }
      }
    })
  },

  // 执行批量删除
  performBatchDelete: function(orderIds) {
    wx.showLoading({ title: '删除中...' })

    wx.cloud.callFunction({
      name: 'batchDeleteOrders',
      data: {
        orderIds: orderIds
      }
    }).then(res => {
      wx.hideLoading()
      console.log('批量删除结果:', res)

      if (res.result && res.result.success) {
        wx.showToast({
          title: `成功删除 ${res.result.deletedCount} 个订单`,
          icon: 'success'
        })
        this.loadOrders() // 重新加载订单列表
      } else {
        wx.showToast({
          title: res.result.message || '删除失败',
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('批量删除失败:', err)
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      })
    })
  },

  // 单个删除订单
  deleteOrder: function(e) {
    const orderId = e.currentTarget.dataset.id
    const order = this.data.orders.find(o => o._id === orderId)

    wx.showModal({
      title: '确认删除',
      content: `确定要删除订单 ${order.orderNo} 吗？此操作不可恢复。`,
      success: (res) => {
        if (res.confirm) {
          this.performBatchDelete([orderId])
        }
      }
    })
  },

  // 查看订单详情
  viewOrderDetail: function(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // ==================== 退款管理相关方法 ====================

  // 加载退款数据
  loadRefunds: function() {
    const that = this
    const { refundStatusOptions, refundStatusIndex } = this.data
    const statusFilter = refundStatusOptions[refundStatusIndex].value

    console.log('开始加载退款数据，状态筛选:', statusFilter)

    // 调用云函数获取真实退款数据
    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'getRefundList',
        status: statusFilter || 'all'
      }
    }).then(res => {
      console.log('退款数据加载结果:', res)

      if (res.result && res.result.success) {
        console.log('原始退款数据:', res.result.data)

        // 处理退款数据，添加状态文本和格式化时间
        const refundsWithStatus = res.result.data.map(refund => {
          console.log('处理退款记录:', refund._id, '状态:', refund.status)
          return {
            ...refund,
            statusText: that.getRefundStatusText(refund.status),
            createTime: that.formatTime(refund.applyTime || refund.createTime),
            processTime: refund.reviewTime ? that.formatTime(refund.reviewTime) : null,
            rejectReason: refund.reviewNote || null
          }
        })

        console.log('处理后的退款数据:', refundsWithStatus)

        that.setData({
          refunds: refundsWithStatus,
          loading: false
        })

        console.log('退款数据加载成功，共', refundsWithStatus.length, '条记录')
      } else {
        console.error('退款数据加载失败:', res.result ? res.result.message : '未知错误')

        // 如果云函数调用失败，使用测试数据
        console.log('使用测试数据进行调试')
        const testRefunds = [
          {
            _id: 'test001',
            outRefundNo: 'RF20250108001',
            orderNo: 'T175424818024955743K',
            amount: 4998,
            reason: '行程取消，申请全额退款',
            status: 'pending',
            statusText: '待审核',
            createTime: '2025-01-08 10:30:00',
            processTime: null,
            rejectReason: null
          },
          {
            _id: 'test002',
            outRefundNo: 'RF20250107001',
            orderNo: 'T175424818024955744K',
            amount: 2999,
            reason: '个人原因无法出行',
            status: 'approved',
            statusText: '已通过',
            createTime: '2025-01-07 14:20:00',
            processTime: '2025-01-07 15:30:00',
            rejectReason: null
          }
        ]

        that.setData({
          refunds: testRefunds,
          loading: false
        })

        wx.showToast({
          title: '使用测试数据',
          icon: 'none'
        })
      }
    }).catch(err => {
      console.error('调用退款云函数失败:', err)

      // 网络错误时也使用测试数据
      console.log('网络错误，使用测试数据')
      const testRefunds = [
        {
          _id: 'test001',
          outRefundNo: 'RF20250108001',
          orderNo: 'T175424818024955743K',
          amount: 4998,
          reason: '行程取消，申请全额退款',
          status: 'pending',
          statusText: '待审核',
          createTime: '2025-01-08 10:30:00',
          processTime: null,
          rejectReason: null
        }
      ]

      that.setData({
        refunds: testRefunds,
        loading: false
      })

      wx.showToast({
        title: '网络错误，使用测试数据',
        icon: 'none'
      })
    })
  },

  // 获取退款状态文本
  getRefundStatusText: function(status) {
    const statusMap = {
      'pending': '待审核',
      'approved': '已通过',
      'rejected': '已拒绝',
      'completed': '已完成'
    }
    return statusMap[status] || '未知状态'
  },

  // 格式化时间
  formatTime: function(time) {
    if (!time) return ''

    let date
    if (time instanceof Date) {
      date = time
    } else if (typeof time === 'string') {
      date = new Date(time)
    } else if (time._seconds) {
      // 处理云数据库的时间戳格式
      date = new Date(time._seconds * 1000)
    } else {
      return time.toString()
    }

    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  },

  // 刷新退款数据
  refreshRefunds: function() {
    this.setData({ loading: true })
    this.loadRefunds()
  },

  // 退款状态筛选改变
  onRefundStatusChange: function(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      refundStatusIndex: index,
      loading: true
    })
    this.loadRefunds()
  },

  // 通过退款
  approveRefund: function(e) {
    const refundId = e.currentTarget.dataset.id
    const refund = this.data.refunds.find(r => r._id === refundId)

    wx.showModal({
      title: '确认通过',
      content: `确定通过退款申请 ${refund.refundId} 吗？退款金额：¥${refund.amount}`,
      success: (res) => {
        if (res.confirm) {
          this.updateRefundStatus(refundId, 'approved')
        }
      }
    })
  },

  // 拒绝退款
  rejectRefund: function(e) {
    const refundId = e.currentTarget.dataset.id
    const refund = this.data.refunds.find(r => r._id === refundId)

    wx.showModal({
      title: '拒绝退款',
      content: '请输入拒绝原因',
      editable: true,
      placeholderText: '请输入拒绝原因...',
      success: (res) => {
        if (res.confirm) {
          const rejectReason = res.content.trim()
          if (!rejectReason) {
            wx.showToast({
              title: '请输入拒绝原因',
              icon: 'none'
            })
            return
          }
          this.updateRefundStatus(refundId, 'rejected', rejectReason)
        }
      }
    })
  },

  // 更新退款状态
  updateRefundStatus: function(refundId, status, rejectReason = null) {
    const that = this
    wx.showLoading({ title: '处理中...' })

    console.log('开始审核退款:', { refundId, status, rejectReason })

    // 调用云函数审核退款
    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'reviewRefund',
        refundId: refundId,
        reviewData: {
          approved: status === 'approved',
          reviewerId: this.data.currentOpenid, // 当前管理员ID
          note: rejectReason || (status === 'approved' ? '管理员审核通过' : '管理员审核拒绝')
        }
      }
    }).then(res => {
      wx.hideLoading()
      console.log('退款审核结果:', res)

      if (res.result && res.result.success) {
        wx.showToast({
          title: status === 'approved' ? '退款已通过' : '退款已拒绝',
          icon: 'success'
        })

        // 重新加载退款列表
        that.loadRefunds()

        // 如果是通过审核，还需要处理实际退款
        if (status === 'approved') {
          that.processRefund(refundId)
        }
      } else {
        const errorMsg = res.result ? res.result.message : '审核失败'
        console.error('退款审核失败:', errorMsg)
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('调用审核云函数失败:', err)
      wx.showToast({
        title: '网络错误，请重试',
        icon: 'none'
      })
    })
  },

  // 处理退款（调用微信退款API）
  processRefund: function(refundId) {
    console.log('开始处理退款:', refundId)

    wx.showLoading({ title: '正在退款...' })

    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'processRefund',
        refundId: refundId
      }
    }).then(res => {
      wx.hideLoading()
      console.log('退款处理结果:', res)

      if (res.result && res.result.success) {
        wx.showToast({
          title: '退款处理成功',
          icon: 'success'
        })
        // 重新加载退款列表以更新状态
        this.loadRefunds()
      } else {
        const errorMsg = res.result ? res.result.message : '退款处理失败'
        console.error('退款处理失败:', errorMsg)
        wx.showToast({
          title: errorMsg,
          icon: 'none'
        })
      }
    }).catch(err => {
      wx.hideLoading()
      console.error('调用退款处理云函数失败:', err)
      wx.showToast({
        title: '退款处理失败，请重试',
        icon: 'none'
      })
    })
  },

  // 查看退款详情
  viewRefundDetail: function(e) {
    const refundId = e.currentTarget.dataset.id
    const refund = this.data.refunds.find(r => r._id === refundId)

    if (!refund) {
      wx.showToast({
        title: '退款信息不存在',
        icon: 'none'
      })
      return
    }

    let content = `退款单号：${refund.outRefundNo || refund._id}\n`
    content += `订单号：${refund.orderNo || refund.orderId}\n`
    content += `退款金额：¥${refund.amount}\n`
    content += `退款原因：${refund.reason}\n`
    content += `申请时间：${refund.createTime}\n`
    content += `当前状态：${refund.statusText}\n`

    if (refund.processTime) {
      content += `审核时间：${refund.processTime}\n`
    }

    if (refund.reviewerId) {
      content += `审核员：${refund.reviewerId}\n`
    }

    if (refund.rejectReason) {
      content += `审核备注：${refund.rejectReason}\n`
    }

    if (refund.wechatRefundId) {
      content += `微信退款单号：${refund.wechatRefundId}\n`
    }

    if (refund.refundTime) {
      content += `退款完成时间：${this.formatTime(refund.refundTime)}`
    }

    wx.showModal({
      title: '退款详情',
      content: content,
      showCancel: false,
      confirmText: '确定'
    })
  }
})