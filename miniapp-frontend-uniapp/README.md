# uni-app 项目迁移说明

## 项目结构

```
miniapp-frontend-uniapp/
├── manifest.json       # uni-app 应用配置
├── pages.json          # 页面路由和 tabBar 配置
├── main.js            # 入口文件
├── App.vue            # 应用根组件
├── package.json       # 项目依赖配置
├── utils/
│   └── request.js     # 请求工具（已改为 uni.request）
└── pages/
    ├── index/         # 首页 ✅
    ├── detail/        # 详情页 ✅
    ├── publish/       # 发布页 ✅
    ├── user/          # 用户页 ✅
    ├── orders/        # 订单页 ✅
    ├── message/       # 消息页 ✅
    ├── favorite/      # 收藏页 ✅
    ├── profile/       # 资料页 ✅
    ├── share/         # 分享页 ✅
    ├── manage/        # 管理页 ✅
    └── batch-publish/ # 批量发布页 ✅
```

## 已迁移的页面

✅ **所有页面已完成迁移！**

1. ✅ **首页** (`pages/index/index.vue`)
2. ✅ **详情页** (`pages/detail/detail.vue`)
3. ✅ **发布页** (`pages/publish/publish.vue`)
4. ✅ **用户页** (`pages/user/user.vue`)
5. ✅ **订单页** (`pages/orders/orders.vue`)
6. ✅ **消息页** (`pages/message/message.vue`)
7. ✅ **收藏页** (`pages/favorite/favorite.vue`)
8. ✅ **资料页** (`pages/profile/profile.vue`)
9. ✅ **分享页** (`pages/share/share.vue`)
10. ✅ **管理页** (`pages/manage/manage.vue`)
11. ✅ **批量发布页** (`pages/batch-publish/batch-publish.vue`)

## 主要变化

### API 调用
- `wx.request` → `uni.request`
- `wx.navigateTo` → `uni.navigateTo`
- `wx.switchTab` → `uni.switchTab`
- `wx.showToast` → `uni.showToast`
- `wx.chooseMedia` → `uni.chooseMedia`
- `wx.uploadFile` → `uni.uploadFile`
- `wx.compressImage` → `uni.compressImage`
- `wx.requestPayment` → `uni.requestPayment`

### 模板语法
- `wx:for` → `v-for`
- `wx:if` → `v-if`
- `wx:key` → `:key`
- `bindtap` → `@tap`
- `catchtap` → `@tap.stop`
- `{{}}` → `{{}}` (保持不变)

### 数据绑定
- `this.setData()` → 直接赋值（响应式）
- `this.data.xxx` → `this.xxx`

### 文件结构
- `.wxml` + `.wxss` + `.js` → `.vue` 单文件组件

## 运行方式

1. 安装 HBuilderX IDE
2. 导入项目：`miniapp-frontend-uniapp`
3. 运行到微信小程序（会自动编译）

或使用命令行：
```bash
npm install
npm run dev:mp-weixin
```

## 注意事项

1. 发布按钮位置已设置为 `bottom: 0`，在 uni-app 中应能正确显示
2. 所有 API 调用已改为 `uni.` 前缀
3. 图片压缩功能已迁移（使用 `uni.compressImage`）
4. 全局数据 `app.globalData` 保持不变，可通过 `getApp()` 访问

