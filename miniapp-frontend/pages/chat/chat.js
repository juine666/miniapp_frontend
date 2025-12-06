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
    contextMenuIsTranslated: false,
    lastMessageTime: 0,
    pollingTimer: null,
    scrollTop: 999999,
    toView: '',
    replyingTo: null,
    replyingToNickname: '',
    showAtUserList: false,
    onlineUsers: []
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
    let content = this.data.inputContent.trim();
    if (!content) {
      wx.showToast({ title: '消息不能为空', icon: 'none' });
      return;
    }

    // 提取@的用户名
    const atUsernames = [];
    const atRegex = /@([^\s]+)/g;
    let match;
    while ((match = atRegex.exec(content)) !== null) {
      atUsernames.push(match[1]);
    }

    try {
      wx.showLoading({ title: '发送中...' });
      
      let url = '/api/chat/send?productId=' + this.data.productId + 
                '&userId=' + encodeURIComponent(this.data.currentUserId) +
                '&nickname=' + encodeURIComponent(this.data.currentUserNickname) +
                '&avatarUrl=' + encodeURIComponent(this.data.currentUserAvatar || '') +
                '&content=' + encodeURIComponent(content) +
                (this.data.replyingTo ? '&replyToId=' + this.data.replyingTo : '');
      
      // 如果有@用户，添加到参数中
      if (atUsernames.length > 0) {
        url += '&atUsernames=' + encodeURIComponent(JSON.stringify(atUsernames));
      }
      
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
    const userId = e.currentTarget.dataset.userId;
    const isTranslated = e.currentTarget.dataset.isTranslated === 'true';
    
    // 不再直接获取content，而是通过messageId在使用时查找
    // 这样可以避免跨行内容在data属性中传递时可能出现的问题

    this.setData({
      showContextMenu: true,
      contextMenuMessageId: messageId,
      contextMenuUserId: userId,
      contextMenuIsTranslated: isTranslated
    });
  },

  // 处理翻译内容的长按事件
  onLongPressTranslatedMessage(e) {
    const messageId = e.currentTarget.dataset.messageId;
    const userId = e.currentTarget.dataset.userId;
    const isTranslated = e.currentTarget.dataset.isTranslated === 'true';
    
    // 不再直接获取content，而是通过messageId在使用时查找
    // 这样可以避免跨行内容在data属性中传递时可能出现的问题

    this.setData({
      showContextMenu: true,
      contextMenuMessageId: messageId,
      contextMenuUserId: userId,
      contextMenuIsTranslated: isTranslated
    });
  },
  
  // 点击朗诵按钮朗读翻译内容
  async speakTranslatedText(e) {
    const messageId = e.currentTarget.dataset.messageId;
    
    if (!messageId) {
      wx.showToast({ title: '消息ID为空', icon: 'none' });
      return;
    }
    
    // 从消息数据中查找对应的翻译内容
    const message = this.data.messages.find(msg => msg.id === messageId);
    if (!message || !message.translatedText) {
      wx.showToast({ title: '未找到翻译内容', icon: 'none' });
      return;
    }
    
    // 注意：这里直接使用已经翻译好的英文内容，不再重复翻译
    const translatedText = message.translatedText;
    console.log('=== 朗诵功能调试信息 ===');
    console.log('获取到的翻译内容:', translatedText);
    console.log('内容类型:', typeof translatedText);
    console.log('内容长度:', translatedText.length);
    console.log('是否包含换行符:', translatedText.includes('\n'));
    console.log('是否包含回车符:', translatedText.includes('\r'));
    console.log('内容JSON格式:', JSON.stringify(translatedText));
    console.log('内容ASCII码:', translatedText.split('').map(c => c.charCodeAt(0)));
    
    // 检查是否包含特殊字符
    const hasSpecialChars = /[\r\n\t]/.test(translatedText);
    console.log('是否包含特殊字符:', hasSpecialChars);
    
    // 尝试将换行符替换为句号和空格，以帮助TTS更好地处理
    const processedText = translatedText.replace(/\r\n/g, '. ').replace(/\n/g, '. ').replace(/\r/g, '. ').trim();
    console.log('处理后的文本:', processedText);

    try {
      console.log('朗读的文本:', processedText);
      wx.showLoading({ title: '合成中...' });
      
      // 直接调用TTS接口朗读英文内容，不再重复翻译
      const ttsRes = await request({
        url: `/api/chat/messages/${messageId}/tts`,
        method: 'POST',
        data: { text: processedText, voice: 'female', language: 'en-US' }
      });

      console.log('TTS结果:', ttsRes);
      console.log('TTS结果数据类型:', typeof ttsRes.data);

      wx.hideLoading();
      
      if (ttsRes.code === 0 && ttsRes.data) {
        // 检查音频数据是否存在
        if (!ttsRes.data || (typeof ttsRes.data === 'string' && ttsRes.data.trim() === '')) {
          console.error('TTS返回的音频数据为空');
          wx.showToast({ title: '音频数据为空', icon: 'none' });
          return;
        }
        
        console.log('音频数据前100字符:', typeof ttsRes.data === 'string' ? ttsRes.data.substring(0, 100) : '非字符串');
        
        // 处理base64音频数据
        if (typeof ttsRes.data === 'string' && ttsRes.data.startsWith('data:audio')) {
          // 直接使用base64数据
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = ttsRes.data;
          console.log('开始播放音频...');
          audioContext.play();
          
          audioContext.onPlay(() => {
            console.log('音频开始播放');
          });
          
          audioContext.onError((err) => {
            console.error('音频播放错误:', err);
            wx.showToast({ title: '播放失败', icon: 'none' });
          });
          
          audioContext.onEnded(() => {
            console.log('音频播放结束');
          });
        } else if (typeof ttsRes.data === 'object' && ttsRes.data.audioUrl) {
          // 处理对象格式的音频URL
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = ttsRes.data.audioUrl;
          console.log('开始播放音频...');
          audioContext.play();
          
          audioContext.onPlay(() => {
            console.log('音频开始播放');
          });
          
          audioContext.onError(() => {
            wx.showToast({ title: '播放失败', icon: 'none' });
          });
          
          audioContext.onEnded(() => {
            console.log('音频播放结束');
          });
        } else if (typeof ttsRes.data === 'object' && ttsRes.data.url) {
          // 处理对象格式的音频URL
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = ttsRes.data.url;
          console.log('开始播放音频...');
          audioContext.play();
          
          audioContext.onPlay(() => {
            console.log('音频开始播放');
          });
          
          audioContext.onError(() => {
            wx.showToast({ title: '播放失败', icon: 'none' });
          });
          
          audioContext.onEnded(() => {
            console.log('音频播放结束');
          });
        } else {
          console.error('不支持的音频数据格式:', ttsRes.data);
          wx.showToast({ title: '音频格式不支持', icon: 'none' });
        }
      } else {
        console.error('TTS生成失败:', ttsRes.message);
        wx.showToast({ title: ttsRes.message || '生成音频失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('朗诵失败', e);
      wx.showToast({ title: '朗诵失败: ' + (e.message || '未知错误'), icon: 'none' });
    }
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

  showAtUserList() {
    // 模拟在线用户列表
    const onlineUsers = [
      { userId: 'user1', nickname: '张三', avatarUrl: '' },
      { userId: 'user2', nickname: '李四', avatarUrl: '' },
      { userId: 'user3', nickname: '王五', avatarUrl: '' }
    ];
    
    this.setData({
      showAtUserList: true,
      onlineUsers: onlineUsers
    });
  },

  closeAtUserList() {
    this.setData({
      showAtUserList: false
    });
  },

  selectAtUser(e) {
    const userId = e.currentTarget.dataset.userId;
    const nickname = e.currentTarget.dataset.nickname;
    
    // 在输入框中插入@用户名
    const currentContent = this.data.inputContent;
    const newContent = currentContent + '@' + nickname + ' ';
    
    this.setData({
      inputContent: newContent,
      showAtUserList: false
    });
  },

  async translateMessage() {
    const messageId = this.data.contextMenuMessageId;
    const isTranslated = this.data.contextMenuIsTranslated;
    if (!messageId) return;

    // 如果已经翻译过了，就不再翻译
    if (isTranslated) {
      wx.showToast({ title: '已经是翻译内容', icon: 'none' });
      this.closeContextMenu();
      return;
    }
    
    // 从消息数据中查找对应的原始内容
    const message = this.data.messages.find(msg => msg.id === messageId);
    if (!message) {
      wx.showToast({ title: '未找到消息内容', icon: 'none' });
      this.closeContextMenu();
      return;
    }
    
    const content = message.content || '';

    try {
      wx.showLoading({ title: '翻译中...' });
      
      const res = await request({
        url: `/api/chat/messages/${messageId}/translate`,
        method: 'POST',
        data: { text: content }
      });

      console.log('聊天室翻译结果:', res);

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
    const messageId = this.data.contextMenuMessageId;
    const isTranslated = this.data.contextMenuIsTranslated;
    if (!messageId) return;

    // 从消息数据中查找对应的消息内容
    const message = this.data.messages.find(msg => msg.id === messageId);
    if (!message) {
      wx.showToast({ title: '未找到消息内容', icon: 'none' });
      this.closeContextMenu();
      return;
    }
    
    // 获取要处理的内容
    let content = '';
    if (isTranslated) {
      // 如果是翻译内容，直接使用翻译文本
      content = message.translatedText || '';
    } else {
      // 如果是原始内容，使用原始文本
      content = message.content || '';
    }
    
    console.log('=== 长按菜单朗读功能调试信息 ===');
    console.log('获取到的内容:', content);
    console.log('内容类型:', typeof content);
    console.log('内容长度:', content.length);
    console.log('是否包含换行符:', content.includes('\n'));
    console.log('是否包含回车符:', content.includes('\r'));
    console.log('是否为翻译内容:', isTranslated);
    console.log('内容JSON格式:', JSON.stringify(content));
    
    // 检查是否包含特殊字符
    const hasSpecialChars = /[\r\n\t]/.test(content);
    console.log('是否包含特殊字符:', hasSpecialChars);
    
    // 尝试将换行符替换为句号和空格，以帮助TTS更好地处理
    const processedContent = content.replace(/\r\n/g, '. ').replace(/\n/g, '. ').replace(/\r/g, '. ').trim();
    console.log('处理后的文本:', processedContent);

    try {
      let textToSpeak = processedContent;  // 使用处理后的文本
      
      // 如果选中的不是翻译内容，则需要先翻译
      if (!isTranslated) {
        wx.showLoading({ title: '翻译中...' });
        
        // 先翻译
        const translateRes = await request({
          url: `/api/chat/messages/${messageId}/translate`,
          method: 'POST',
          data: { text: processedContent }  // 使用处理后的文本
        });

        console.log('翻译结果:', translateRes);
        console.log('翻译结果数据类型:', typeof translateRes.data);

        if (translateRes.code !== 0) {
          wx.hideLoading();
          console.error('翻译失败:', translateRes.message);
          wx.showToast({ title: translateRes.message || '翻译失败', icon: 'none' });
          this.closeContextMenu();
          return;
        }
        
        // 检查翻译结果是否为空
        textToSpeak = translateRes.data;
        console.log('翻译后的文本:', textToSpeak);
        console.log('翻译后是否包含换行符:', textToSpeak.includes('\n'));
        
        // 对翻译结果也进行处理
        textToSpeak = textToSpeak.replace(/\r\n/g, '. ').replace(/\n/g, '. ').replace(/\r/g, '. ').trim();
        console.log('处理后的翻译文本:', textToSpeak);
        
        if (!textToSpeak || textToSpeak.trim() === '') {
          wx.hideLoading();
          console.error('翻译结果为空');
          wx.showToast({ title: '翻译结果为空', icon: 'none' });
          this.closeContextMenu();
          return;
        }
      }
      
      console.log('朗读的文本:', textToSpeak);
      wx.showLoading({ title: '合成中...' });
      
      // 再TTS
      const ttsRes = await request({
        url: `/api/chat/messages/${messageId}/tts`,
        method: 'POST',
        data: { text: textToSpeak, voice: 'female', language: 'en-US' }
      });

      console.log('TTS结果:', ttsRes);
      console.log('TTS结果数据类型:', typeof ttsRes.data);

      wx.hideLoading();
      
      if (ttsRes.code === 0 && ttsRes.data) {
        // 检查音频数据是否存在
        if (!ttsRes.data || (typeof ttsRes.data === 'string' && ttsRes.data.trim() === '')) {
          console.error('TTS返回的音频数据为空');
          wx.showToast({ title: '音频数据为空', icon: 'none' });
          this.closeContextMenu();
          return;
        }
        
        console.log('音频数据前100字符:', typeof ttsRes.data === 'string' ? ttsRes.data.substring(0, 100) : '非字符串');
        
        // 处理base64音频数据
        if (typeof ttsRes.data === 'string' && ttsRes.data.startsWith('data:audio')) {
          // 直接使用base64数据
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = ttsRes.data;
          console.log('开始播放音频...');
          audioContext.play();
          
          audioContext.onPlay(() => {
            console.log('音频开始播放');
          });
          
          audioContext.onError((err) => {
            console.error('音频播放错误:', err);
            wx.showToast({ title: '播放失败', icon: 'none' });
          });
          
          audioContext.onEnded(() => {
            console.log('音频播放结束');
          });
        } else if (typeof ttsRes.data === 'object' && ttsRes.data.audioUrl) {
          // 处理对象格式的音频URL
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = ttsRes.data.audioUrl;
          console.log('开始播放音频...');
          audioContext.play();
          
          audioContext.onPlay(() => {
            console.log('音频开始播放');
          });
          
          audioContext.onError(() => {
            wx.showToast({ title: '播放失败', icon: 'none' });
          });
          
          audioContext.onEnded(() => {
            console.log('音频播放结束');
          });
        } else if (typeof ttsRes.data === 'object' && ttsRes.data.url) {
          // 处理对象格式的音频URL
          const audioContext = wx.createInnerAudioContext();
          audioContext.src = ttsRes.data.url;
          console.log('开始播放音频...');
          audioContext.play();
          
          audioContext.onPlay(() => {
            console.log('音频开始播放');
          });
          
          audioContext.onError(() => {
            wx.showToast({ title: '播放失败', icon: 'none' });
          });
          
          audioContext.onEnded(() => {
            console.log('音频播放结束');
          });
        } else {
          console.error('不支持的音频数据格式:', ttsRes.data);
          wx.showToast({ title: '音频格式不支持', icon: 'none' });
        }
      } else {
        console.error('TTS生成失败:', ttsRes.message);
        wx.showToast({ title: ttsRes.message || '生成音频失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('朗诵失败', e);
      wx.showToast({ title: '朗诵失败: ' + (e.message || '未知错误'), icon: 'none' });
    }

    this.closeContextMenu();
  },

  copyMessage() {
    const messageId = this.data.contextMenuMessageId;
    const isTranslated = this.data.contextMenuIsTranslated;
    if (!messageId) return;
    
    // 从消息数据中查找对应的内容
    const message = this.data.messages.find(msg => msg.id === messageId);
    if (!message) {
      wx.showToast({ title: '未找到消息内容', icon: 'none' });
      this.closeContextMenu();
      return;
    }
    
    // 获取要复制的内容
    let content = '';
    if (isTranslated) {
      // 如果是翻译内容，复制翻译文本
      content = message.translatedText || '';
    } else {
      // 如果是原始内容，复制原始文本
      content = message.content || '';
    }
    
    if (!content) {
      this.closeContextMenu();
      return;
    }

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
