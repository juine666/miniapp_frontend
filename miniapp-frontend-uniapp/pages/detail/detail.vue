<template>
  <view class="container">
    <!-- 加载中状态 -->
    <view v-if="loading" class="loading-container">
      <text>加载中...</text>
    </view>
    
    <!-- 商品内容（始终显示，即使加载失败也显示默认内容） -->
    <!-- 商品图片区域 -->
    <view class="image-section">
      <!-- 多张图片轮播 -->
      <swiper v-if="imageList.length > 0" class="image-swiper" :indicator-dots="imageList.length > 1" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff" :autoplay="false" :circular="false" @change="onSwiperChange">
        <swiper-item v-for="(img, index) in imageList" :key="index">
          <image mode="aspectFill" :src="img" class="main-image" @tap="previewImage" :data-index="index"/>
        </swiper-item>
      </swiper>
      <!-- 单张图片或默认图片 -->
      <image v-else-if="item.coverUrl" mode="aspectFill" :src="item.coverUrl" class="main-image" @tap="previewImage" data-index="0"/>
      <image v-else mode="aspectFill" src="https://img.yzcdn.cn/vant/cat.jpeg" class="main-image"/>
      <view :class="['favorite-btn', isFavorited ? 'favorited' : '']" @tap.stop="toggleFavorite">
        <text class="favorite-icon">{{ isFavorited ? '❤️' : '🤍' }}</text>
      </view>
      <!-- 图片数量指示器 -->
      <view v-if="imageList.length > 1" class="image-indicator">{{ currentImageIndex + 1 }}/{{ imageList.length }}</view>
    </view>

    <!-- 价格和标题 -->
    <view class="price-section">
      <view class="price">￥<text class="price-main">{{ item.price || 0 }}</text></view>
      <view class="title">{{ item.name || '商品名称' }}</view>
    </view>

    <!-- 商品信息卡片 -->
    <view class="info-card">
      <view v-if="item.description" class="info-row">
        <view class="info-label">商品描述</view>
        <view class="info-value">{{ item.description }}</view>
      </view>
      <view class="info-row">
        <view class="info-label">分类</view>
        <view class="info-value">{{ categoryName || '未分类' }}</view>
      </view>
      <view class="info-row">
        <view class="info-label">发布时间</view>
        <view class="info-value">{{ item.createdAt || '刚刚' }}</view>
      </view>
      <view class="info-row">
        <view class="info-label">状态</view>
        <view :class="['status-badge', item.status === 'PUBLISHED' ? 'online' : 'offline']">
          {{ item.status === 'PUBLISHED' ? '在售' : '已下架' }}
        </view>
      </view>
    </view>

    <!-- 卖家信息卡片 -->
    <view class="seller-card">
      <view class="seller-header">
        <image class="seller-avatar" :src="sellerInfo.avatarUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
        <view class="seller-info">
          <view class="seller-name">{{ sellerInfo.nickname || '卖家' }}</view>
          <view class="seller-tag">个人卖家</view>
        </view>
        <view class="chat-btn-mini" @tap.stop="onChat">
          <text class="chat-icon">💬</text>
          <text>联系</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏（固定） -->
    <view class="bottom-bar">
      <view class="bar-action" @tap.stop="toggleFavorite">
        <text class="action-icon">{{ isFavorited ? '❤️' : '🤍' }}</text>
        <text class="action-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="bar-action" @tap.stop="onShare">
        <text class="action-icon">📤</text>
        <text class="action-text">分享</text>
      </view>
      <button class="bar-btn chat" @tap="onChat" hover-class="bar-btn-hover">聊一聊</button>
      <button class="bar-btn buy" @tap="onBuy" hover-class="bar-btn-hover">我想要</button>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      id: null,
      item: {},
      isFavorited: false,
      sellerInfo: { nickname: '卖家', avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      categoryName: '未分类',
      loading: false,
      imageList: [],
      currentImageIndex: 0
    }
  },
  onLoad(query) {
    console.log('详情页onLoad，query:', query)
    const id = query.id || query.productId
    if (!id) {
      uni.showToast({ title: '商品ID不存在', icon: 'none' })
      console.error('详情页缺少商品ID，query:', query)
      return
    }
    
    console.log('详情页商品ID:', id, '类型:', typeof id)
    this.id = String(id)
    this.loadDetail()
    this.checkFavorite()
  },
  methods: {
    async loadDetail() {
      const id = this.id
      if (!id) {
        uni.showToast({ title: '商品ID不存在', icon: 'none' })
        console.error('loadDetail: 商品ID不存在')
        return
      }
      
      console.log('开始加载商品详情，ID:', id)
      
      try {
        this.loading = true
        uni.showLoading({ title: '加载中...' })
        
        const res = await request({ url: `/api/products/${id}` })
        console.log('详情页API响应:', res)
        
        if (res.code === 0 && res.data) {
          const data = res.data
          
          // 处理图片列表
          let imageList = []
          if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
            imageList = data.imageUrls
          } else if (data.coverUrl) {
            try {
              if (typeof data.coverUrl === 'string' && data.coverUrl.startsWith('[')) {
                imageList = JSON.parse(data.coverUrl)
              } else {
                imageList = [data.coverUrl]
              }
            } catch (e) {
              imageList = [data.coverUrl]
            }
          }
          
          // 设置商品信息
          this.item = {
            id: data.id,
            name: data.name || '商品名称',
            description: data.description || '',
            price: data.price || 0,
            coverUrl: imageList.length > 0 ? imageList[0] : '',
            categoryId: data.categoryId,
            sellerId: data.sellerId,
            status: data.status || 'PUBLISHED',
            createdAt: data.createdAt
          }
          this.imageList = imageList
          this.currentImageIndex = 0
          
          // 设置卖家信息
          if (data.seller) {
            this.sellerInfo = data.seller
          } else if (data.sellerId) {
            await this.loadSellerInfo(data.sellerId)
          } else {
            this.sellerInfo = { nickname: '卖家', avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg' }
          }
          
          // 设置分类名称
          if (data.categoryName) {
            this.categoryName = data.categoryName
          } else if (data.categoryId) {
            await this.loadCategoryInfo(data.categoryId)
          } else {
            this.categoryName = '未分类'
          }
          
          // 格式化时间
          if (data.createdAt) {
            this.formatTime(data.createdAt)
          } else {
            this.item.createdAt = '刚刚'
          }
          
          this.loading = false
        } else {
          console.error('详情页加载失败，响应:', res)
          uni.showToast({ title: res.message || '加载失败', icon: 'none', duration: 3000 })
          this.loading = false
          this.item = {
            name: res.message || '加载失败',
            price: 0,
            description: '请稍后重试',
            status: 'OFFLINE'
          }
        }
      } catch (e) {
        console.error('加载商品详情异常:', e)
        uni.showToast({ title: '加载失败，请重试: ' + (e.message || '未知错误'), icon: 'none', duration: 3000 })
        this.loading = false
        this.item = {
          name: '加载失败',
          price: 0,
          description: e.message || '请稍后重试',
          status: 'OFFLINE'
        }
      } finally {
        uni.hideLoading()
      }
    },
    async loadSellerInfo(sellerId) {
      try {
        // 后端已返回seller信息，这里可以留空或添加补充逻辑
      } catch (e) {
        console.error('加载卖家信息失败', e)
      }
    },
    async loadCategoryInfo(categoryId) {
      try {
        const res = await request({ url: `/api/categories` })
        if (res.code === 0) {
          const category = (res.data || []).find(c => c.id === categoryId)
          if (category) {
            this.categoryName = category.name
          }
        }
      } catch (e) {
        console.error('加载分类信息失败', e)
      }
    },
    onSwiperChange(e) {
      this.currentImageIndex = e.detail.current
    },
    previewImage(e) {
      const index = e.currentTarget.dataset.index || 0
      const urls = this.imageList
      if (urls && urls.length > 0) {
        uni.previewImage({
          current: urls[index],
          urls: urls
        })
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return
      try {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp))
        if (isNaN(date.getTime())) return
        
        const now = new Date()
        const diff = now - date
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        
        let timeStr = ''
        if (days === 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60))
            timeStr = minutes <= 0 ? '刚刚' : `${minutes}分钟前`
          } else {
            timeStr = `${hours}小时前`
          }
        } else if (days < 7) {
          timeStr = `${days}天前`
        } else if (days < 30) {
          timeStr = `${days}天前`
        } else {
          const month = date.getMonth() + 1
          const day = date.getDate()
          timeStr = `${month}月${day}日`
        }
        
        this.item.createdAt = timeStr
      } catch (e) {
        console.error('格式化时间失败', e)
      }
    },
    async checkFavorite() {
      try {
        const res = await request({ url: `/api/favorites/${this.id}/check` })
        if (res.code === 0) {
          this.isFavorited = res.data
        }
      } catch (e) {
        // 忽略错误
      }
    },
    async toggleFavorite() {
      const { id, isFavorited } = this
      try {
        if (isFavorited) {
          await request({ url: `/api/favorites/${id}`, method: 'DELETE' })
          uni.showToast({ title: '已取消收藏', icon: 'none' })
        } else {
          await request({ url: `/api/favorites/${id}`, method: 'POST' })
          uni.showToast({ title: '已收藏', icon: 'none' })
        }
        this.isFavorited = !isFavorited
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    async onBuy() {
      console.log('点击我想要按钮，商品ID:', this.id)
      
      if (!this.id) {
        uni.showToast({ title: '商品信息不完整', icon: 'none' })
        return
      }
      
      try {
        uni.showLoading({ title: '创建订单中...' })
        
        const create = await request({
          url: '/api/orders',
          method: 'POST',
          data: { productId: this.id, quantity: 1 }
        })
        
        uni.hideLoading()
        
        if (create.code === 0 && create.data) {
          const orderId = create.data.id
          console.log('订单创建成功，订单ID:', orderId)
          
          uni.showLoading({ title: '发起支付中...' })
          const pay = await request({
            url: `/api/orders/${orderId}/pay`,
            method: 'POST'
          })
          uni.hideLoading()
          
          if (pay.code === 0 && pay.data) {
            const p = pay.data
            
            // 检测是否为模拟支付模式
            const isMockMode = p._mockMode === 'true' ||
              (p.paySign && p.paySign.startsWith('mock_')) ||
              (p.package && p.package.startsWith('prepay_id=mock_'))
            
            if (isMockMode) {
              console.log('检测到模拟支付模式，跳过真实支付流程')
              uni.showToast({ title: '模拟支付成功', icon: 'success' })
              
              try {
                await request({
                  url: `/api/orders/${orderId}/confirm-pay`,
                  method: 'POST'
                })
                console.log('订单状态已更新为已支付')
              } catch (confirmError) {
                console.error('更新订单状态失败', confirmError)
                uni.showToast({ title: '更新订单状态失败', icon: 'none' })
              }
              
              setTimeout(() => {
                uni.switchTab({ url: '/pages/orders/orders' })
              }, 1500)
            } else {
              // 真实支付模式
              uni.requestPayment({
                timeStamp: p.timeStamp,
                nonceStr: p.nonceStr,
                package: p.package,
                signType: p.signType,
                paySign: p.paySign,
                success: async () => {
                  uni.showToast({ title: '支付成功', icon: 'success' })
                  
                  try {
                    await request({
                      url: `/api/orders/${orderId}/confirm-pay`,
                      method: 'POST'
                    })
                    console.log('订单状态已更新为已支付')
                  } catch (confirmError) {
                    console.error('更新订单状态失败', confirmError)
                  }
                  
                  setTimeout(() => {
                    uni.switchTab({ url: '/pages/orders/orders' })
                  }, 1500)
                },
                fail: (err) => {
                  console.error('支付失败', err)
                  if (err.errMsg && err.errMsg.includes('cancel')) {
                    uni.showToast({ title: '支付已取消', icon: 'none' })
                  } else {
                    uni.showToast({ title: '支付失败', icon: 'none' })
                  }
                }
              })
            }
          } else {
            uni.showToast({
              title: pay.message || '获取支付信息失败',
              icon: 'none'
            })
          }
        } else {
          uni.showToast({
            title: create.message || '创建订单失败',
            icon: 'none'
          })
        }
      } catch (e) {
        uni.hideLoading()
        console.error('创建订单异常', e)
        uni.showToast({
          title: e.message || '操作失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    },
    async onChat() {
      console.log('点击聊天按钮', {
        id: this.id,
        sellerId: this.item.sellerId,
        item: this.item
      })
      
      const { id, item } = this
      
      if (!item.sellerId) {
        uni.showToast({ title: '卖家信息不完整', icon: 'none' })
        console.error('卖家ID不存在', item)
        return
      }
      
      if (!id) {
        uni.showToast({ title: '商品信息不完整', icon: 'none' })
        return
      }
      
      try {
        const url = `/pages/message/message?userId=${item.sellerId}&productId=${id}&productName=${encodeURIComponent(item.name || '商品')}`
        console.log('准备跳转到聊天页面:', url)
        
        uni.navigateTo({
          url: url,
          success: () => {
            console.log('跳转成功')
          },
          fail: (err) => {
            console.error('跳转失败', err)
            uni.showToast({ title: '跳转失败', icon: 'none' })
          }
        })
      } catch (e) {
        console.error('聊天按钮异常', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    onShare() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    },
    onShareAppMessage() {
      return {
        title: this.item.name || '分享商品',
        path: `/pages/share/share?productId=${this.id}`,
        imageUrl: this.item.coverUrl || ''
      }
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f6f6f6;
  padding-bottom: 120rpx;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 32rpx;
  color: #999;
}

.image-section {
  position: relative;
  width: 100%;
  background: #fff;
  margin-bottom: 20rpx;
}
.image-swiper {
  width: 100%;
  height: 750rpx;
}
.main-image {
  width: 100%;
  height: 750rpx;
  display: block;
}
.image-indicator {
  position: absolute;
  bottom: 24rpx;
  right: 24rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  z-index: 5;
}
.favorite-btn {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
  z-index: 10;
}
.favorite-icon {
  font-size: 44rpx;
}

.price-section {
  background: #fff;
  padding: 32rpx 24rpx;
  margin-bottom: 20rpx;
}
.price {
  font-size: 48rpx;
  color: #ff4757;
  font-weight: bold;
  margin-bottom: 20rpx;
}
.price-main {
  font-size: 56rpx;
}
.title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  line-height: 1.6;
}

.info-card {
  background: #fff;
  padding: 32rpx 24rpx;
  margin-bottom: 20rpx;
}
.info-row {
  display: flex;
  align-items: flex-start;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.info-row:last-child {
  border-bottom: none;
}
.info-label {
  width: 160rpx;
  font-size: 28rpx;
  color: #999;
  flex-shrink: 0;
}
.info-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
}
.status-badge {
  display: inline-block;
  padding: 6rpx 20rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
}
.status-badge.online {
  background: #e8f5e9;
  color: #4caf50;
}
.status-badge.offline {
  background: #ffe0e0;
  color: #f44336;
}

.seller-card {
  background: #fff;
  padding: 32rpx 24rpx;
  margin-bottom: 20rpx;
}
.seller-header {
  display: flex;
  align-items: center;
}
.seller-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  margin-right: 20rpx;
}
.seller-info {
  flex: 1;
}
.seller-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}
.seller-tag {
  display: inline-block;
  padding: 4rpx 12rpx;
  background: #f0f0f0;
  color: #666;
  font-size: 22rpx;
  border-radius: 4rpx;
}
.chat-btn-mini {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: #f0f0f0;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666;
}
.chat-icon {
  font-size: 28rpx;
  margin-right: 6rpx;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  z-index: 100;
}
.bar-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 40rpx;
  min-width: 80rpx;
}
.action-icon {
  font-size: 44rpx;
  margin-bottom: 6rpx;
}
.action-text {
  font-size: 22rpx;
  color: #666;
}
.bar-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  margin-left: 20rpx;
  position: relative;
  z-index: 10;
}

.bar-btn-hover {
  opacity: 0.8;
}

.bar-btn.chat {
  background: #fff;
  color: #fcc822;
  border: 2rpx solid #fcc822;
}

.bar-btn.buy {
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
}
</style>

