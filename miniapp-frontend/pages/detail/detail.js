const { request } = require('../../utils/request');

Page({
  data: { 
    id: null, 
    item: {}, 
    isFavorited: false,
    sellerInfo: { nickname: '卖家', avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg' },
    sellerContact: null,
    categoryName: '未分类',
    loading: false,
    imageList: [],
    currentImageIndex: 0,
    currentUserId: null,
    isMyProduct: false,
    // 评论相关
    comments: [],
    showCommentModal: false,
    commentInput: '',
    showPublishComment: false,
    selectedEmotion: null,
    emotions: ['😀', '😂', '😍', '😱', '👍', '❤️', '🔥', '😢'],
    expandedTranslateIds: [],
    contextMenu: { visible: false, commentId: null, x: 0, y: 0 },
    // 语音相关
    voices: [],
    showVoiceInput: false,
    isRecording: false,
    recordingTime: 0,
    recordingTimer: null
  },

  onLoad(query) {
    const id = query.id || query.productId;
    if (!id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      return;
    }
    
    const newId = String(id);
    this.setData({ id: newId });
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    // 页面初始化时加载数据
    this.loadCurrentUser();
    this.loadDetail();
    this.checkFavorite();
    this.loadComments();
    this.loadVoices();
  },

  onShow() {
    const id = this.data.id;
    if (id) {
      // 返回页面时仅重新检查收藏状态，不重新加载评论和语音
      this.checkFavorite();
    }
  },

  async loadCurrentUser() {
    try {
      const res = await request({ url: '/api/user/me' });
      if (res.code === 0 && res.data) {
        this.setData({ currentUserId: res.data.id });
      }
    } catch (e) {
      console.warn('加载当前用户失败:', e.message);
    }
  },

  async loadDetail() {
    const id = this.data.id;
    if (!id) return;
    
    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });
      
      const res = await request({ url: `/api/products/${id}` });
      
      if (res.code === 0 && res.data) {
        const data = res.data;
        
        // 处理图片列表
        let imageList = [];
        if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
          imageList = data.imageUrls;
        } else if (data.coverUrl) {
          try {
            if (typeof data.coverUrl === 'string' && data.coverUrl.startsWith('[')) {
              imageList = JSON.parse(data.coverUrl);
            } else {
              imageList = [data.coverUrl];
            }
          } catch (e) {
            imageList = [data.coverUrl];
          }
        }
        
        // 设置商品信息
        this.setData({ 
          item: {
            id: data.id,
            name: data.name || '商品名称',
            description: data.description || '',
            price: data.price || 0,
            coverUrl: imageList.length > 0 ? imageList[0] : '',
            categoryId: data.categoryId,
            sellerId: data.sellerId,
            status: data.status || 'PUBLISHED',
            createdAt: data.createdAt
          },
          imageList: imageList,
          currentImageIndex: 0
        });
        
        // 加载卖家信息和联系方式
        if (data.seller) {
          this.setData({ sellerInfo: data.seller });
        } else if (data.sellerId) {
          this.loadSellerInfo(data.sellerId);
        }
        
        if (data.sellerId) {
          this.loadSellerContact(data.sellerId);
        }
        
        // 设置分类名称
        if (data.categoryName) {
          this.setData({ categoryName: data.categoryName });
        } else if (data.categoryId) {
          this.loadCategoryInfo(data.categoryId);
        }
        
        // 判断是否是自己的商品
        const isMyProduct = this.data.currentUserId && data.sellerId && 
                          String(this.data.currentUserId) === String(data.sellerId);
        this.setData({ isMyProduct, loading: false });
      } else {
        this.setData({ loading: false });
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      }
    } catch (e) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async loadSellerInfo(sellerId) {
    try {
      const res = await request({ url: `/api/user/${sellerId}` });
      if (res.code === 0 && res.data) {
        this.setData({ sellerInfo: res.data });
      }
    } catch (e) {
      console.warn('加载卖家信息失败:', e.message);
    }
  },

  async loadSellerContact(sellerId) {
    try {
      const res = await request({ url: `/api/user/${sellerId}/contact` });
      if (res.code === 0 && res.data) {
        this.setData({ sellerContact: res.data });
      }
    } catch (e) {
      console.warn('加载卖家联系方式失败:', e.message);
    }
  },

  async loadCategoryInfo(categoryId) {
    try {
      const res = await request({ url: `/api/categories` });
      if (res.code === 0) {
        const category = (res.data || []).find(c => c.id === categoryId);
        if (category) {
          this.setData({ categoryName: category.name });
        }
      }
    } catch (e) {
      console.warn('加载分类信息失败:', e.message);
    }
  },

  async checkFavorite() {
    const id = this.data.id;
    if (!id) return;
    try {
      const res = await request({ url: `/api/favorites/check/${id}` });
      if (res.code === 0) {
        this.setData({ isFavorited: res.data });
      }
    } catch (e) {
      console.warn('检查收藏状态失败:', e.message);
    }
  },

  onSwiperChange(e) {
    this.setData({ currentImageIndex: e.detail.current });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index || 0;
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    });
  },

  toggleFavorite() {
    const id = this.data.id;
    if (!id) return;
    
    try {
      request({
        url: this.data.isFavorited ? `/api/favorites/${id}` : '/api/favorites',
        method: this.data.isFavorited ? 'DELETE' : 'POST',
        data: this.data.isFavorited ? {} : { productId: id }
      }).then(res => {
        if (res.code === 0) {
          this.setData({ isFavorited: !this.data.isFavorited });
        }
      });
    } catch (e) {
      console.error('切换收藏失败', e);
    }
  },

  onChat() {
    if (!this.data.item.sellerId) {
      wx.showToast({ title: '卖家信息不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/message/message?userId=${this.data.item.sellerId}&userName=${this.data.sellerInfo.nickname}`
    });
  },

  goEdit() {
    wx.navigateTo({
      url: `/pages/publish/publish?id=${this.data.id}`
    });
  },

  // ========== 评论相关方法 ==========
  showCommentModal() {
    this.setData({ showCommentModal: true });
  },

  hideCommentModal() {
    this.setData({ showCommentModal: false, showPublishComment: false, commentInput: '' });
  },

  togglePublishComment() {
    this.setData({ showPublishComment: !this.data.showPublishComment, showVoiceInput: false, commentInput: '', recordingTime: 0 });
  },

  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ showVoiceInput: mode === 'voice', commentInput: '', recordingTime: 0 });
  },

  onCommentInput(e) {
    this.setData({ commentInput: e.detail.value });
  },

  onSelectEmotion(e) {
    const emotion = e.currentTarget.dataset.emotion;
    this.setData({ selectedEmotion: emotion });
  },

  async loadComments() {
    if (!this.data.id) return;
    try {
      const res = await request({ url: `/api/comments/product/${this.data.id}` });
      if (res.code === 0 && res.data) {
        const comments = res.data.records || [];
        this.setData({ comments: comments });
      }
    } catch (e) {
      console.warn('加载评论失败:', e.message);
    }
  },

  async publishComment() {
    const { commentInput, selectedEmotion, id } = this.data;
    if (!commentInput.trim()) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '发送中...' });
      const res = await request({
        url: '/api/comments',
        method: 'POST',
        data: {
          productId: id,
          content: commentInput,
          emotion: selectedEmotion || '',
          parentId: null
        }
      });
      wx.hideLoading();
      if (res.code === 0) {
        wx.showToast({ title: '发表成功', icon: 'success' });
        this.setData({ showPublishComment: false, commentInput: '', selectedEmotion: null });
        this.loadComments();
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '发表失败', icon: 'none' });
    }
  },

  showCommentMenu(e) {
    const commentId = e.currentTarget.dataset.commentId;
    const touches = e.touches[0];
    this.setData({
      contextMenu: {
        visible: true,
        commentId: commentId,
        x: touches.clientX - 100,
        y: touches.clientY - 50
      }
    });
    setTimeout(() => {
      this.setData({ contextMenu: { visible: false } });
    }, 3000);
  },

  copyCommentText(e) {
    const text = e.currentTarget.dataset.text;
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' });
        this.setData({ contextMenu: { visible: false } });
      }
    });
  },

  toggleTranslate(e) {
    const commentId = e.currentTarget.dataset.commentId;
    let expandedIds = this.data.expandedTranslateIds;
    const index = expandedIds.indexOf(commentId);
    if (index > -1) {
      expandedIds.splice(index, 1);
    } else {
      expandedIds.push(commentId);
      this.translateComment(commentId);
    }
    this.setData({ expandedTranslateIds: expandedIds, contextMenu: { visible: false } });
  },

  async translateComment(commentId) {
    try {
      const comment = this.data.comments.find(c => c.id === commentId);
      if (!comment) return;
      const res = await request({
        url: `/api/comments/${commentId}/translate`,
        method: 'POST',
        data: { text: comment.content }
      });
      if (res.code === 0) {
        const comments = this.data.comments.map(c => {
          if (c.id === commentId) {
            c.translatedText = res.data;
          }
          return c;
        });
        this.setData({ comments: comments });
      }
    } catch (e) {
      console.warn('翻译失败:', e.message);
    }
  },

  async playTranslationVoice(e) {
    const commentId = e.currentTarget.dataset.commentId;
    const voice = e.currentTarget.dataset.voice;
    const comment = this.data.comments.find(c => c.id === commentId);
    if (comment && comment.translatedText) {
      this.synthesizeAndPlay(comment.translatedText, voice === 'female' ? 'joanna' : 'joey');
    }
  },

  async synthesizeAndPlay(text, voice) {
    if (!text) return;
    try {
      wx.showLoading({ title: '合成中...' });
      const res = await request({
        url: '/api/tts/synthesize',
        method: 'POST',
        data: { text: text, voice: voice, language: 'en-US' }
      });
      wx.hideLoading();
      if (res.code === 0 && res.data) {
        const audioContext = wx.createInnerAudioContext();
        audioContext.src = res.data;
        audioContext.play();
      }
    } catch (e) {
      wx.hideLoading();
      console.warn('合成失败:', e.message);
    }
  },

  likeComment(e) {
    const commentId = e.currentTarget.dataset.commentId;
    this.toggleLike(commentId);
  },

  async toggleLike(commentId) {
    try {
      const res = await request({
        url: `/api/comments/${commentId}/like`,
        method: 'POST'
      });
      if (res.code === 0) {
        this.loadComments();
      }
    } catch (e) {
      console.warn('点赞失败:', e.message);
    }
  },

  // ========== 语音相关方法 ==========
  async loadVoices() {
    if (!this.data.id) return;
    try {
      const res = await request({ url: `/api/voices/product/${this.data.id}` });
      if (res.code === 0 && res.data) {
        this.setData({ voices: res.data });
      }
    } catch (e) {
      console.warn('加载语音失败:', e.message);
    }
  },

  toggleVoiceInput() {
    this.setData({ showVoiceInput: !this.data.showVoiceInput });
  },

  startRecording() {
    const recorderManager = wx.getRecorderManager();
    recorderManager.onStart(() => {
      this.setData({ isRecording: true, recordingTime: 0 });
      this.recordingTimer = setInterval(() => {
        this.setData({ recordingTime: this.data.recordingTime + 1 });
      }, 1000);
    });
    recorderManager.start({ format: 'mp3' });
  },

  stopRecording() {
    const recorderManager = wx.getRecorderManager();
    clearInterval(this.recordingTimer);
    recorderManager.stop();
    this.setData({ isRecording: false });
    recorderManager.onStop((res) => {
      if (res.tempFilePath) {
        this.recognizeVoice(res.tempFilePath);
      }
    });
  },

  async recognizeVoice(filePath) {
    try {
      wx.showLoading({ title: '正在识别...' });
      const res = await request({
        url: '/api/voices/recognize',
        method: 'POST',
        data: { voiceFile: filePath }
      });
      wx.hideLoading();
      if (res.code === 0 && res.data) {
        此处设置识别的文字到输入框
        this.setData({ commentInput: res.data });
      } else {
        wx.showToast({ title: '识别失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      wx.showToast({ title: '识别失败', icon: 'none' });
    }
  },

  playVoice(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    const audioContext = wx.createInnerAudioContext();
    audioContext.src = url;
    audioContext.play();
  },

  async uploadVoice(filePath) {
    try {
      wx.showLoading({ title: '上传中...' });
      // TODO: 实际应该使用OSS上传
      const res = await request({
        url: '/api/voices',
        method: 'POST',
        data: { productId: this.data.id, voiceUrl: 'https://placeholder-url' }
      });
      wx.hideLoading();
      if (res.code === 0) {
        this.setData({ showVoiceInput: false });
        this.loadVoices();
      }
    } catch (e) {
      wx.hideLoading();
      console.warn('上传语音失败:', e.message);
    }
  },

  copyContact(e) {
    const value = e.currentTarget.dataset.value;
    if (!value) return;
    wx.setClipboardData({
      data: value,
      success: () => {
        wx.showToast({ title: '已复制到剪贴板', icon: 'success', duration: 1500 });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  }
});
