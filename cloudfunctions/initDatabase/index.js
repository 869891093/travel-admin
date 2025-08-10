// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: 'new-travel-2gy6d6oy7ee5fb0e'
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    // 创建轮播图数据
    const banners = [
      {
        _id: 'banner_001',  // 改为 _id
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        title: '美丽的海滩度假',
        desc: '享受阳光沙滩的美好时光',  // 添加描述字段
        sort: 1,
        status: 'active'
      },
      {
        _id: 'banner_002',  // 改为 _id
        imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
        title: '山间徒步旅行',
        desc: '探索大自然的奥秘',  // 添加描述字段
        sort: 2,
        status: 'active'
      },
      {
        _id: 'banner_003',  // 改为 _id
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        title: '森林探险之旅',
        desc: '感受森林的宁静与神秘',  // 添加描述字段
        sort: 3,
        status: 'active'
      }
    ]

    // 创建产品数据 - 新增detailImages字段
    const products = [
      {
        _id: 'product_001',
        title: '三亚5日4晚双飞游',
        description: '享受阳光、沙滩、海浪，体验热带风情，包含天涯海角、南山寺、亚龙湾等经典景点',
        coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        images: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800'
        ],
        // 新增：详情图片
        detailImages: [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
        ],
        tags: ['热门', '海滨', '度假'],
        adultPrice: 2999,
        childPrice: 1999,
        region: '海南',
        status: 'active',
        itinerary: [
          { day: 1, content: '抵达三亚，入住酒店，自由活动' },
          { day: 2, content: '天涯海角景区，南山文化旅游区' },
          { day: 3, content: '亚龙湾海滩，大东海' },
          { day: 4, content: '蜈支洲岛一日游' },
          { day: 5, content: '自由活动，返程' }
        ],
        fees: [
          { type: '包含', description: '往返机票、酒店住宿、景点门票、导游服务' },
          { type: '不包含', description: '个人消费、餐饮、保险' }
        ],
        notices: [
          '请携带有效身份证件',
          '建议提前3天预订',
          '儿童需有成人陪同',
          '特殊天气可能影响行程'
        ],
        createTime: new Date()
      },
      {
        _id: 'product_002',
        title: '张家界森林公园3日游',
        description: '探秘世界自然遗产，体验玻璃栈道，欣赏奇峰异石，感受大自然的鬼斧神工',
        coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        images: [
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800'
        ],
        // 新增：详情图片
        detailImages: [
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop'
        ],
        tags: ['自然', '探险', '玻璃栈道'],
        adultPrice: 1899,
        childPrice: 1299,
        region: '湖南',
        status: 'active',
        itinerary: [
          { day: 1, content: '抵达张家界，游览天门山' },
          { day: 2, content: '张家界国家森林公园，袁家界' },
          { day: 3, content: '黄龙洞，返程' }
        ],
        fees: [
          { type: '包含', description: '景点门票、住宿、导游服务' },
          { type: '不包含', description: '往返交通、餐饮、个人消费' }
        ],
        notices: [
          '玻璃栈道有身高限制',
          '建议穿舒适运动鞋',
          '景区内消费较高',
          '注意安全，遵守景区规定'
        ],
        createTime: new Date()
      },
      {
        _id: 'product_003',
        title: '丽江古城4日游',
        description: '漫步古城街巷，感受纳西文化，体验高原风情，包含玉龙雪山、束河古镇等景点',
        coverImage: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
        images: [
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800'
        ],
        // 新增：详情图片
        detailImages: [
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&h=600&fit=crop'
        ],
        tags: ['古城', '文化', '高原'],
        adultPrice: 2499,
        childPrice: 1699,
        region: '云南',
        status: 'active',
        itinerary: [
          { day: 1, content: '抵达丽江，游览古城' },
          { day: 2, content: '玉龙雪山，蓝月谷' },
          { day: 3, content: '束河古镇，黑龙潭' },
          { day: 4, content: '自由活动，返程' }
        ],
        fees: [
          { type: '包含', description: '景点门票、住宿、导游服务' },
          { type: '不包含', description: '往返交通、餐饮、个人消费' }
        ],
        notices: [
          '高原地区注意适应',
          '古城内消费较高',
          '建议购买旅游保险',
          '尊重当地文化习俗'
        ],
        createTime: new Date()
      }
    ]

    // 创建区域数据
    const regions = [
      { _id: 'region_001', name: '海南', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200', productCount: 5, isHot: true, sort: 1, status: 'active' },
      { _id: 'region_002', name: '云南', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200', productCount: 8, isHot: true, sort: 2, status: 'active' },
      { _id: 'region_003', name: '湖南', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200', productCount: 3, isHot: true, sort: 3, status: 'active' },
      { _id: 'region_004', name: '四川', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200', productCount: 6, isHot: false, sort: 4, status: 'active' },
      { _id: 'region_005', name: '西藏', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200', productCount: 4, isHot: false, sort: 5, status: 'active' },
      { _id: 'region_006', name: '新疆', imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=200', productCount: 3, isHot: false, sort: 6, status: 'active' },
      { _id: 'region_007', name: '北京', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200', productCount: 7, isHot: false, sort: 7, status: 'active' },
      { _id: 'region_008', name: '上海', imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=200', productCount: 5, isHot: false, sort: 8, status: 'active' }
    ]

    // 创建测试订单数据
    const testOrders = [
      {
        _id: 'order_test_001',
        orderNo: 'TEST20240101001',
        productId: 'product_001',
        productTitle: '三亚5日4晚双飞游',
        productImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        travelDate: '2024-02-15',
        adultCount: 2,
        childCount: 1,
        adultPrice: 2999,
        childPrice: 1999,
        totalPrice: 7997,
        contactName: '张三',
        contactPhone: '13800138000',
        specialRequirements: '需要安排接机服务',
        status: 'paid',
        openid: 'test_openid_123',
        createTime: new Date('2024-01-01T10:00:00Z'),
        paymentTime: new Date('2024-01-01T10:30:00Z'),
        updateTime: new Date('2024-01-01T10:30:00Z'),
        isDeleted: false
      },
      {
        _id: 'order_test_002',
        orderNo: 'TEST20240101002',
        productId: 'product_002',
        productTitle: '张家界森林公园3日游',
        productImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        travelDate: '2024-03-20',
        adultCount: 1,
        childCount: 0,
        adultPrice: 1899,
        childPrice: 1299,
        totalPrice: 1899,
        contactName: '李四',
        contactPhone: '13900139000',
        specialRequirements: '',
        status: 'cancelled',
        openid: 'test_openid_123',
        createTime: new Date('2024-01-01T11:00:00Z'),
        updateTime: new Date('2024-01-01T12:00:00Z'),
        isDeleted: false
      }
    ]

    // 批量插入数据
    const results = {
      banners: [],
      products: [],
      regions: [],
      orders: [] // 新增orders数组
    }

    // 插入轮播图
    for (const banner of banners) {
      try {
        const result = await db.collection('banners').add({ data: banner })
        results.banners.push(result)
      } catch (err) {
        console.log('轮播图已存在或插入失败:', err)
      }
    }

    // 插入产品
    for (const product of products) {
      try {
        const result = await db.collection('products').add({ data: product })
        results.products.push(result)
      } catch (err) {
        console.log('产品已存在或插入失败:', err)
      }
    }

    // 插入区域
    for (const region of regions) {
      try {
        const result = await db.collection('regions').add({ data: region })
        results.regions.push(result)
      } catch (err) {
        console.log('区域已存在或插入失败:', err)
      }
    }

    // 插入测试订单
    for (const order of testOrders) {
      try {
        const result = await db.collection('orders').add({ data: order })
        results.orders.push(result)
      } catch (err) {
        console.log('订单已存在或插入失败:', err)
      }
    }

    return {
      success: true,
      message: '数据库初始化成功',
      results: results
    }

  } catch (error) {
    console.error('数据库初始化失败:', error)
    return {
      success: false,
      message: '数据库初始化失败',
      error: error
    }
  }
} 