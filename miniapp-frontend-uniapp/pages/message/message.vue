<template>
  <view class="chat-container">
    <view v-if="productName" class="product-info">
      <text class="product-tag">关于：{{ productName }}</text>
    </view>
    <scroll-view class="messages-list" scroll-y :scroll-top="scrollTop" :scroll-into-view="scrollIntoView">
      <view v-for="item in messages" :key="item.id" :class="['message-item', item.fromUser == currentUserId ? 'sent' : 'received']">
        <view class="message-bubble">{{ item.content }}</view>
        <view class="message-time">{{ item.timeStr || item.createdAt }}</view>
      </view>
      <view v-if="!messages.length" class="empty-tip">暂无消息，开始聊天吧～</view>
    </scroll-view>
    <view v-if="productName" class="quick-replies">
      <view class="quick-item" @tap="sendQuickMessage" data-content="你好，请问这个商品还在吗？">还在吗？</view>
      <view class="quick-item" @tap="sendQuickMessage" data-content="可以便宜点吗？">能便宜吗？</view>
      <view class="quick-item" @tap="sendQuickMessage" data-content="可以看下实物吗？">看实物</view>
    </view>
    <view class="input-bar">
      <input class="input" placeholder="输入消息..." :value="inputContent" @input="onInput" confirm-type="send" @confirm="sendMessage"/>
      <button class="send-btn" @tap="sendMessage">发送</button>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      userId: null,
      productId: null,
      productName: '',
      currentUserId: null,
      messages: [],
      inputContent: '',
      scrollTop: 0,
      scrollIntoView: '',
      messageTimer: null
    }
  },
  async onLoad(options) {
    const userId = options.userId
    const productId = options.productId
    const productName = decodeURIComponent(options.productName || '')
    
    try {
      const userRes = await request({ url: '/api/user/me' })
      if (userRes.code === 0 && userRes.data) {
        this.currentUserId = userRes.data.id
      }
    } catch (e) {
      this.currentUserId = 1
    }
    
    if (userId) {
      this.userId = userId
      this.productId = productId
      this.productName = productName
      uni.setNavigationBarTitle({ title: '聊天' })
      this.loadMessages()
      this.messageTimer = setInterval(() => this.loadMessages(), 5000)
    }
  },
  onUnload() {
    if (this.messageTimer) {
      clearInterval(this.messageTimer)
    }
  },
  methods: {
    async loadMessages() {
      const { userId } = this
      if (!userId) return
      
      try {
        const res = await request({ url: `/api/messages/conversation/${userId}` })
        if (res.code === 0) {
          const messages = (res.data || []).map(msg => ({
            ...msg,
            timeStr: this.formatTime(msg.createdAt)
          }))
          this.messages = messages
          this.scrollToBottom()
        }
      } catch (e) {
        console.error('加载消息失败', e)
      }
    },
    formatTime(timeStr) {
      if (!timeStr) return ''
      const date = new Date(timeStr)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      if (minutes < 1) return '刚刚'
      if (minutes < 60) return `${minutes}分钟前`
      const hours = Math.floor(minutes / 60)
      if (hours < 24) return `${hours}小时前`
      const days = Math.floor(hours / 24)
      if (days < 7) return `${days}天前`
      return `${date.getMonth() + 1}月${date.getDate()}日`
    },
    onInput(e) {
      this.inputContent = e.detail.value
    },
    async sendMessage() {
      const { inputContent, productId, userId } = this
      if (!inputContent.trim()) {
        uni.showToast({ title: '请输入消息', icon: 'none' })
        return
      }
      
      try {
        const res = await request({
          url: '/api/messages/send',
          method: 'POST',
          data: { toUserId: userId, content: inputContent, productId }
        })
        
        if (res.code === 0) {
          this.inputContent = ''
          await this.loadMessages()
        }
      } catch (e) {
        uni.showToast({ title: '发送失败', icon: 'none' })
      }
    },
    sendQuickMessage(e) {
      const content = e.currentTarget.dataset.content
      this.inputContent = content
      this.sendMessage()
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const messages = this.messages
        if (messages.length > 0) {
          const lastId = messages[messages.length - 1].id
          this.scrollIntoView = `msg-${lastId}`
          this.scrollTop = 9999
        }
      })
    }
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f6f6f6;
}

.product-info {
  padding: 20rpx;
  background: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.product-tag {
  font-size: 26rpx;
  color: #666;
}

.messages-list {
  flex: 1;
  padding: 20rpx;
  overflow-y: auto;
}

.message-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 30rpx;
}

.message-item.sent {
  align-items: flex-end;
}

.message-item.received {
  align-items: flex-start;
}

.message-bubble {
  max-width: 60%;
  padding: 20rpx 24rpx;
  border-radius: 16rpx;
  font-size: 28rpx;
  line-height: 1.5;
}

.message-item.sent .message-bubble {
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
}

.message-item.received .message-bubble {
  background: #fff;
  color: #333;
}

.message-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 100rpx 0;
}

.quick-replies {
  display: flex;
  gap: 16rpx;
  padding: 20rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
}

.quick-item {
  padding: 12rpx 24rpx;
  background: #f0f0f0;
  border-radius: 999rpx;
  font-size: 26rpx;
  color: #666;
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
}

.input {
  flex: 1;
  padding: 16rpx 24rpx;
  background: #f0f0f0;
  border-radius: 999rpx;
  font-size: 28rpx;
  margin-right: 16rpx;
}

.send-btn {
  padding: 16rpx 32rpx;
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
  border-radius: 999rpx;
  font-size: 28rpx;
  border: none;
}
</style>

