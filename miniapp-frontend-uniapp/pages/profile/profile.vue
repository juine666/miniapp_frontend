<template>
  <view class="profile-container">
    <view class="card">
      <view class="card-title">基本资料</view>
      <view class="card-row" @tap="chooseAvatar">
        <view class="row-label">头像</view>
        <view class="row-value">
          <image class="avatar-preview" :src="user.avatarUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'" mode="aspectFill"/>
          <text class="row-arrow">></text>
        </view>
      </view>
      <view class="card-row">
        <view class="row-label">昵称</view>
        <input class="row-input" placeholder="请输入昵称" :value="user.nickname" @input="onInput" data-key="nickname"/>
      </view>
    </view>

    <view class="card">
      <view class="card-title">联系方式</view>
      <view class="card-row">
        <view class="row-label">电话</view>
        <input class="row-input" placeholder="请输入电话" :value="contact.phone" @input="onContact" data-key="phone"/>
      </view>
      <view class="card-row">
        <view class="row-label">微信号</view>
        <input class="row-input" placeholder="请输入微信号" :value="contact.wechatId" @input="onContact" data-key="wechatId"/>
      </view>
      <view class="card-row">
        <view class="row-label">邮箱</view>
        <input class="row-input" placeholder="请输入邮箱" :value="contact.email" @input="onContact" data-key="email"/>
      </view>
    </view>
    
    <button class="save-btn-main" @tap="saveAll">保存所有资料</button>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      user: {},
      contact: {}
    }
  },
  onLoad() {
    this.load()
  },
  methods: {
    async load() {
      try {
        const me = await request({ url: '/api/user/me' })
        if (me.code === 0) {
          this.user = me.data || {}
        }
      } catch (e) {
        console.error('加载用户信息失败', e)
        this.user = { nickname: '', avatarUrl: '' }
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
    onInput(e) {
      const key = e.currentTarget.dataset.key
      this.user[key] = e.detail.value
    },
    onContact(e) {
      const key = e.currentTarget.dataset.key
      this.contact[key] = e.detail.value
    },
    async chooseAvatar() {
      try {
        uni.showLoading({ title: '选择图片...' })
        const choose = await uni.chooseMedia({ count: 1, mediaType: ['image'] })
        let filePath = choose.tempFiles[0].tempFilePath
        const fs = uni.getFileSystemManager()
        const stat = fs.statSync(filePath)
        
        const MAX_BYTES = 3 * 1024 * 1024
        const MIN_BYTES = 1 * 1024 * 1024
        
        if (stat.size > MAX_BYTES) {
          uni.showLoading({ title: '压缩中...' })
          filePath = await this.compressToTarget(filePath, stat.size, MAX_BYTES, MIN_BYTES)
        }
        
        uni.showLoading({ title: '上传中...' })
        const dirPrefix = 'avatars/' + (new Date().toISOString().slice(0, 10)) + '/'
        const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } })
        
        if (!policy || policy.code !== 0) {
          uni.hideLoading()
          uni.showToast({ title: policy?.message || '获取上传凭证失败', icon: 'none' })
          return
        }
        
        const { accessid, host, policy: p, signature, dir } = policy.data
        const key = dir + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg'
        
        await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: host,
            filePath,
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
              
              this.user.avatarUrl = url
              uni.hideLoading()
              uni.showToast({ title: '上传成功', icon: 'success' })
              resolve()
            },
            fail: reject
          })
        })
      } catch (e) {
        uni.hideLoading()
        console.error('上传头像失败', e)
        uni.showToast({ title: '上传失败', icon: 'none' })
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
            if (s < bestSize) { bestPath = outPath; bestSize = s }
            return outPath
          }
          if (s < bestSize) { bestPath = outPath; bestSize = s }
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
    async saveAll() {
      uni.showLoading({ title: '保存中...' })
      try {
        await Promise.all([
          request({ url: '/api/user/profile', method: 'POST', data: this.user }),
          request({ url: '/api/user/contact', method: 'POST', data: this.contact })
        ])
        uni.hideLoading()
        uni.showToast({ title: '保存成功', icon: 'success' })
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '保存失败', icon: 'none' })
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
  background: #f6f6f6;
  min-height: 100vh;
  padding: 20rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 30rpx;
}

.card-row {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.card-row:last-child {
  border-bottom: none;
}

.row-label {
  width: 160rpx;
  font-size: 28rpx;
  color: #666;
  flex-shrink: 0;
}

.row-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.row-input {
  flex: 1;
  text-align: right;
  font-size: 28rpx;
  color: #333;
}

.avatar-preview {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
}

.row-arrow {
  margin-left: 16rpx;
  color: #ccc;
  font-size: 32rpx;
}

.save-btn-main {
  width: 100%;
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
  border-radius: 999rpx;
  padding: 32rpx 0;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
  margin-top: 40rpx;
}
</style>

