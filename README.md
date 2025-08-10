# 跟团游小程序

一个基于微信小程序云开发的跟团游预订平台，提供旅游产品展示、预订、订单管理等功能。

## 功能特性

### 🏠 首页
- 轮播图展示热门旅游目的地
- 产品卡片列表，显示产品图片、价格等信息
- 搜索功能，支持按关键词搜索产品
- 下拉刷新和上拉加载更多

### 🗺️ 区域导航
- 热门区域快速导航
- 按字母排序的全部区域列表
- 支持区域筛选产品

### 📋 我的订单
- 订单状态管理（待付款、已确认、已完成）
- 订单详情查看
- 支付、取消订单等操作
- 订单状态切换

### 🎯 产品详情
- 产品图片轮播展示
- 价格日历，支持成人/儿童价格切换
- 行程安排、费用说明、预订须知
- 日期选择和价格展示

### 📝 预订页面
- 人数选择（成人/儿童）
- 联系人信息填写
- 特殊要求输入
- 费用明细计算
- 订单提交

## 技术架构

- **前端**: 微信小程序原生开发
- **后端**: 微信云开发
- **数据库**: 云数据库
- **存储**: 云存储
- **函数**: 云函数

## 数据库设计

### 集合结构

#### banners (轮播图)
```javascript
{
  id: Number,
  imageUrl: String,
  title: String,
  sort: Number,
  status: String
}
```

#### products (产品)
```javascript
{
  title: String,
  description: String,
  coverImage: String,
  images: Array,
  tags: Array,
  adultPrice: Number,
  childPrice: Number,
  region: String,
  status: String,
  itinerary: Array,
  fees: Array,
  notices: Array,
  createTime: Date
}
```

#### regions (区域)
```javascript
{
  name: String,
  imageUrl: String,
  productCount: Number,
  isHot: Boolean,
  sort: Number,
  status: String
}
```

#### orders (订单)
```javascript
{
  orderNo: String,
  productId: String,
  productTitle: String,
  productImage: String,
  travelDate: String,
  adultCount: Number,
  childCount: Number,
  adultPrice: Number,
  childPrice: Number,
  adultCost: Number,
  childCost: Number,
  totalPrice: Number,
  contactName: String,
  contactPhone: String,
  specialRequirements: String,
  status: String,
  openid: String,
  createTime: Date,
  updateTime: Date
}
```

## 云函数

### getOpenid
获取用户openid，用于用户身份识别

### initDatabase
初始化数据库，创建示例数据

## 安装和部署

1. **克隆项目**
```bash
git clone [项目地址]
```

2. **配置云开发环境**
- 在微信开发者工具中打开项目
- 确保云开发环境ID为：`new-travel-2gy6d6oy7ee5fb0e`

3. **部署云函数**
```bash
# 部署getOpenid云函数
cd cloudfunctions/getOpenid
npm install
# 在微信开发者工具中右键选择"上传并部署"

# 部署initDatabase云函数
cd cloudfunctions/initDatabase
npm install
# 在微信开发者工具中右键选择"上传并部署"
```

4. **初始化数据库**
- 在微信开发者工具中调用`initDatabase`云函数
- 或者在小程序中添加初始化按钮

5. **编译运行**
- 在微信开发者工具中编译项目
- 在模拟器或真机上测试

## 主题色配置

主题色：`#4b6e58`

在`app.wxss`中已配置CSS变量：
```css
--primary-color: #4b6e58;
--primary-light: #6b8e78;
--primary-dark: #2b4e38;
```

## 页面结构

```
miniprogram/
├── pages/
│   ├── index/          # 首页
│   ├── region/         # 区域导航
│   ├── orders/         # 我的订单
│   └── product/
│       ├── detail.js   # 产品详情
│       └── booking.js  # 预订页面
├── components/         # 组件
├── images/            # 图片资源
├── app.js            # 应用入口
├── app.json          # 应用配置
└── app.wxss          # 全局样式
```

## 功能说明

### 搜索功能
- 首页支持按产品标题搜索
- 区域导航支持按区域名称搜索

### 价格日历
- 支持成人/儿童价格切换
- 动态计算不同日期的价格
- 周末价格自动上浮

### 订单管理
- 订单状态：待付款、已确认、已完成、已取消
- 支持订单支付、取消等操作
- 订单列表分页加载

### 数据同步
- 所有数据通过云数据库存储
- 支持实时数据同步
- 用户数据基于openid隔离

## 注意事项

1. **环境配置**
   - 确保云开发环境ID正确配置
   - 检查云函数权限设置

2. **图片资源**
   - 示例中使用Unsplash图片，实际使用需替换为自有图片
   - 建议将图片上传到云存储

3. **支付功能**
   - 当前支付功能为模拟实现
   - 实际使用需接入微信支付

4. **数据安全**
   - 用户数据通过openid隔离
   - 敏感操作需要权限验证

## 扩展功能

可以考虑添加的功能：
- 用户登录注册
- 收藏功能
- 评价系统
- 客服聊天
- 地图导航
- 天气信息
- 优惠券系统

## 联系方式

如有问题或建议，请联系开发团队。

