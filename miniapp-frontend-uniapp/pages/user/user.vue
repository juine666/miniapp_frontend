<template>
  <view class="userA-container">
    <view class="banner">
      <view class="banner-grad"></view>
      <view class="banner-content">
        <!-- 头像选择：使用新的头像昵称填写能力 -->
        <button v-if="isLoggedIn" class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
          <image class="avatar" :src="user.avatarUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
        </button>
        <image v-else class="avatar" src="https://img.yzcdn.cn/vant/cat.jpeg" mode="aspectFill" @tap="handleLogin"/>
        
        <!-- 昵称显示和输入 -->
        <view v-if="isLoggedIn" class="nickname-section">
          <input 
            v-if="editingNickname"
            class="nickname-input" 
            type="nickname" 
            :value="user.nickname"
            placeholder="请输入昵称或选择微信昵称"
            @blur="onNicknameBlur"
            @confirm="onNicknameConfirm"
            :auto-focus="true"
          />
          <view v-else class="nickname" @tap="startEditNickname">
            {{ user.nickname || '点击设置昵称' }}
          </view>
        </view>
        <view v-else class="nickname" @tap="handleLogin">
          点击登录
        </view>
        <view v-if="isLoggedIn" class="profile-entry" @tap="goProfile">设置</view>
        <view v-if="isLoggedIn" class="logout-btn" @tap="handleLogout">退出</view>
      </view>
    </view>

    <view v-if="isLoggedIn" class="stats">
      <view class="stat-item" @tap="goFavorite">
        <view class="stat-num">{{ favoriteCount || 0 }}</view>
        <view class="stat-label">收藏</view>
      </view>
      <view class="stat-item" @tap="goManage">
        <view class="stat-num">{{ publishCount || 0 }}</view>
        <view class="stat-label">发布</view>
      </view>
      <view class="stat-item" @tap="goOrders">
        <view class="stat-num">{{ orderCount || 0 }}</view>
        <view class="stat-label">订单</view>
      </view>
    </view>

    <view v-if="!isLoggedIn" class="login-tip">
      <text>登录后查看更多精彩内容</text>
    </view>

    <view v-if="isLoggedIn" class="tabs">
      <view :class="['tab-item', currentTab === 'published' ? 'active' : '']" @tap="switchTab" data-tab="published">我发布的</view>
      <view :class="['tab-item', currentTab === 'sold' ? 'active' : '']" @tap="switchTab" data-tab="sold">我卖出的</view>
      <view :class="['tab-item', currentTab === 'bought' ? 'active' : '']" @tap="switchTab" data-tab="bought">我买到的</view>
    </view>

    <view v-if="isLoggedIn" class="products-section">
      <view v-for="item in productList" :key="item.id" class="product-item">
        <view class="product-click-area" @tap="goProduct" :data-id="item.id">
          <image class="cover" :src="item.coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
          <view class="info">
            <view class="name">{{ item.name }}</view>
            <view class="price">￥{{ item.price }}</view>
            <view v-if="currentTab === 'published'" class="status-row">
              <view :class="['status', item.status === 'PUBLISHED' ? 'on' : 'off']">{{ item.status === 'PUBLISHED' ? '已上架' : '已下架' }}</view>
              <view class="toggle-btn" @tap.stop="toggleStatus" :data-id="item.id">{{ item.status === 'PUBLISHED' ? '下架' : '上架' }}</view>
            </view>
            <view v-if="currentTab === 'sold'" class="sold-tag">已售出</view>
            <view v-if="currentTab === 'bought'" class="bought-tag">已购买</view>
          </view>
        </view>
      </view>
      <view v-if="!productList.length" class="empty">{{ emptyText }}</view>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      user: {},
      contact: {},
      isLoggedIn: false,
      currentTab: 'published',
      productList: [],
      productPage: 0,
      hasMore: true,
      loading: false,
      publishCount: 0,
      favoriteCount: 0,
      orderCount: 0,
      emptyText: '暂无发布的商品',
      editingNickname: false
    }
  },
  onShow() {
    this.checkLoginStatus()
    if (this.isLoggedIn) {
      this.load()
      this.loadStats()
      if (this.productList.length === 0) {
        this.loadProducts(true)
      }
    }
  },
  methods: {
    checkLoginStatus() {
      const app = getApp()
      const token = uni.getStorageSync('token')
      const isLoggedIn = !!(token || app.globalData.token)
      this.isLoggedIn = isLoggedIn
      
      if (!isLoggedIn) {
        this.user = {}
        this.productList = []
        this.publishCount = 0
        this.favoriteCount = 0
        this.orderCount = 0
      }
    },
    async load() {
      if (!this.isLoggedIn) {
        return
      }
      
      try {
        const me = await request({ url: '/api/user/me' })
        if (me.code === 0) {
          this.user = me.data || {}
        }
      } catch (e) {
        console.error('加载用户信息失败', e)
        if (e.statusCode === 401) {
          this.handleLogout(false)
        }
      }
      
      try {
        const ci = await request({ url: '/api/user/contact' })
        if (ci.code === 0) {
          this.contact = ci.data || {}
        }
      } catch (e) {
        console.error('加载联系方式失败', e)
        this.contact = {}
      }
    },
    async compressToTarget(srcPath, currentSize, maxBytes, minBytes) {
      if (currentSize <= maxBytes) return srcPath
      
      const fs = uni.getFileSystemManager()
      const qualities = [80, 70, 60, 50, 40, 35, 30]
      let bestPath = srcPath
      let bestSize = currentSize
      
      for (const q of qualities) {
        try {
          const outPath = await this.compressOnce(srcPath, q)
          const s = fs.statSync(outPath).size
          if (s <= maxBytes) {
            if (s >= minBytes) return outPath
            if (s < bestSize) {
              bestPath = outPath
              bestSize = s
            }
            return outPath
          }
          if (s < bestSize) {
            bestPath = outPath
            bestSize = s
          }
        } catch (e) {}
      }
      return bestPath
    },
    compressOnce(srcPath, quality) {
      return new Promise((resolve, reject) => {
        uni.compressImage({
          src: srcPath,
          quality,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        })
      })
    },
    async loadProducts(reset = false) {
      if (!this.isLoggedIn) {
        return
      }
      
      const { currentTab } = this
      if (this.loading) return
      
      this.loading = true
      const page = reset ? 0 : (this.productPage || 0)
      const size = 20
      
      try {
        if (currentTab === 'published') {
          const res = await request({ url: `/api/my/products?page=${page}&size=${size}` })
          if (res.code === 0 && res.data) {
            const pageData = res.data.content || []
            
            const validData = pageData.map(item => {
              let coverUrl = item.coverUrl || ''
              
              if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
                try {
                  const imageUrls = JSON.parse(coverUrl)
                  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                    coverUrl = imageUrls[0]
                  }
                } catch (e) {
                  console.warn('解析coverUrl JSON失败:', e)
                }
              }
              
              return {
                ...item,
                coverUrl: coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'
              }
            }).filter(item => item && item.id)
            
            let productList
            if (reset) {
              productList = validData
            } else {
              const existingIds = new Set(this.productList.map(p => p.id))
              const newItems = validData.filter(item => !existingIds.has(item.id))
              productList = [...this.productList, ...newItems]
            }
            
            this.productList = productList
            this.productPage = page + 1
            this.hasMore = res.data.hasNext !== false && pageData.length === size
            this.publishCount = res.data.total || productList.length
            this.emptyText = '暂无发布的商品'
            this.loading = false
          } else {
            console.error('加载我发布的商品失败:', res)
            this.loading = false
          }
        } else if (currentTab === 'sold') {
          const res = await request({ url: `/api/my/orders/sold?page=${page}&size=${size}` })
          if (res.code === 0 && res.data) {
            const pageData = res.data.content || []
            
            let productList
            if (reset) {
              productList = pageData
            } else {
              const existingIds = new Set(this.productList.map(p => p.id))
              const newItems = pageData.filter(item => !existingIds.has(item.id))
              productList = [...this.productList, ...newItems]
            }
            
            this.productList = productList
            this.productPage = page + 1
            this.hasMore = res.data.hasNext !== false && pageData.length === size
            this.emptyText = '暂无卖出的商品'
            this.loading = false
          }
        } else if (currentTab === 'bought') {
          const res = await request({ url: `/api/my/orders/bought?page=${page}&size=${size}` })
          if (res.code === 0 && res.data) {
            const pageData = res.data.content || []
            
            let productList
            if (reset) {
              productList = pageData
            } else {
              const existingIds = new Set(this.productList.map(p => p.id))
              const newItems = pageData.filter(item => !existingIds.has(item.id))
              productList = [...this.productList, ...newItems]
            }
            
            this.productList = productList
            this.productPage = page + 1
            this.hasMore = res.data.hasNext !== false && pageData.length === size
            this.emptyText = '暂无买到的商品'
            this.loading = false
          }
        }
      } catch (e) {
        console.error('加载商品列表失败', e)
        this.loading = false
      }
    },
    async loadStats() {
      if (!this.isLoggedIn) {
        return
      }
      
      try {
        const [products, favorites, orders] = await Promise.all([
          request({ url: '/api/my/products?page=0&size=1' }).catch(() => ({ data: { total: 0 } })),
          request({ url: '/api/favorites?page=0&size=1' }).catch(() => ({ data: { total: 0 } })),
          request({ url: '/api/orders?page=0&size=1' }).catch(() => ({ data: { total: 0 } }))
        ])
        this.publishCount = products.data?.total || 0
        this.favoriteCount = favorites.data?.total || 0
        this.orderCount = orders.data?.total || 0
      } catch (e) {
        console.error('加载统计数据失败', e)
      }
    },
    switchTab(e) {
      const tab = e.currentTarget.dataset.tab
      if (tab === this.currentTab) {
        return
      }
      this.currentTab = tab
      this.productList = []
      this.productPage = 0
      this.hasMore = true
      this.loadProducts(true)
    },
    onReachBottom() {
      if (this.hasMore && !this.loading) {
        this.loadProducts()
      }
    },
    goProduct(e) {
      console.log('goProduct 被调用', e)
      const id = e.currentTarget.dataset.id
      const { currentTab } = this
      
      if (!id) {
        uni.showToast({ title: '商品ID不存在', icon: 'none' })
        return
      }
      
      const productId = String(id)
      
      if (currentTab === 'published') {
        console.log('跳转到编辑页面，ID:', productId)
        const app = getApp()
        app.globalData.editingProductId = productId
        
        uni.switchTab({
          url: '/pages/publish/publish',
          success: () => {
            console.log('跳转成功')
          },
          fail: (err) => {
            console.error('跳转失败', err)
            uni.showToast({ title: '跳转失败', icon: 'none' })
          }
        })
      } else {
        console.log('跳转到详情页面，ID:', productId)
        uni.navigateTo({
          url: `/pages/detail/detail?id=${productId}`,
          success: () => {
            console.log('跳转成功')
          },
          fail: (err) => {
            console.error('跳转失败', err)
            uni.showToast({ title: '跳转失败', icon: 'none' })
          }
        })
      }
    },
    async toggleStatus(e) {
      e.stopPropagation()
      const id = e.currentTarget.dataset.id
      const product = this.productList.find(p => p.id === id)
      const newStatus = product.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED'
      const res = await request({ url: `/api/my/products/${id}/status?value=${newStatus}`, method: 'PATCH' })
      if (res.code === 0) {
        uni.showToast({ title: newStatus === 'PUBLISHED' ? '已上架' : '已下架' })
        this.loadProducts()
      }
    },
    async handleLogin() {
      if (this.isLoggedIn) {
        return
      }
      
      uni.showLoading({ title: '登录中...' })
      const app = getApp()
      
      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            success: resolve,
            fail: reject
          })
        })
        
        if (!loginRes.code) {
          throw new Error('获取登录code失败')
        }
        
        uni.hideLoading()
        const chooseRes = await new Promise((resolve) => {
          uni.showModal({
            title: '完善资料',
            content: '是否使用微信头像和昵称？您也可以稍后在设置中自定义',
            confirmText: '使用微信',
            cancelText: '稍后设置',
            success: (res) => {
              resolve(res.confirm)
            },
            fail: () => {
              resolve(false)
            }
          })
        })
        
        if (chooseRes) {
          uni.showModal({
            title: '提示',
            content: '请点击头像和昵称进行设置',
            showCancel: false,
            success: () => {
              this.doLoginWithCode(loginRes.code, null, null)
            }
          })
          return
        } else {
          uni.showLoading({ title: '登录中...' })
          await this.doLoginWithCode(loginRes.code, null, null)
        }
      } catch (e) {
        uni.hideLoading()
        console.error('登录失败', e)
        uni.showToast({
          title: e.message || '登录失败，请重试',
          icon: 'none',
          duration: 2000
        })
      }
    },
    async doLoginWithCode(code, nickname, avatarUrl) {
      const app = getApp()
      
      try {
        const res = await request({
          url: '/api/auth/wechat/login',
          method: 'POST',
          data: {
            code: code,
            nickname: nickname,
            avatarUrl: avatarUrl
          }
        })
        
        if (res.code === 0) {
          const { token, openid, userId, nickname: savedNickname, avatarUrl: savedAvatarUrl } = res.data
          app.globalData.token = token
          app.globalData.openid = openid
          app.globalData.userId = userId
          uni.setStorageSync('token', token)
          uni.setStorageSync('openid', openid)
          uni.setStorageSync('userId', userId)
          
          uni.hideLoading()
          
          if (!savedNickname || !savedAvatarUrl) {
            uni.showToast({
              title: '登录成功，请设置头像和昵称',
              icon: 'success',
              duration: 2000
            })
          } else {
            uni.showToast({ title: '登录成功', icon: 'success' })
          }
          
          this.checkLoginStatus()
          this.load()
          this.loadStats()
          this.loadProducts(true)
        } else {
          throw new Error(res.message || '登录失败')
        }
      } catch (e) {
        uni.hideLoading()
        throw e
      }
    },
    async onChooseAvatar(e) {
      const { avatarUrl } = e.detail
      console.log('选择头像:', avatarUrl)
      
      if (!avatarUrl) {
        uni.showToast({ title: '未选择头像', icon: 'none' })
        return
      }
      
      uni.showLoading({ title: '上传头像中...' })
      
      try {
        const fs = uni.getFileSystemManager()
        const stat = fs.statSync(avatarUrl)
        const MAX_BYTES = 3 * 1024 * 1024
        const MIN_BYTES = 1 * 1024 * 1024
        
        let finalPath = avatarUrl
        if (stat.size > MAX_BYTES) {
          finalPath = await this.compressToTarget(avatarUrl, stat.size, MAX_BYTES, MIN_BYTES)
        }
        
        const dirPrefix = 'avatars/' + (new Date().toISOString().slice(0, 10)) + '/'
        const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } })
        if (policy.code !== 0) {
          uni.hideLoading()
          uni.showToast({ title: '获取上传凭证失败', icon: 'none' })
          return
        }
        
        const { accessid, host, policy: p, signature, dir } = policy.data
        const key = dir + Date.now() + '_avatar_' + Math.floor(Math.random() * 1000) + '.jpg'
        
        await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: host,
            filePath: finalPath,
            name: 'file',
            formData: {
              key,
              policy: p,
              OSSAccessKeyId: accessid,
              signature,
              success_action_status: '200'
            },
            success: (res) => {
              let url = host
              if (!url.endsWith('/')) url += '/'
              url += key
              
              request({
                url: '/api/user/profile',
                method: 'POST',
                data: { avatarUrl: url }
              }).then(() => {
                this.user.avatarUrl = url
                uni.hideLoading()
                uni.showToast({ title: '头像已更新', icon: 'success' })
                resolve()
              }).catch(reject)
            },
            fail: reject
          })
        })
      } catch (e) {
        uni.hideLoading()
        console.error('上传头像失败', e)
        uni.showToast({ title: '上传头像失败', icon: 'none' })
      }
    },
    startEditNickname() {
      this.editingNickname = true
    },
    async onNicknameBlur(e) {
      const nickname = e.detail.value.trim()
      if (nickname && nickname !== this.user.nickname) {
        await this.saveNickname(nickname)
      }
      this.editingNickname = false
    },
    async onNicknameConfirm(e) {
      const nickname = e.detail.value.trim()
      if (nickname) {
        await this.saveNickname(nickname)
      }
      this.editingNickname = false
    },
    async saveNickname(nickname) {
      if (!nickname || nickname.trim() === '') {
        return
      }
      
      uni.showLoading({ title: '保存中...' })
      try {
        const res = await request({
          url: '/api/user/profile',
          method: 'POST',
          data: { nickname: nickname.trim() }
        })
        
        if (res.code === 0) {
          this.user.nickname = nickname.trim()
          this.editingNickname = false
          uni.hideLoading()
          uni.showToast({ title: '昵称已更新', icon: 'success' })
        } else {
          throw new Error(res.message || '保存失败')
        }
      } catch (e) {
        uni.hideLoading()
        console.error('保存昵称失败', e)
        uni.showToast({ title: '保存失败，请重试', icon: 'none' })
      }
    },
    handleLogout(showConfirm = true) {
      if (!this.isLoggedIn) {
        return
      }
      
      const doLogout = () => {
        const app = getApp()
        app.globalData.token = ''
        app.globalData.openid = ''
        app.globalData.userId = ''
        uni.removeStorageSync('token')
        uni.removeStorageSync('openid')
        uni.removeStorageSync('userId')
        
        this.isLoggedIn = false
        this.user = {}
        this.productList = []
        this.publishCount = 0
        this.favoriteCount = 0
        this.orderCount = 0
        
        uni.showToast({ title: '已退出', icon: 'success' })
      }
      
      if (showConfirm) {
        uni.showModal({
          title: '确认退出',
          content: '退出后需要重新登录才能使用相关功能',
          confirmText: '退出',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              doLogout()
            }
          }
        })
      } else {
        doLogout()
      }
    },
    goFavorite() {
      if (!this.isLoggedIn) {
        this.handleLogin()
        return
      }
      uni.navigateTo({ url: '/pages/favorite/favorite' })
    },
    goManage() {
      if (!this.isLoggedIn) {
        this.handleLogin()
        return
      }
      uni.navigateTo({ url: '/pages/manage/manage' })
    },
    goOrders() {
      if (!this.isLoggedIn) {
        this.handleLogin()
        return
      }
      uni.switchTab({ url: '/pages/orders/orders' })
    },
    goProfile() {
      if (!this.isLoggedIn) {
        this.handleLogin()
        return
      }
      uni.navigateTo({ url: '/pages/profile/profile' })
    }
  }
}
</script>

<style scoped>
.userA-container {
  background: #f6f6f6;
  min-height: 100vh;
  padding-bottom: 30rpx;
}
.banner {
  position: relative;
  height: 260rpx;
}
.banner-grad {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ffc839, #f7b733);
}
.banner-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: -80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  border: 6rpx solid #fff;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.02);
  background: #eee;
}
.avatar-btn {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  line-height: normal;
  display: inline-block;
}
.avatar-btn::after {
  border: none;
}
.nickname-section {
  margin-top: 16rpx;
}
.nickname {
  margin-top: 0;
  background: #fff;
  color: #333;
  font-size: 32rpx;
  font-weight: 600;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.01);
  cursor: pointer;
}
.nickname-input {
  background: #fff;
  color: #333;
  font-size: 32rpx;
  font-weight: 600;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.01);
  width: 300rpx;
  text-align: center;
}
.profile-entry {
  position: absolute;
  top: 20rpx;
  right: 120rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #666;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}
.logout-btn {
  position: absolute;
  top: 20rpx;
  right: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  color: #ff4757;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.stats {
  margin-top: 120rpx;
  margin-left: 24rpx;
  margin-right: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 26rpx rgba(0, 0, 0, 0.01);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: 26rpx 18rpx;
}
.stat-item {
  flex: 0 0 calc(33.33% - 12rpx);
  text-align: center;
  margin-bottom: 16rpx;
}
.stat-num {
  font-size: 40rpx;
  color: #e0a600;
  margin-bottom: 6rpx;
  font-weight: bold;
}
.stat-label {
  font-size: 26rpx;
  color: #666;
}

.tabs {
  display: flex;
  background: #fff;
  margin: 20rpx;
  border-radius: 18rpx;
  box-shadow: 0 6rpx 22rpx rgba(0, 0, 0, 0.01);
  overflow: hidden;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 30rpx;
  color: #666;
  position: relative;
}
.tab-item.active {
  color: #fcc822;
  font-weight: 600;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background: #fcc822;
  border-radius: 2rpx;
}

.products-section {
  padding: 0 20rpx;
}
.product-item {
  background: #fff;
  border-radius: 18rpx;
  box-shadow: 0 6rpx 22rpx rgba(0, 0, 0, 0.01);
  margin-bottom: 22rpx;
  overflow: hidden;
}
.product-click-area {
  display: flex;
  padding: 20rpx;
  cursor: pointer;
}
.cover {
  width: 200rpx;
  height: 200rpx;
  flex-shrink: 0;
  border-radius: 12rpx;
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
  color: #e6bd3b;
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
.sold-tag,
.bought-tag {
  display: inline-block;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  background: #e8f5e9;
  color: #4caf50;
  margin-top: 8rpx;
}
.empty {
  text-align: center;
  color: #bbb;
  margin-top: 200rpx;
  font-size: 32rpx;
}
.login-tip {
  text-align: center;
  color: #999;
  margin-top: 60rpx;
  padding: 40rpx;
  font-size: 28rpx;
}
</style>

