<template>
  <view class="manage-container">
    <view v-for="item in products" :key="item.id" class="product-item" @tap="goEdit" :data-id="item.id">
      <image class="cover" :src="item.coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
      <view class="info">
        <view class="name">{{ item.name }}</view>
        <view class="price">￥{{ item.price }}</view>
        <view class="status-row">
          <view :class="['status', item.status === 'PUBLISHED' ? 'on' : 'off']">{{ item.status === 'PUBLISHED' ? '已上架' : '已下架' }}</view>
          <view class="toggle-btn" @tap.stop="toggleStatus" :data-id="item.id">{{ item.status === 'PUBLISHED' ? '下架' : '上架' }}</view>
        </view>
      </view>
    </view>
    <view v-if="!products.length" class="empty">暂无发布的商品</view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      products: []
    }
  },
  onLoad() {
    this.loadProducts()
  },
  onShow() {
    this.loadProducts()
  },
  methods: {
    async loadProducts() {
      const res = await request({ url: '/api/my/products' })
      if (res.code === 0) {
        const pageData = res.data.content || res.data || []
        // 处理图片URL
        this.products = pageData.map(item => {
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
        })
      }
    },
    goEdit(e) {
      const id = e.currentTarget.dataset.id
      const app = getApp()
      app.globalData.editingProductId = String(id)
      uni.switchTab({ url: '/pages/publish/publish' })
    },
    async toggleStatus(e) {
      e.stopPropagation()
      const id = e.currentTarget.dataset.id
      const product = this.products.find(p => p.id === id)
      const newStatus = product.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED'
      const res = await request({ url: `/api/my/products/${id}/status?value=${newStatus}`, method: 'PATCH' })
      if (res.code === 0) {
        uni.showToast({ title: newStatus === 'PUBLISHED' ? '已上架' : '已下架' })
        this.loadProducts()
      }
    }
  }
}
</script>

<style scoped>
.manage-container {
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
  margin-bottom: 12rpx;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
}

.status.on {
  background: #e8f5e9;
  color: #4caf50;
}

.status.off {
  background: #ffe0e0;
  color: #f44336;
}

.toggle-btn {
  padding: 8rpx 20rpx;
  background: #f0f0f0;
  color: #666;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.empty {
  text-align: center;
  color: #999;
  padding: 200rpx 0;
  font-size: 32rpx;
}
</style>

