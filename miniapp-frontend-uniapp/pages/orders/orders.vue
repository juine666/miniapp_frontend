<template>
  <view class="container">
    <!-- 订单列表 -->
    <view v-for="item in list" :key="item.id" class="order-card">
      <!-- 订单头部 -->
      <view class="order-header">
        <view class="order-id">订单号：{{ item.id }}</view>
        <view :class="['order-status', item.status]">{{ item.statusText }}</view>
      </view>
      
      <!-- 商品信息 -->
      <view v-if="item.product" class="order-product" @tap.stop="goToDetail" :data-id="item.product.id">
        <image class="product-img" :src="item.product.coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
        <view class="product-info">
          <view class="product-name">{{ item.product.name || '商品已下架' }}</view>
          <view class="product-meta">
            <text class="product-price">￥{{ item.product.price || item.totalAmount }}</text>
            <text class="product-date">{{ item.formattedDate }}</text>
          </view>
        </view>
        <view class="arrow">›</view>
      </view>
      
      <!-- 订单底部 -->
      <view class="order-footer">
        <view class="order-amount">
          <text class="amount-label">实付：</text>
          <text class="amount-value">￥{{ item.totalAmount }}</text>
        </view>
        <view class="order-actions">
          <view v-if="item.status === 'CREATED'" class="action-btn pay-btn" @tap.stop="handlePay" :data-id="item.id">立即支付</view>
          <view v-if="item.status === 'PAID' || item.status === 'SHIPPED'" class="action-btn detail-btn" @tap.stop="handleDetail" :data-id="item.id">查看详情</view>
          <view v-if="item.status === 'COMPLETED'" class="action-btn review-btn" @tap.stop="handleReview" :data-id="item.id">评价</view>
        </view>
      </view>
    </view>
    
    <!-- 空状态 -->
    <view v-if="!list.length && !loading" class="empty-state">
      <image class="empty-icon" src="https://img.yzcdn.cn/vant/cat.jpeg" mode="aspectFit"/>
      <view class="empty-text">暂无订单</view>
      <view class="empty-desc">快去逛逛，发现好物吧~</view>
      <button class="empty-btn" @tap="goShopping">去逛逛</button>
    </view>
    
    <!-- 加载更多 -->
    <view v-if="loading" class="loading">
      <text>加载中...</text>
    </view>
    <view v-if="!hasMore && list.length > 0" class="no-more">
      <text>没有更多了</text>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      list: [],
      page: 0,
      size: 20,
      hasMore: true,
      loading: false
    }
  },
  onLoad() {
    this.resetAndLoad()
  },
  async onShow() {
    this.resetAndLoad()
  },
  methods: {
    resetAndLoad() {
      this.list = []
      this.page = 0
      this.hasMore = true
      this.loadOrders(true)
    },
    async loadOrders(reset = false) {
      if (this.loading || (!this.hasMore && !reset)) return
      this.loading = true
      
      try {
        const page = reset ? 0 : this.page
        const res = await request({ url: `/api/orders?page=${page}&size=${this.size}` })
        if (res.code === 0 && res.data) {
          const pageData = res.data.content || res.data || []
          const newList = pageData.map(order => {
            const statusMap = {
              'CREATED': '待支付',
              'PAID': '已支付',
              'SHIPPED': '已发货',
              'COMPLETED': '已完成',
              'CANCELLED': '已取消'
            }
            return {
              ...order,
              statusText: statusMap[order.status] || order.status,
              formattedDate: this.formatTime(order.createdAt)
            }
          })
          
          let list
          if (reset) {
            list = newList
          } else {
            const existingIds = new Set(this.list.map(o => o.id))
            const newItems = newList.filter(order => !existingIds.has(order.id))
            list = [...this.list, ...newItems]
          }
          
          const hasMore = res.data.hasNext !== false && newList.length === this.size
          this.list = list
          this.page = page + 1
          this.hasMore = hasMore
          this.loading = false
        } else {
          this.loading = false
          if (res.message) {
            uni.showToast({ title: res.message, icon: 'none' })
          }
        }
      } catch (e) {
        console.error('加载订单失败', e)
        this.loading = false
        uni.showToast({ title: '加载失败，请重试', icon: 'none' })
      }
    },
    formatTime(timestamp) {
      if (!timestamp) return '刚刚'
      try {
        const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp))
        if (isNaN(date.getTime())) return '刚刚'
        
        const now = new Date()
        const diff = now - date
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        
        if (days === 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60))
            return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
          }
          return `${hours}小时前`
        } else if (days < 7) {
          return `${days}天前`
        } else {
          const month = date.getMonth() + 1
          const day = date.getDate()
          return `${month}月${day}日`
        }
      } catch (e) {
        return '刚刚'
      }
    },
    async onPullDownRefresh() {
      await this.resetAndLoad()
      uni.stopPullDownRefresh()
    },
    onReachBottom() {
      if (this.hasMore && !this.loading) {
        this.loadOrders()
      }
    },
    goToDetail(e) {
      const id = e.currentTarget.dataset.id
      if (id) {
        uni.navigateTo({
          url: `/pages/detail/detail?id=${id}`
        })
      }
    },
    async handlePay(e) {
      const orderId = e.currentTarget.dataset.id
      if (!orderId) return
      
      try {
        uni.showLoading({ title: '发起支付中...' })
        const payRes = await request({
          url: `/api/orders/${orderId}/pay`,
          method: 'POST'
        })
        uni.hideLoading()
        
        if (payRes.code === 0 && payRes.data) {
          const p = payRes.data
          
          // 检测是否为模拟支付模式
          const isMockMode = p._mockMode === 'true' ||
            (p.paySign && p.paySign.startsWith('mock_')) ||
            (p.package && p.package.startsWith('prepay_id=mock_'))
          
          if (isMockMode) {
            uni.showToast({ title: '模拟支付成功', icon: 'success' })
            
            try {
              await request({
                url: `/api/orders/${orderId}/confirm-pay`,
                method: 'POST'
              })
            } catch (confirmError) {
              console.error('更新订单状态失败', confirmError)
            }
            
            setTimeout(() => {
              this.resetAndLoad()
            }, 1000)
          } else {
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
                } catch (confirmError) {
                  console.error('更新订单状态失败', confirmError)
                }
                
                setTimeout(() => {
                  this.resetAndLoad()
                }, 1000)
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
            title: payRes.message || '获取支付信息失败',
            icon: 'none'
          })
        }
      } catch (e) {
        uni.hideLoading()
        console.error('支付处理失败', e)
        uni.showToast({ title: '操作失败，请重试', icon: 'none' })
      }
    },
    handleDetail(e) {
      const id = e.currentTarget.dataset.id
      if (id) {
        uni.navigateTo({
          url: `/pages/detail/detail?id=${id}`
        })
      }
    },
    handleReview(e) {
      const id = e.currentTarget.dataset.id
      uni.showToast({ title: '评价功能开发中', icon: 'none' })
    },
    goShopping() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.container {
  background: #f6f6f6;
  min-height: 100vh;
  padding: 20rpx;
}

.order-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  margin-bottom: 20rpx;
}

.order-id {
  font-size: 26rpx;
  color: #999;
}

.order-status {
  font-size: 26rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

.order-status.CREATED {
  color: #ff4757;
  background: #ffe0e0;
}

.order-status.PAID {
  color: #4caf50;
  background: #e8f5e9;
}

.order-status.COMPLETED {
  color: #4caf50;
  background: #e8f5e9;
}

.order-product {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 16rpx;
  background: #fafafa;
  border-radius: 12rpx;
}

.product-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  margin-left: 20rpx;
}

.product-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 32rpx;
  color: #ff4757;
  font-weight: bold;
}

.product-date {
  font-size: 24rpx;
  color: #999;
}

.arrow {
  font-size: 40rpx;
  color: #ccc;
  margin-left: 12rpx;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.order-amount {
  display: flex;
  align-items: baseline;
}

.amount-label {
  font-size: 26rpx;
  color: #666;
}

.amount-value {
  font-size: 36rpx;
  color: #ff4757;
  font-weight: bold;
  margin-left: 8rpx;
}

.order-actions {
  display: flex;
  gap: 12rpx;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  font-weight: 600;
}

.pay-btn {
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
}

.detail-btn,
.review-btn {
  background: #f0f0f0;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
  margin-top: 200rpx;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
  opacity: 0.3;
}

.empty-text {
  font-size: 32rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: #bbb;
  margin-bottom: 40rpx;
}

.empty-btn {
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
  padding: 20rpx 60rpx;
  border-radius: 999rpx;
  font-size: 28rpx;
  border: none;
}

.loading,
.no-more {
  text-align: center;
  padding: 40rpx;
  color: #999;
  font-size: 26rpx;
}
</style>

