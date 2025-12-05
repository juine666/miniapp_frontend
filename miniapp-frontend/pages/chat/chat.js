const { request } = require('../../utils/request');

Page({
  data: {
    productId: null,
    messages: [],
    inputContent: '',
    currentUserId: '',
    currentUserAvatar: '',
    currentUserNickname: '',
    showContextMenu: false,
    contextMenuMessageId: null,
    contextMenuContent: '',
    lastMessageTime: 0,
    pollingTimer: null,
    scrollTop: 999999,
    toView: '',
    replyingTo: null,
    replyingToNickname: ''
  },

  async onLoad(options) {
    const productId = options.productId || options.id;
    if (!productId) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    this.setData({ productId: parseInt(productId) });
    await this.loadCurrentUser();
    await this.loadProductInfo(productId);
    await this.loadMessages();
    this.startPolling();
  },

  async loadProductInfo(productId) {
    try {
      const res = await request({ url: `/api/products/${productId}` });
      if (res.code === 0 && res.data) {
        wx.setNavigationBarTitle({
          title: res.data.name || '商品咨询'
        });
      }
    } catch (e) {
      console.error('加载商品信息失败', e);
    }
  },

  async loadCurrentUser() {
    try {
      const res = await request({ url: '/api/user/me' });
      if (res.code === 0) {
        this.setData({
          currentUserId: res.data.id,
          currentUserAvatar: res.data.avatarUrl,
          currentUserNickname: res.data.nickname || '匿名用户'
        });
      }
    } catch (e) {
      console.error('加载用户信息失败', e);
      this.setData({
        currentUserId: 'anonymous_' + Date.now(),
        currentUserNickname: '匿名用户'
      });
    }
  },

  async loadMessages() {
    try {
      const res = await request({
        url: `/api/chat/messages/${this.data.productId}`,
        method: 'GET'
      });

      if (res.code === 0 && res.data) {
        const messages = res.data;
        this.setData({
          messages: messages,
          lastMessageTime: messages.length > 0 
            ? (messages[messages.length - 1].createdAt
              ? new Date(messages[messages.length - 1].createdAt).getTime()
              : Date.now())
            : Date.now()
        });
        
        if (messages.length > 0) {
          setTimeout(() => {
            this.scrollToBottom();
          }, 100);
        }
      }
    } catch (e) {
      console.error('加载消息失败', e);
    }
  },

  startPolling() {
    this.data.pollingTimer = setInterval(() => {
      this.pollNewMessages();
    }, 10000);
  },

  async pollNewMessages() {
    try {
      const sinceTime = this.data.lastMessageTime;
      const res = await request({
        url: `/api/chat/messages/${this.data.productId}?since=${sinceTime}`,
        method: 'GET'
      });

      if (res.code === 0 && res.data && res.data.length > 0) {
        const newMessages = res.data;
        const existingIds = new Set(this.data.messages.map(m => m.id));
        const reallyNewMessages = newMessages.filter(m => !existingIds.has(m.id));
        
        if (reallyNewMessages.length > 0) {
          const allMessages = [...this.data.messages, ...reallyNewMessages];
          
          this.setData({
            messages: allMessages,
            lastMessageTime: reallyNewMessages[reallyNewMessages.length - 1].createdAt
              ? new Date(reallyNewMessages[reallyNewMessages.length - 1].createdAt).getTime()
              : Date.now()
          });
          
          this.scrollToBottom();
        }
      }
    } catch (e) {
      console.error('轮询消息失败', e);
    }
  },

  onInput(e) {
    this.setData({ inputContent: e.detail.value });
  },

  async sendMessage() {
    const content = this.data.inputContent.trim();
    if (!content) {
      wx.showToast({ title: '消息不能为空', icon: 'none' });
      return;
    }

    try {
      wx.showLoading({ title: '发送中...' });
      
      const url = '/api/chat/send?productId=' + this.data.productId + 
                  '&userId=' + encodeURIComponent(this.data.currentUserId) +
                  '&nickname=' + encodeURIComponent(this.data.currentUserNickname) +
                  '&avatarUrl=' + encodeURIComponent(this.data.currentUserAvatar || '') +
                  '&content=' + encodeURIComponent(content) +
                  (this.data.replyingTo ? '&replyToId=' + this.data.replyingTo : '');
      
      const res = await request({
        url: url,
        method: 'POST',
        data: {}
      });

      if (res.code === 0) {
        this.setData({ inputContent: '' });
        
        const newMessage = res.data;
        this.setData({
          messages: [...this.data.messages, newMessage],
          lastMessageTime: new Date(newMessage.createdAt).getTime(),
          replyingTo: null,
          replyingToNickname: ''
        });
        
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
        
        wx.hideLoading();
        wx.showToast({ title: '发送成功', icon: 'success' });
      } else {
        wx.hideLoading();
        wx.showToast({ title: res.message || '发送失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('发送消息失败', e);
      wx.showToast({ title: '发送失败，请重试', icon: 'none' });
    }
  },

  onLongPressMessage(e) {
    const messageId = e.currentTarget.dataset.messageId;
    const content = e.currentTarget.dataset.content;
    const userId = e.currentTarget.dataset.userId;

    this.setData({
      showContextMenu: true,
      contextMenuMessageId: messageId,
      contextMenuContent: content,
      contextMenuUserId: userId
    });
  },

  closeContextMenu() {
    this.setData({ showContextMenu: false });
  },

  replyMessage() {
    const messageId = this.data.contextMenuMessageId;
    const content = this.data.contextMenuContent;
    const nickname = this.data.contextMenuUserId;
    
    const message = this.data.messages.find(m => m.id === messageId);
    if (message) {
      this.setData({
        replyingTo: messageId,
        replyingToNickname: message.nickname
      });
    }
    
    this.closeContextMenu();
  },

  cancelReply() {
    this.setData({
      replyingTo: null,
      replyingToNickname: ''
    });
  },

  async translateMessage() {
    const content = this.data.contextMenuContent;
    const messageId = this.data.contextMenuMessageId;
    if (!content || !messageId) return;

    try {
      wx.showLoading({ title: '翻译中...' });
      
      const res = await request({
        url: `/api/chat/messages/${messageId}/translate`,
        method: 'POST',
        data: { text: content }
      });

      wx.hideLoading();
      
      if (res.code === 0) {
        const messages = this.data.messages.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              translatedText: res.data
            };
          }
          return msg;
        });
        this.setData({ messages: messages });
      } else {
        wx.showToast({ title: res.message || '翻译失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('翻译失败', e);
      wx.showToast({ title: '翻译失败', icon: 'none' });
    }

    this.closeContextMenu();
  },

  async speakMessage() {
    const content = this.data.contextMenuContent;
    const messageId = this.data.contextMenuMessageId;
    if (!content || !messageId) return;

    try {
      wx.showLoading({ title: '合成中...' });
      
      const res = await request({
        url: `/api/chat/messages/${messageId}/tts`,
        method: 'POST',
        data: { text: content, voice: 'female', language: 'zh-CN' }
      });

      wx.hideLoading();
      
      if (res.code === 0 && res.data) {
        let audioUrl = res.data;
        if (typeof res.data === 'object' && res.data.audioUrl) {
          audioUrl = res.data.audioUrl;
        } else if (typeof res.data === 'object' && res.data.url) {
          audioUrl = res.data.url;
        }
        
        const audioContext = wx.createInnerAudioContext();
        audioContext.src = audioUrl;
        audioContext.play();
        
        audioContext.onError(() => {
          wx.showToast({ title: '播放失败', icon: 'none' });
        });
      } else {
        wx.showToast({ title: res.message || '生成音频失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('朗诵失败', e);
      wx.showToast({ title: '朗诵失败', icon: 'none' });
    }

    this.closeContextMenu();
  },

  copyMessage() {
    const content = this.data.contextMenuContent;
    if (!content) return;

    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
      }
    });

    this.closeContextMenu();
  },

  scrollToBottom() {
    const messages = this.data.messages;
    if (messages.length > 0) {
      const lastId = 'msg_' + messages[messages.length - 1].id;
      this.setData({
        scrollTop: 999999,
        toView: lastId
      });
    }
  },

  formatTime(createdAt) {
    if (!createdAt) return '';
    
    const date = new Date(createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (msgDate.getTime() === today.getTime()) {
      return date.getHours().toString().padStart(2, '0') + ':' + 
             date.getMinutes().toString().padStart(2, '0');
    } else {
      return (date.getMonth() + 1).toString().padStart(2, '0') + '-' + 
             date.getDate().toString().padStart(2, '0');
    }
  },

  goBack() {
    wx.navigateBack();
  },

  onUnload() {
    if (this.data.pollingTimer) {
      clearInterval(this.data.pollingTimer);
    }
  }
});
