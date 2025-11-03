<template>
  <view class="index-container">
    <scroll-view scroll-x class="cat-bar" enable-flex>
      <view 
        v-for="item in categoryList" 
        :key="item.id" 
        :class="['cat-item', currentCatId === item.id ? 'active' : '']" 
        @tap="onTapCategory" 
        :data-id="item.id"
      >
        {{ item.name }}
      </view>
    </scroll-view>
    
    <!-- 排序选择器 -->
    <view class="sort-bar">
      <text class="sort-label">排序：</text>
      <picker mode="selector" :range="sortOptions" range-key="label" :value="sortIndex" @change="onSortChange">
        <view class="sort-picker">
          <text class="sort-text">{{ sortOptions[sortIndex] ? sortOptions[sortIndex].label : '最新' }}</text>
          <text class="sort-arrow">▼</text>
        </view>
      </picker>
    </view>
    
    <view class="goods-list">
      <view v-for="(item, idx) in goodsList" :key="item.id" class="goods-card">
        <view class="goods-content" @tap="onTapDetail" :data-id="item.id">
          <image class="goods-img" :src="item.coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
          <view class="goods-title">{{ item.name }}</view>
          <view class="goods-meta">
            <view class="goods-price">￥{{ item.price }}</view>
          </view>
        </view>
        <view class="action-buttons">
          <view class="action-btn share-btn" @tap.stop="onShare" :data-id="item.id" :data-item="item">
            <text class="action-icon">📤</text>
          </view>
          <view 
            :class="['action-btn', 'favorite-btn', item.isFavorited ? 'favorited' : '']" 
            @tap.stop="toggleFavorite" 
            :data-id="item.id" 
            :data-index="idx"
          >
            <text class="action-icon">{{ item.isFavorited ? '❤️' : '🤍' }}</text>
          </view>
        </view>
      </view>
      <view v-if="!goodsList.length" class="empty-tip">暂无商品</view>
    </view>
    <button class="fab-add-btn" @tap="onTapAdd">发</button>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      categoryList: [],
      currentCatId: null,
      goodsList: [],
      page: 0,
      size: 20,
      hasMore: true,
      loading: false,
      sortOptions: [
        { label: '最新', sortBy: 'latest', sortOrder: 'desc' },
        { label: '价格从低到高', sortBy: 'price', sortOrder: 'asc' },
        { label: '价格从高到低', sortBy: 'price', sortOrder: 'desc' }
      ],
      sortIndex: 0,
      sortBy: 'latest',
      sortOrder: 'desc'
    }
  },
  async onLoad() {
    const cats = await request({ url: '/api/categories' })
    this.categoryList = [{ id: null, name: '全部' }, ...(cats.data || [])]
    this.resetAndLoad()
  },
  methods: {
    async onTapCategory(e) {
      const id = e.currentTarget.dataset.id
      this.currentCatId = id
      this.resetAndLoad()
    },
    onSortChange(e) {
      const index = Number(e.detail.value)
      const sortOption = this.sortOptions[index]
      this.sortIndex = index
      this.sortBy = sortOption.sortBy
      this.sortOrder = sortOption.sortOrder
      this.resetAndLoad()
    },
    resetAndLoad() {
      this.goodsList = []
      this.page = 0
      this.hasMore = true
      this.loadGoods(this.currentCatId, true)
    },
    async loadGoods(categoryId, reset = false) {
      if (this.loading || (!this.hasMore && !reset)) return
      this.loading = true
      
      const page = reset ? 0 : this.page
      const { sortBy, sortOrder } = this
      let res
      if (categoryId) {
        res = await request({ 
          url: `/api/products/by-category/${categoryId}?page=${page}&size=${this.size}&sortBy=${sortBy}&sortOrder=${sortOrder}` 
        })
      } else {
        res = await request({ 
          url: `/api/products?page=${page}&size=${this.size}&sortBy=${sortBy}&sortOrder=${sortOrder}` 
        })
      }
      
      if (res.code === 0 && res.data) {
        const pageData = res.data.content || []
        
        const newList = pageData.map(item => {
          let coverUrl = item.coverUrl || ''
          
          if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
            coverUrl = item.imageUrls[0]
          } else if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
            try {
              const imageUrls = JSON.parse(coverUrl)
              if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                coverUrl = imageUrls[0]
              }
            } catch (e) {
              // 解析失败，使用原始值
            }
          }
          
          return { 
            ...item, 
            coverUrl: coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg',
            isFavorited: false 
          }
        })
        
        if (reset) {
          this.goodsList = newList
        } else {
          const existingIds = new Set(this.goodsList.map(g => g.id))
          const filteredNewList = newList.filter(item => !existingIds.has(item.id))
          this.goodsList = [...this.goodsList, ...filteredNewList]
        }
        
        const hasMore = res.data.hasNext !== false && newList.length === this.size
        this.page = page + 1
        this.hasMore = hasMore
        this.loading = false
        
        await this.checkFavorites(newList)
      } else {
        this.loading = false
      }
    },
    async checkFavorites(newList = null) {
      const goodsList = newList || this.goodsList
      for (let i = 0; i < goodsList.length; i++) {
        try {
          const checkRes = await request({ url: `/api/favorites/${goodsList[i].id}/check` })
          if (checkRes.code === 0) {
            const index = this.goodsList.findIndex(item => item.id === goodsList[i].id)
            if (index >= 0) {
              this.$set(this.goodsList[index], 'isFavorited', checkRes.data)
            }
          }
        } catch (e) {
          // 忽略错误
        }
      }
    },
    async toggleFavorite(e) {
      const id = e.currentTarget.dataset.id
      const index = e.currentTarget.dataset.index
      const item = this.goodsList[index]
      const isFavorited = item.isFavorited
      
      try {
        if (isFavorited) {
          await request({ url: `/api/favorites/${id}`, method: 'DELETE' })
          uni.showToast({ title: '已取消收藏', icon: 'none' })
        } else {
          await request({ url: `/api/favorites/${id}`, method: 'POST' })
          uni.showToast({ title: '已收藏', icon: 'none' })
        }
        this.$set(this.goodsList[index], 'isFavorited', !isFavorited)
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    async onPullDownRefresh() {
      this.resetAndLoad()
      uni.stopPullDownRefresh()
    },
    onReachBottom() {
      if (this.hasMore && !this.loading) {
        this.loadGoods(this.currentCatId)
      }
    },
    onTapDetail(e) {
      const id = e.currentTarget.dataset.id
      uni.navigateTo({ url: '/pages/detail/detail?id=' + id })
    },
    onTapAdd() {
      uni.navigateTo({ url: '/pages/publish/publish' })
    },
    onShare(e) {
      const id = e.currentTarget.dataset.id
      if (!id) return
      
      uni.navigateTo({
        url: `/pages/share/share?productId=${id}`
      })
    },
    onShareAppMessage(options) {
      const productId = options.query?.productId
      if (productId) {
        const item = this.goodsList.find(p => p.id == productId)
        return {
          title: item?.name || '分享商品',
          path: `/pages/share/share?productId=${productId}`,
          imageUrl: item?.coverUrl || ''
        }
      }
      return {
        title: 'StyleMirror - 闲置好物',
        path: '/pages/index/index'
      }
    }
  }
}
</script>

<style scoped>
.index-container {
  min-height: 100vh;
  background: #f6f6f6;
  padding: 0;
}
.cat-bar {
  display: flex;
  flex-direction: row;
  white-space: nowrap;
  overflow-x: scroll;
  background: #fff9e6;
  padding: 24rpx 0 14rpx 34rpx;
}
.cat-item {
  margin-right: 32rpx;
  padding: 8rpx 34rpx;
  border-radius: 38rpx;
  font-size: 30rpx;
  background: #f8f8f8;
  color: #c2a13c;
}
.cat-item.active {
  background: linear-gradient(90deg, #fec400, #f6e39c 95%);
  color: #fff;
  font-weight: bold;
}

.sort-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.sort-label {
  font-size: 28rpx;
  color: #666;
  margin-right: 16rpx;
}

.sort-picker {
  display: flex;
  align-items: center;
  padding: 12rpx 24rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  border: 1rpx solid #e0e0e0;
}

.sort-text {
  font-size: 28rpx;
  color: #333;
  margin-right: 8rpx;
}

.sort-arrow {
  font-size: 20rpx;
  color: #999;
}

.goods-list {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx 12rpx;
  gap: 30rpx 20rpx;
  justify-content: flex-start;
}
.goods-card {
  width: 46vw;
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 4rpx 18rpx rgba(0, 0, 0, 0.02);
  margin-bottom: 12rpx;
  padding-bottom: 13rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}
.goods-content {
  flex: 1;
}
.action-buttons {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  z-index: 10;
}
.action-btn {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
}
.action-icon {
  font-size: 36rpx;
}
.favorite-btn.favorited {
  background: rgba(255, 192, 203, 0.95);
}
.goods-img {
  width: 100%;
  height: 270rpx;
  border-radius: 20rpx 20rpx 0 0;
  object-fit: cover;
  background: #f8f8ef;
}
.goods-title {
  font-size: 30rpx;
  font-weight: bold;
  margin: 22rpx 20rpx 6rpx 18rpx;
  color: #333;
}
.goods-meta {
  display: flex;
  align-items: center;
  margin: 0 18rpx;
  justify-content: flex-start;
}
.goods-price {
  color: #e6bd3b;
  font-size: 34rpx;
  font-weight: bold;
  margin-right: 14rpx;
  letter-spacing: 1rpx;
}
.empty-tip {
  margin: 120rpx auto 0;
  color: #bdb492;
  text-align: center;
  font-size: 31rpx;
}
.fab-add-btn {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translate(-50%, 50%);
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(135deg, #fcc822 0%, #f6b733 100%);
  color: #fff;
  border-radius: 60rpx;
  font-size: 64rpx;
  font-weight: bold;
  box-shadow: 0 4rpx 20rpx rgba(252, 200, 34, 0.4);
  border: 6rpx solid #fff;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
}
</style>

