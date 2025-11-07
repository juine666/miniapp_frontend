const { request } = require('../../utils/request');
const { validateText } = require('../../utils/sensitiveWordFilter');

Page({
  data: {
    userId: null,
    productId: null,
    productName: '',
    productInfo: null,  // 商品完整信息
    currentUserId: null,
    currentUserInfo: {},  // 当前用户信息（头像等）
    otherUserInfo: {},  // 对方用户信息（头像等）
    messages: [],
    conversations: [],  // 会话列表
    inputContent: '',
    scrollTop: 0,
    showChat: false,  // 是否显示聊天界面
    refreshing: false,  // 是否正在刷新
    // 分页相关
    page: 0,
    size: 20,
    hasMore: true,
    loading: false,  // 是否正在加载
    isInitialLoad: true  // 是否是首次加载
  },
  async onLoad(options) {
    const app = getApp();
    
    // 优先从全局数据获取参数（用于从商品详情页跳转）
    let userId = null;
    let productId = null;
    let productName = '';
    
    if (app.globalData.chatParams) {
      userId = app.globalData.chatParams.userId;
      productId = app.globalData.chatParams.productId;
      productName = app.globalData.chatParams.productName || '';
      // 清除全局数据，避免下次进入页面时重复使用
      app.globalData.chatParams = null;
    } else {
      // 从URL参数获取（兼容其他跳转方式）
      userId = options.userId;
      productId = options.productId;
      productName = decodeURIComponent(options.productName || '');
    }
    
    // 获取当前用户ID（先获取，后续会话列表需要用到）
    try {
      const userRes = await request({ url: '/api/user/me' });
      if (userRes.code === 0 && userRes.data) {
        this.setData({ currentUserId: userRes.data.id });
      }
    } catch (e) {
      console.error('获取当前用户信息失败', e);
      // 如果获取失败，无法显示会话列表
    }
    
    if (userId) {
      // 有userId，显示聊天界面
      this.setData({ userId, productId, productName, showChat: true, isInitialLoad: true });
      wx.setNavigationBarTitle({ title: '聊天' });
      
      // 加载商品信息
      if (productId) {
        this.loadProductInfo(productId);
      }
      
      // 加载用户信息
      this.loadUserInfo();
      
      this.loadMessages();
      // 定时刷新消息（每5秒）
      this.messageTimer = setInterval(() => this.loadMessages(), 5000);
    } else {
      // 没有userId，显示会话列表
      this.setData({ showChat: false });
      wx.setNavigationBarTitle({ title: '消息' });
      // 确保获取到currentUserId后再加载会话列表
      if (this.data.currentUserId) {
        this.loadConversations(true);
        // 定时刷新会话列表（每10秒）- 只更新消息，不重置列表
        this.conversationTimer = setInterval(() => this.loadConversations(false), 10000);
      } else {
        // 延迟加载，确保currentUserId已设置
        setTimeout(() => {
          if (this.data.currentUserId) {
            this.loadConversations(true);
            // 定时刷新会话列表（每10秒）- 只更新消息，不重置列表
            this.conversationTimer = setInterval(() => this.loadConversations(false), 10000);
          }
        }, 300);
      }
    }
  },
  onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      });
    }
    // 页面显示时检查是否有新的聊天参数
    const app = getApp();
    if (app.globalData.chatParams) {
      const { userId, productId, productName } = app.globalData.chatParams;
      if (userId && userId !== this.data.userId) {
        // 清除旧定时器
        if (this.messageTimer) {
          clearInterval(this.messageTimer);
        }
        if (this.conversationTimer) {
          clearInterval(this.conversationTimer);
        }
        // 设置新参数，显示聊天界面
        this.setData({ userId, productId, productName, showChat: true, isInitialLoad: true });
        wx.setNavigationBarTitle({ title: '聊天' });
        
        // 加载商品信息
        if (productId) {
          this.loadProductInfo(productId);
        }
        
        // 加载用户信息
        this.loadUserInfo();
        
        this.loadMessages();
        
        // 标记该会话的所有消息为已读
        const userIdNum = Number(userId);
        if (!isNaN(userIdNum)) {
          this.markConversationAsRead(userIdNum);
        }
        
        // 启动新的定时器
        this.messageTimer = setInterval(() => this.loadMessages(), 5000);
        // 清除全局数据
        app.globalData.chatParams = null;
      }
    } else if (!this.data.showChat) {
      // 如果没有显示聊天界面，刷新会话列表并更新未读消息数
      this.loadConversations(true);
      // 更新未读消息数
      const app = getApp();
      app.updateUnreadCount();
    }
  },
  onUnload() {
    if (this.messageTimer) {
      clearInterval(this.messageTimer);
    }
    if (this.conversationTimer) {
      clearInterval(this.conversationTimer);
    }
  },
  async loadMessages() {
    const { userId, isInitialLoad } = this.data;
    if (!userId) {
      console.warn('loadMessages: userId为空');
      return;
    }
    
    try {
      console.log('加载消息，userId:', userId);
      const res = await request({ url: `/api/messages/conversation/${userId}` });
      console.log('消息列表响应:', res);
      
      if (res.code === 0) {
        const messages = (res.data || []).map(msg => ({
          ...msg,
          timeStr: this.formatTime(msg.createdAt)
        }));
        console.log('处理后的消息列表:', messages);
        
        // 首次加载时不滚动，让用户看到所有消息
        if (isInitialLoad) {
          this.setData({ messages, isInitialLoad: false });
        } else {
          // 后续刷新时滚动到底部（用于显示新消息）
          this.setData({ messages }, () => {
            setTimeout(() => {
              this.scrollToBottom();
            }, 200);
          });
        }
      } else {
        console.error('加载消息失败，响应:', res);
      }
    } catch (e) {
      console.error('加载消息失败', e);
      wx.showToast({ title: '加载消息失败', icon: 'none' });
    }
  },
  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}天前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  },
  onInput(e) {
    const content = e.detail.value;
    this.setData({ inputContent: content });
    // 触发发送按钮状态更新（虽然小程序的setData是同步的，但这里可以通过重新渲染来更新样式）
  },
  async sendMessage() {
    const { inputContent, productId, userId } = this.data;
    if (!inputContent.trim()) {
      wx.showToast({ title: '请输入消息', icon: 'none' });
      return;
    }
    
    // 前端敏感词预检查
    const validation = validateText(inputContent);
    if (!validation.valid) {
      wx.showModal({
        title: '消息包含敏感词',
        content: validation.message,
        showCancel: false,
        confirmText: '知道了'
      });
      return;
    }
    
    // 必须要有 userId（接收者）
    if (!userId) {
      wx.showToast({ title: '接收者信息不完整', icon: 'none' });
      return;
    }
    
    try {
      // 确保 userId 是数字类型
      const toUserIdNum = Number(userId);
      if (isNaN(toUserIdNum)) {
        wx.showToast({ title: '接收者ID格式错误', icon: 'none' });
        console.error('userId格式错误:', userId);
        return;
      }
      
      // 构建请求数据：优先使用 toUserId，如果没有则使用 productId
      const requestData = {
        content: inputContent.trim(),
        toUserId: toUserIdNum
      };
      
      // 如果有 productId，也传递过去（用于商品信息展示）
      if (productId) {
        const productIdNum = Number(productId);
        if (!isNaN(productIdNum)) {
          requestData.productId = productIdNum;
        }
      }
      
      console.log('发送消息，toUserId:', toUserIdNum, 'productId:', productId, 'content:', inputContent);
      
      const res = await request({
        url: '/api/messages/send',
        method: 'POST',
        data: requestData
      });
      
      console.log('发送消息响应:', res);
      
      if (res.code === 0) {
        this.setData({ inputContent: '' });
        // 立即刷新消息列表
        await this.loadMessages();
        wx.showToast({ title: '发送成功', icon: 'success', duration: 1000 });
      } else {
        wx.showToast({ title: res.message || '发送失败', icon: 'none' });
      }
    } catch (e) {
      console.error('发送消息异常:', e);
      wx.showToast({ title: '发送失败: ' + (e.message || '未知错误'), icon: 'none' });
    }
  },
  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTop: 99999 });
    }, 100);
  },
  sendQuickMessage(e) {
    const content = e.currentTarget.dataset.content;
    this.setData({ inputContent: content });
    this.sendMessage();
  },
  async loadProductInfo(productId) {
    if (!productId) return;
    
    try {
      const res = await request({ url: `/api/products/${productId}` });
      if (res.code === 0 && res.data) {
        this.setData({ 
          productInfo: {
            id: res.data.id,
            name: res.data.name,
            price: res.data.price,
            coverUrl: res.data.coverUrl || res.data.imageUrls?.[0] || ''
          }
        });
      }
    } catch (e) {
      console.error('加载商品信息失败', e);
    }
  },
  async loadUserInfo() {
    try {
      // 获取当前用户信息
      const currentRes = await request({ url: '/api/user/me' });
      if (currentRes.code === 0 && currentRes.data) {
        this.setData({ 
          currentUserId: currentRes.data.id,
          currentUserInfo: {
            avatarUrl: currentRes.data.avatarUrl || ''
          }
        });
      }
      
      // 获取对方用户信息
      if (this.data.userId) {
        try {
          const otherRes = await request({ url: `/api/user/${this.data.userId}` });
          if (otherRes.code === 0 && otherRes.data) {
            this.setData({ 
              otherUserInfo: {
                avatarUrl: otherRes.data.avatarUrl || '',
                nickname: otherRes.data.nickname || '用户'
              }
            });
          }
        } catch (e) {
          console.error('加载对方用户信息失败', e);
        }
      }
    } catch (e) {
      console.error('加载用户信息失败', e);
    }
  },
  goToProductDetail() {
    if (this.data.productId) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${this.data.productId}`
      });
    }
  },
  async loadConversations(reset = false) {
    if (this.data.loading) {
      return;
    }
    
    let currentPage = this.data.page;
    let currentHasMore = this.data.hasMore;
    
    if (reset) {
      currentPage = 0;
      currentHasMore = true;
      this.setData({ page: 0, hasMore: true, conversations: [] });
    } else {
      // 如果是刷新（非重置），只检查第一页是否有新消息
      currentPage = 0;
    }
    
    if (!reset && !currentHasMore && currentPage === 0) {
      // 如果已经加载完第一页且不是重置，跳过
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      const res = await request({ 
        url: '/api/messages/conversations',
        data: {
          page: currentPage,
          size: this.data.size
        }
      });
      console.log('会话列表响应:', res);
      
      if (res.code === 0 && res.data) {
        const pageData = res.data;
        const messages = pageData.content || [];
        const currentUserId = this.data.currentUserId;
        
        console.log('分页数据:', {
          page: pageData.page,
          size: pageData.size,
          total: pageData.total,
          hasNext: pageData.hasNext,
          messagesCount: messages.length
        });
        
        if (!currentUserId) {
          console.warn('currentUserId为空，无法处理会话列表');
          this.setData({ loading: false });
          return;
        }
        
        // 按对方用户分组，取最后一条消息
        const conversationMap = new Map();
        
        // 第一遍：按对方用户分组，找到最后一条消息，并收集所有未读消息
        const currentUserIdNum = Number(currentUserId);
        
        messages.forEach(msg => {
          const msgFromUser = Number(msg.fromUser);
          const msgToUser = Number(msg.toUser);
          const otherUserId = msgFromUser === currentUserIdNum ? msgToUser : msgFromUser;
          
          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              lastMessage: msg,
              unreadMessages: [],
              productId: null,
              productName: '',
              userName: '用户',
              userAvatar: ''
            });
          } else {
            const conv = conversationMap.get(otherUserId);
            if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
              conv.lastMessage = msg;
            }
          }
          
          // 收集未读消息
          const isMessageToMe = msgToUser === currentUserIdNum;
          const isMessageFromOther = msgFromUser !== currentUserIdNum;
          const isUnread = (msg.readFlag === 0 || msg.readFlag === null || msg.readFlag === undefined);
          
          if (isMessageToMe && isMessageFromOther && isUnread) {
            const senderUserId = msgFromUser;
            const conv = conversationMap.get(senderUserId);
            if (conv) {
              if (!conv.unreadMessages) {
                conv.unreadMessages = [];
              }
              conv.unreadMessages.push(msg);
            }
          }
        });
        
        // 计算未读消息数
        conversationMap.forEach((conv, otherUserId) => {
          conv.unreadCount = conv.unreadMessages ? conv.unreadMessages.length : 0;
          delete conv.unreadMessages;
        });
        
        // 转换为数组并排序
        let newConversations = Array.from(conversationMap.values()).map(conv => ({
          ...conv,
          userId: String(conv.userId),
          lastMessageContent: conv.lastMessage.content,
          lastMessageTime: this.formatTime(conv.lastMessage.createdAt),
          timeStr: this.formatTime(conv.lastMessage.createdAt),
          productId: conv.productId || null
        })).sort((a, b) => {
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });
        
        // 合并到现有会话列表（去重）
        let allConversations = reset ? [] : [...this.data.conversations];
        
        // 只加载新会话的用户信息，已存在的会话只更新消息内容
        const needLoadUserInfo = [];
        newConversations.forEach(newConv => {
          const existingIndex = allConversations.findIndex(c => c.userId === newConv.userId);
          if (existingIndex >= 0) {
            // 更新现有会话：只更新消息内容和未读数量，保留用户信息
            const existingConv = allConversations[existingIndex];
            existingConv.lastMessageContent = newConv.lastMessageContent;
            existingConv.lastMessageTime = newConv.lastMessageTime;
            existingConv.timeStr = newConv.timeStr;
            existingConv.unreadCount = newConv.unreadCount;
            existingConv.lastMessage = newConv.lastMessage;
          } else {
            // 新会话，需要加载用户信息
            needLoadUserInfo.push(newConv);
            allConversations.push(newConv);
          }
        });
        
        // 只加载新会话的用户信息
        if (needLoadUserInfo.length > 0) {
          const userPromises = needLoadUserInfo.map(async (conv) => {
            try {
              const userRes = await request({ url: `/api/user/${conv.userId}` });
              if (userRes.code === 0 && userRes.data) {
                conv.userName = userRes.data.nickname || '用户';
                conv.userAvatar = userRes.data.avatarUrl || '';
              }
            } catch (e) {
              console.error(`加载用户${conv.userId}信息失败`, e);
            }
            return conv;
          });
          await Promise.all(userPromises);
        }
        
        // 重新排序
        allConversations.sort((a, b) => {
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });
        
        // 使用后端接口获取准确的未读消息总数（用于 tabBar 角标）
        const app = getApp();
        app.updateUnreadCount();
        
        // 如果是刷新（非重置），保持当前分页状态；如果是重置或加载更多，更新分页状态
        if (reset) {
          this.setData({
            conversations: allConversations,
            page: currentPage + 1,
            hasMore: pageData.hasNext,
            loading: false
          });
        } else {
          // 刷新时只更新会话列表，不改变分页状态
          this.setData({
            conversations: allConversations,
            loading: false
          });
        }
        
        console.log('更新后的会话列表:', {
          total: allConversations.length,
          page: reset ? currentPage + 1 : this.data.page,
          hasMore: reset ? pageData.hasNext : this.data.hasMore,
          reset: reset
        });
      } else {
        this.setData({ loading: false });
      }
    } catch (e) {
      console.error('加载会话列表失败', e);
      wx.showToast({ title: '加载会话列表失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },
  // 下拉刷新
  async onPullDownRefresh() {
    if (this.data.showChat) {
      // 聊天界面，刷新消息列表
      await this.loadMessages();
      wx.stopPullDownRefresh();
    } else {
      // 会话列表，刷新会话列表
      this.setData({ refreshing: true });
      try {
        await this.loadConversations(true);
        wx.showToast({ title: '刷新成功', icon: 'success', duration: 1000 });
      } catch (e) {
        console.error('刷新会话列表失败', e);
        wx.showToast({ title: '刷新失败', icon: 'none' });
      } finally {
        this.setData({ refreshing: false });
        wx.stopPullDownRefresh();
      }
    }
  },
  // 上拉加载更多
  async onReachBottom() {
    if (!this.data.showChat && this.data.hasMore && !this.data.loading) {
      console.log('上拉加载更多会话');
      // 加载更多时，使用当前页码
      const currentPage = this.data.page;
      await this.loadMoreConversations(currentPage);
    }
  },
  // 加载更多会话（分页加载）
  async loadMoreConversations(page) {
    if (this.data.loading || !this.data.hasMore) {
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      const res = await request({ 
        url: '/api/messages/conversations',
        data: {
          page: page,
          size: this.data.size
        }
      });
      
      if (res.code === 0 && res.data) {
        const pageData = res.data;
        const messages = pageData.content || [];
        const currentUserId = this.data.currentUserId;
        
        if (!currentUserId) {
          this.setData({ loading: false });
          return;
        }
        
        // 按对方用户分组
        const conversationMap = new Map();
        const currentUserIdNum = Number(currentUserId);
        
        messages.forEach(msg => {
          const msgFromUser = Number(msg.fromUser);
          const msgToUser = Number(msg.toUser);
          const otherUserId = msgFromUser === currentUserIdNum ? msgToUser : msgFromUser;
          
          if (!conversationMap.has(otherUserId)) {
            conversationMap.set(otherUserId, {
              userId: otherUserId,
              lastMessage: msg,
              unreadMessages: [],
              productId: null
            });
          } else {
            const conv = conversationMap.get(otherUserId);
            if (new Date(msg.createdAt) > new Date(conv.lastMessage.createdAt)) {
              conv.lastMessage = msg;
            }
          }
          
          // 收集未读消息
          const isMessageToMe = msgToUser === currentUserIdNum;
          const isMessageFromOther = msgFromUser !== currentUserIdNum;
          const isUnread = (msg.readFlag === 0 || msg.readFlag === null || msg.readFlag === undefined);
          
          if (isMessageToMe && isMessageFromOther && isUnread) {
            const senderUserId = msgFromUser;
            const conv = conversationMap.get(senderUserId);
            if (conv) {
              if (!conv.unreadMessages) {
                conv.unreadMessages = [];
              }
              conv.unreadMessages.push(msg);
            }
          }
        });
        
        conversationMap.forEach((conv, otherUserId) => {
          conv.unreadCount = conv.unreadMessages ? conv.unreadMessages.length : 0;
          delete conv.unreadMessages;
        });
        
        let newConversations = Array.from(conversationMap.values()).map(conv => ({
          ...conv,
          userId: String(conv.userId),
          lastMessageContent: conv.lastMessage.content,
          lastMessageTime: this.formatTime(conv.lastMessage.createdAt),
          timeStr: this.formatTime(conv.lastMessage.createdAt),
          productId: conv.productId || null
        })).sort((a, b) => {
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });
        
        // 只加载新会话的用户信息
        const needLoadUserInfo = [];
        newConversations.forEach(newConv => {
          const existingIndex = this.data.conversations.findIndex(c => c.userId === newConv.userId);
          if (existingIndex < 0) {
            // 新会话，需要加载用户信息
            needLoadUserInfo.push(newConv);
          }
        });
        
        if (needLoadUserInfo.length > 0) {
          const userPromises = needLoadUserInfo.map(async (conv) => {
            try {
              const userRes = await request({ url: `/api/user/${conv.userId}` });
              if (userRes.code === 0 && userRes.data) {
                conv.userName = userRes.data.nickname || '用户';
                conv.userAvatar = userRes.data.avatarUrl || '';
              }
            } catch (e) {
              console.error(`加载用户${conv.userId}信息失败`, e);
            }
            return conv;
          });
          await Promise.all(userPromises);
        }
        
        // 合并到现有会话列表（去重）
        let allConversations = [...this.data.conversations];
        newConversations.forEach(newConv => {
          const existingIndex = allConversations.findIndex(c => c.userId === newConv.userId);
          if (existingIndex >= 0) {
            // 更新现有会话
            allConversations[existingIndex] = newConv;
          } else {
            // 添加新会话
            allConversations.push(newConv);
          }
        });
        
        allConversations.sort((a, b) => {
          return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
        });
        
        // 更新未读消息数
        const app = getApp();
        app.updateUnreadCount();
        
        this.setData({
          conversations: allConversations,
          page: page + 1,
          hasMore: pageData.hasNext,
          loading: false
        });
      }
    } catch (e) {
      console.error('加载更多会话失败', e);
      this.setData({ loading: false });
    }
  },
  openConversation(e) {
    console.log('点击会话项', e);
    
    // 确保事件对象存在
    if (!e || !e.currentTarget) {
      console.error('事件对象无效', e);
      return;
    }
    
    const userId = e.currentTarget.dataset.userid;
    const productId = e.currentTarget.dataset.productid;
    
    console.log('会话数据:', { userId, productId, dataset: e.currentTarget.dataset });
    
    if (!userId) {
      console.error('userId为空', e);
      wx.showToast({ title: '用户信息不完整', icon: 'none' });
      return;
    }
    
    // 清除会话列表定时器
    if (this.conversationTimer) {
      clearInterval(this.conversationTimer);
      this.conversationTimer = null;
    }
    
    console.log('准备打开聊天界面，userId:', userId, 'productId:', productId);
    
    // 设置聊天参数
    this.setData({ 
      userId: String(userId),  // 确保是字符串类型
      productId: productId ? String(productId) : null,
      productName: '',  // 清空商品名称
      showChat: true,
      messages: [],  // 清空之前的消息
      inputContent: '',  // 清空输入框
      productInfo: null,  // 清空商品信息
      isInitialLoad: true  // 标记为首次加载
    }, () => {
      console.log('setData完成，当前数据:', {
        userId: this.data.userId,
        productId: this.data.productId,
        showChat: this.data.showChat
      });
      
      wx.setNavigationBarTitle({ title: '聊天' });
      
      // 加载商品信息（如果有productId）
      if (productId) {
        this.loadProductInfo(productId);
      }
      
      // 加载用户信息
      this.loadUserInfo();
      
      // 加载消息
      this.loadMessages();
      
      // 标记该会话的所有消息为已读（确保 userId 是数字类型）
      const userIdNum = Number(userId);
      if (!isNaN(userIdNum)) {
        this.markConversationAsRead(userIdNum);
      }
      
      // 启动消息刷新定时器
      this.messageTimer = setInterval(() => this.loadMessages(), 5000);
    });
  },
  goBackToList() {
    // 清除消息定时器
    if (this.messageTimer) {
      clearInterval(this.messageTimer);
    }
    
    // 返回会话列表
    this.setData({ 
      userId: null,
      productId: null,
      productName: '',
      productInfo: null,
      messages: [],
      showChat: false
    });
    wx.setNavigationBarTitle({ title: '消息' });
    
    // 加载会话列表
    this.loadConversations(true);
    
    // 更新未读消息数
    const app = getApp();
    app.updateUnreadCount();
    
    // 启动会话列表刷新定时器（只更新消息，不重置列表）
    this.conversationTimer = setInterval(() => this.loadConversations(false), 10000);
  },
  // 标记会话为已读
  async markConversationAsRead(userId) {
    if (!userId) {
      console.warn('markConversationAsRead: userId为空');
      return;
    }
    try {
      console.log('标记会话为已读，userId:', userId);
      await request({
        url: `/api/messages/conversation/${userId}/read`,
        method: 'PATCH'
      });
      console.log('标记会话为已读成功');
      // 标记后立即更新未读消息数
      const app = getApp();
      await app.updateUnreadCount();
      // 直接更新会话列表中该会话的未读数量为0
      const conversations = this.data.conversations || [];
      const updatedConversations = conversations.map(conv => {
        if (String(conv.userId) === String(userId)) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
      this.setData({ conversations: updatedConversations });
    } catch (e) {
      console.error('标记会话为已读失败', e);
    }
  }
});
