<template>
  <view class="favorite-container">
    <view v-for="item in products" :key="item.id" class="product-item" @tap="onTapProduct" :data-id="item.id">
      <image class="cover" :src="item.coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
      <view class="info">
        <view class="name">{{ item.name }}</view>
        <view class="price">￥{{ item.price }}</view>
      </view>
    </view>
    <view v-if="!products.length" class="empty">暂无收藏</view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      products: [],
      page: 0,
      size: 20,
      hasMore: true,
      loading: false
    }
  },
  onLoad() {
    this.loadFavorites()
  },
  onShow() {
    this.loadFavorites()
  },
  methods: {
    async loadFavorites() {
      if (this.loading) return
      this.loading = true
      
      try {
        const res = await request({ url: `/api/favorites?page=${this.page}&size=${this.size}` })
        if (res.code === 0) {
          const pageData = res.data.content || res.data || []
          
          // 处理图片URL
          const validData = pageData.map(item => {
            let coverUrl = item.coverUrl || ''
            if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
              try {
                const imageUrls = JSON.parse(coverUrl)
                if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                  coverUrl = imageUrls[0]
                }
              } catch (e) {}
            }
            return {
              ...item,
              coverUrl: coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'
            }
          }).filter(item => item && item.id)
          
          // 去重
          const existingIds = new Set(this.products.map(p => p.id))
          const newItems = validData.filter(item => !existingIds.has(item.id))
          this.products = [...this.products, ...newItems]
          
          this.hasMore = res.data.hasNext !== false && pageData.length === this.size
          this.page += 1
        } else {
          uni.showToast({ title: res.message || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载收藏失败', e)
        uni.showToast({ title: '加载失败，请重试', icon: 'none' })
      } finally {
        this.loading = false
      }
    },
    onTapProduct(e) {
      const id = e.currentTarget.dataset.id
      uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
    },
    onReachBottom() {
      if (this.hasMore && !this.loading) {
        this.loadFavorites()
      }
    }
  }
}
</script>

<style scoped>
.favorite-container {
  background: #f6f6f6;
  min-height: 100vh;
  padding: 20rpx;
}

.product-item {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 20rpx;
  display: flex;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.cover {
  width: 200rpx;
  height: 200rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.info {
  flex: 1;
  padding-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.price {
  font-size: 36rpx;
  color: #ff4757;
  font-weight: bold;
}

.empty {
  text-align: center;
  color: #999;
  padding: 200rpx 0;
  font-size: 32rpx;
}
</style>

