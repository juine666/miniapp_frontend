<template>
  <view class="container" @tap="goToDetail">
    <view class="share-card">
      <view class="image-wrapper">
        <image v-if="product.coverUrl" mode="aspectFill" :src="product.coverUrl" class="product-image"/>
        <image v-else mode="aspectFill" src="https://img.yzcdn.cn/vant/cat.jpeg" class="product-image"/>
        <view v-if="product.price" class="price-tag">
          <text class="price-symbol">￥</text>
          <text class="price-value">{{ product.price }}</text>
        </view>
      </view>
      
      <view class="info-section">
        <view class="product-name">{{ product.name }}</view>
        <view v-if="product.description" class="product-desc">{{ product.description }}</view>
        <view v-else class="product-desc placeholder">暂无商品描述</view>
      </view>
      
      <view class="tip-section">
        <text class="tip-icon">👆</text>
        <text class="tip-text">点击查看商品详情</text>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      productId: null,
      product: {}
    }
  },
  async onLoad(query) {
    const productId = query.productId || query.id
    if (!productId) {
      uni.showToast({ title: '商品ID无效', icon: 'none' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
      return
    }
    
    this.productId = productId
    await this.loadProduct(productId)
  },
  methods: {
    async loadProduct(productId) {
      try {
        uni.showLoading({ title: '加载中...' })
        const res = await request({ url: `/api/products/${productId}` })
        uni.hideLoading()
        
        if (res.code === 0 && res.data) {
          const data = res.data
          const product = {
            id: data.id || productId,
            name: data.name || '商品',
            description: data.description || '',
            coverUrl: data.coverUrl || data.cover_url || '',
            price: data.price ? (typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0) : 0
          }
          if (product.price) {
            product.price = parseFloat(product.price).toFixed(2)
          }
          this.product = product
        } else {
          uni.showToast({ title: '商品不存在', icon: 'none' })
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      } catch (e) {
        uni.hideLoading()
        console.error('加载商品失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    goToDetail() {
      if (this.productId) {
        uni.navigateTo({
          url: `/pages/detail/detail?id=${this.productId}`
        })
      }
    }
  }
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: #f6f6f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.share-card {
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.1);
  max-width: 600rpx;
}

.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #f0f0f0;
}

.product-image {
  width: 100%;
  height: 100%;
}

.price-tag {
  position: absolute;
  bottom: 24rpx;
  right: 24rpx;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: baseline;
}

.price-symbol {
  font-size: 28rpx;
  margin-right: 4rpx;
}

.price-value {
  font-size: 40rpx;
  font-weight: bold;
}

.info-section {
  padding: 32rpx;
}

.product-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
  line-height: 1.5;
}

.product-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.product-desc.placeholder {
  color: #bbb;
}

.tip-section {
  padding: 24rpx 32rpx;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}

.tip-icon {
  font-size: 32rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #999;
}
</style>

