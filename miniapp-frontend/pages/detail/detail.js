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
    // ... 其他数据 ...
    selectedEmotion: null,
    expandedTranslateIds: [],
    expandedReplies: {}, // 记录展开的回复（按评论ID）
    contextMenu: { visible: false, commentId: null, x: 0, y: 0 },
    // 回复相关
    replyingToId: null,
    replyingToUser: null,
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
    // 总是重新加载数据
    this.setData({ 
      id: newId,
      item: {},
      imageList: [],
      comments: [],
      voices: []
    });
    
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    // 检查是否已登录，如果没登录则先登录
    const app = getApp();
    const token = app?.globalData?.token || wx.getStorageSync('token');
    
    if (!token) {
      // 未登录，先触发自动登录
      console.log('未登录，触发自动登录');
      app.doLogin().then(() => {
        // 登录成功，加载数据
        this.loadCurrentUser();
        this.loadDetail();
        this.checkFavorite();
        this.loadComments();
        this.loadVoices();
      }).catch(() => {
        // 登录失败，弹窗提示用户手动登录
        wx.showModal({
          title: '需要登录',
          content: '需要登录才能查看完整信息，是否现在登录？',
          confirmText: '现在登录',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              // 调起微信登录授权
              wx.login({
                success: (loginRes) => {
                  if (loginRes.code) {
                    // 获取登录code成功，调用后端接口进行登录
                    this.doWechatLogin(loginRes.code);
                  } else {
                    wx.showToast({ title: '登录失败，请重试', icon: 'none' });
                  }
                },
                fail: () => {
                  wx.showToast({ title: '调起登录失败', icon: 'none' });
                }
              });
            }
          }
        });
      });
    } else {
      // 已登录，直接加载
      this.loadCurrentUser();
      this.loadDetail();
      this.checkFavorite();
      this.loadComments();
      this.loadVoices();
    }
  },

  doWechatLogin(code) {
    // 调用后端真实登录接口
    wx.request({
      url: getApp().globalData.baseURL + '/api/auth/wechat/login',
      method: 'POST',
      data: { 
        code: code,
        nickname: '用户' + Math.floor(Math.random() * 10000),
        avatarUrl: ''
      },
      success: (res) => {
        if (res.data && res.data.code === 0) {
          const { token, openid, userId } = res.data.data;
          
          // 保存登录信息
          const app = getApp();
          app.globalData.token = token;
          app.globalData.openid = openid;
          app.globalData.userId = userId;
          wx.setStorageSync('token', token);
          wx.setStorageSync('openid', openid);
          wx.setStorageSync('userId', userId);
          
          // 设置当前用户ID
          this.setData({ currentUserId: userId });
          
          // 登录成功后加载数据
          this.loadCurrentUser();
          this.loadDetail();
          this.checkFavorite();
          this.loadComments();
          this.loadVoices();
          
          wx.showToast({ title: '登录成功', icon: 'success' });
        } else {
          wx.showToast({ title: res.data?.message || '登录失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('登录请求失败:', err);
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    });
  },

  onShow() {
    const id = this.data.id;
    if (id) {
      // 返回页面时重新加载数据
      this.loadDetail();
      this.checkFavorite();
      this.loadComments();
      this.loadVoices();
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
    
    // 检查是否已登录
    const currentUserId = this.data.currentUserId;
    if (!currentUserId) {
      this.setData({ isFavorited: false });
      return;
    }
    
    try {
      const res = await request({ url: `/api/favorites/check/${id}` });
      if (res.code === 0) {
        this.setData({ isFavorited: res.data });
      }
    } catch (e) {
      console.warn('检查收藏状态失败:', e.message);
      this.setData({ isFavorited: false });
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

  goChat() {
    if (!this.data.id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/chat/chat?productId=${this.data.id}`
    });
  },

  goEdit() {
    wx.navigateTo({
      url: `/pages/publish/publish?id=${this.data.id}`
    });
  },

  // ========== 评论相关方法 ==========
  noop() {
    // 乺操作，仅用于需止事件决事决
  },

  showCommentModal() {
    // 检查是否已登录
    const currentUserId = this.data.currentUserId;
    if (!currentUserId) {
      // 未登录，弹窗提示
      wx.showModal({
        title: '需要登录',
        content: '需要登录才能发表评论，是否现在登录？',
        confirmText: '现在登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 调起微信登录
            wx.login({
              success: (loginRes) => {
                if (loginRes.code) {
                  this.doWechatLogin(loginRes.code);
                } else {
                  wx.showToast({ title: '登录失败', icon: 'none' });
                }
              },
              fail: () => {
                wx.showToast({ title: '调起登录失败', icon: 'none' });
              }
            });
          }
        }
      });
      return;
    }
    
    // 已登录，打开评论框
    this.setData({ showCommentModal: true });
  },

  hideCommentModal() {
    this.setData({ 
      showCommentModal: false, 
      showPublishComment: false, 
      commentInput: '',
      replyingToId: null,
      replyingToUser: null
    });
  },

  togglePublishComment() {
    this.setData({ showPublishComment: !this.data.showPublishComment });
  },

  onCommentsScrollTop() {
    // 滚动到顶部
  },

  onCommentsScrollBottom() {
    // 滚动到底部，可以加载更多评论
  },

  switchInputMode(e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({ showVoiceInput: mode === 'voice', commentInput: '', recordingTime: 0 });
  },

  onEditorStatusChange(e) {
    // 编辑器状态变化（可选）
  },

  onEditorInput(e) {
    // 获取编辑器的纯文本内容（不是HTML）
    const text = e.detail.text || e.detail.html || '';
    this.setData({ commentInput: text });
  },

  formatText(e) {
    const format = e.currentTarget.dataset.format;
    const editorCtx = wx.createSelectorQuery().select('#richEditor').context();
    editorCtx.exec(() => {
      wx.createSelectorQuery().select('#richEditor').context((res) => {
        const ctx = res[0];
        if (ctx) {
          ctx.format(format);
        }
      }).exec();
    });
  },

  setTextColor() {
    wx.chooseColor({
      success: (colorRes) => {
        const editorCtx = wx.createSelectorQuery().select('#richEditor').context();
        editorCtx.exec((res) => {
          if (res && res.length > 0 && res[0]) {
            res[0].format('color', colorRes.color);
          }
        });
      }
    });
  },

  insertImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 这里应该先上传图片到服务器，然后获取URL
        // 暂时使用本地路径
        const imagePath = res.tempFilePaths[0];
        const editorCtx = wx.createSelectorQuery().select('#richEditor').context();
        editorCtx.exec((res) => {
          if (res[0]) {
            res[0].insertImage({
              src: imagePath,
              data: {
                id: 'image_' + Date.now()
              }
            });
          }
        });
      }
    });
  },

  onSelectEmotion(e) {
    const emotion = e.currentTarget.dataset.emotion;
    // 将表情插入到富文本编辑器
    const editorCtx = wx.createSelectorQuery().select('#richEditor').context();
    editorCtx.exec((res) => {
      if (res && res.length > 0 && res[0]) {
        // 使用insertText插入文本
        res[0].insertText({
          text: emotion,
          success: () => {
            console.log('表情插入成功');
          },
          fail: () => {
            // 如果insertText不可用，直接更新commentInput
            const currentInput = this.data.commentInput || '';
            this.setData({ commentInput: currentInput + emotion });
          }
        });
      } else {
        // 编辑器不可用，直接更新commentInput
        const currentInput = this.data.commentInput || '';
        this.setData({ commentInput: currentInput + emotion });
      }
    });
    this.setData({ selectedEmotion: emotion });
  },

  async loadComments() {
    if (!this.data.id) return;
    try {
      const res = await request({ url: `/api/comments/product/${this.data.id}` });
      if (res.code === 0 && res.data) {
        let comments = res.data.records || [];
        
        // 加载每个一级评论的二级回复
        for (let comment of comments) {
          if (comment.id) {
            try {
              const repliesRes = await request({ url: `/api/comments/${comment.id}/replies` });
              if (repliesRes.code === 0 && repliesRes.data) {
                comment.replies = repliesRes.data;
                
                // 为每个二级回复加载三级回复
                for (let reply of comment.replies) {
                  if (reply.id) {
                    try {
                      const thirdLevelRes = await request({ url: `/api/comments/${reply.id}/replies` });
                      if (thirdLevelRes.code === 0 && thirdLevelRes.data) {
                        reply.replies = thirdLevelRes.data;
                        
                        // 为每个三级回复设置parentUser
                        reply.replies.forEach(thirdReply => {
                          if (thirdReply.parentId) {
                            const parentReply = comment.replies.find(r => r.id === thirdReply.parentId);
                            if (parentReply && parentReply.user) {
                              thirdReply.parentUser = parentReply.user;
                            }
                          }
                        });
                      }
                    } catch (e) {
                      console.warn('加载三级回复失败:', e.message);
                    }
                  }
                }
                
                // 为每个二级回复设置parentUser（被回复人的信息）
                comment.replies.forEach(reply => {
                  // 如果回复的parentId是二级回复的ID，需要找到它的parentUser
                  if (reply.parentId) {
                    // 在同一一级评论reply数组中查找
                    const parentReply = comment.replies.find(r => r.id === reply.parentId);
                    if (parentReply && parentReply.user) {
                      reply.parentUser = parentReply.user;
                    } else if (!reply.parentUser && reply.parentId === comment.id) {
                      // 如果是回复一级评论，使用一级评论user
                      reply.parentUser = comment.user;
                    }
                  }
                });
                
                // 默认显示前2条回复
                comment.displayReplies = repliesRes.data.slice(0, 2);
              } else {
                console.warn('回复响应不是200或data为undefined');
              }
            } catch (e) {
              console.warn('加载二级回复失败:', e.message);
            }
          }
        }
        
        this.setData({ comments: comments });
        
        // 计算总评论数（一级评论 + 所有二级回复）
        let totalCommentCount = comments.length;
        comments.forEach(c => {
          if (c.replies && c.replies.length > 0) {
            totalCommentCount += c.replies.length;
          }
        });
        this.setData({ totalCommentCount: totalCommentCount });
      }
    } catch (e) {
      console.warn('加载评论失败:', e.message);
    }
  },

  async publishComment() {
    // 直接使用commentInput中的内容（编辑器已经实时同步到commentInput）
    let plainText = this.data.commentInput ? this.data.commentInput.trim() : '';
    const { selectedEmotion, id, replyingToId } = this.data;
    
    // 删除HTML标签
    plainText = plainText.replace(/<[^>]*>/g, '').trim();
    
    if (!plainText) {
      wx.showToast({ title: '请输入评论', icon: 'none' });
      return;
    }
    
    // 发表评论
    this._doPublishComment(plainText, selectedEmotion, id, replyingToId);
  },

  async _doPublishComment(content, emotion, productId, replyingToId) {
    // 检查是否已登录
    const currentUserId = this.data.currentUserId;
    if (!currentUserId) {
      // 未登录，弹窗提示
      wx.showModal({
        title: '需要登录',
        content: '需要登录才能发表评论，是否现在登录？',
        confirmText: '现在登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 调起微信登录
            wx.login({
              success: (loginRes) => {
                if (loginRes.code) {
                  this.doWechatLogin(loginRes.code);
                } else {
                  wx.showToast({ title: '登录失败', icon: 'none' });
                }
              },
              fail: () => {
                wx.showToast({ title: '登录失败', icon: 'none' });
              }
            });
          }
        }
      });
      return;
    }
    
    try {
      wx.showLoading({ title: '发送中...' });
      
      // 如果replyingToId是二级回复，需要找到它所属的一级评论
      let parentId = replyingToId;
      if (replyingToId) {
        // 先在一级评论中查找
        let isFirstLevel = this.data.comments.find(c => c.id === replyingToId);
        if (!isFirstLevel) {
          // 如果不是一级评论，说明是二级回复，需要找到它的一级评论ID
          for (let c of this.data.comments) {
            if (c.replies && c.replies.length > 0) {
              let reply = c.replies.find(r => r.id === replyingToId);
              if (reply) {
                parentId = c.id; // 用一级评论的ID作为parentId
                break;
              }
            }
          }
        }
      }
      
      const res = await request({
        url: '/api/comments',
        method: 'POST',
        data: {
          productId: productId,
          content: content,
          emotion: emotion || '',
          parentId: parentId || null
        }
      });
      wx.hideLoading();
      if (res.code === 0) {
        wx.showToast({ title: '发表成功', icon: 'success' });
        // 清空编辑器
        wx.createSelectorQuery().select('#richEditor').context((res) => {
          if (res && res.length > 0 && res[0]) {
            res[0].clear();
          }
        }).exec();
        
        // 延迟后关闭输入框和清空数据
        setTimeout(() => {
          this.setData({ 
            showPublishComment: false, 
            commentInput: '', 
            selectedEmotion: null,
            showVoiceInput: false,
            replyingToId: null,
            replyingToUser: null
          });
          this.loadComments();
        }, 500);
      } else {
        wx.showToast({ title: res.message || '发表失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('发表评论错误:', e);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
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
    // 支持从事件对象或直接传入commentId
    if (commentId && commentId.currentTarget) {
      commentId = commentId.currentTarget.dataset.commentId;
    }
    
    try {
      // 先在一级评论中查找
      let targetItem = null;
      let targetPath = null;
      
      let comment = this.data.comments.find(c => c.id === commentId);
      if (comment) {
        targetItem = comment;
        targetPath = 'comments';
      } else {
        // 在二级回复中查找
        for (let i = 0; i < this.data.comments.length; i++) {
          let c = this.data.comments[i];
          if (c.replies && c.replies.length > 0) {
            let reply = c.replies.find(r => r.id === commentId);
            if (reply) {
              targetItem = reply;
              targetPath = `comments[${i}].replies`;
              break;
            }
            
            // 在三级回复中查找
            for (let j = 0; j < c.replies.length; j++) {
              let secondReply = c.replies[j];
              if (secondReply.replies && secondReply.replies.length > 0) {
                let thirdReply = secondReply.replies.find(tr => tr.id === commentId);
                if (thirdReply) {
                  targetItem = thirdReply;
                  targetPath = `comments[${i}].replies[${j}].replies`;
                  break;
                }
              }
            }
          }
          if (targetItem) break;
        }
      }
      
      if (!targetItem) return;
      
      wx.showLoading({ title: '翻译中...' });
      const res = await request({
        url: `/api/comments/${commentId}/translate`,
        method: 'POST',
        data: { text: targetItem.content }
      });
      wx.hideLoading();
      
      if (res.code === 0) {
        const comments = this.data.comments;
        
        // 找到不管是哪一级，都更新translatedText
        if (targetPath === 'comments') {
          // 一级评论
          comments.forEach(c => {
            if (c.id === commentId) {
              let translatedText = typeof res.data === 'string' ? res.data : (res.data?.translatedText || res.data?.text || JSON.stringify(res.data));
              translatedText = translatedText.replace(/<[^>]*>/g, '').trim();
              c.translatedText = translatedText;
            }
          });
        } else if (targetPath.includes('.replies')) {
          // 二级或三级回复
          comments.forEach(c => {
            if (c.replies) {
              c.replies.forEach(reply => {
                if (reply.id === commentId) {
                  let translatedText = typeof res.data === 'string' ? res.data : (res.data?.translatedText || res.data?.text || JSON.stringify(res.data));
                  translatedText = translatedText.replace(/<[^>]*>/g, '').trim();
                  reply.translatedText = translatedText;
                }
                
                // 也检查三级回复
                if (reply.replies) {
                  reply.replies.forEach(thirdReply => {
                    if (thirdReply.id === commentId) {
                      let translatedText = typeof res.data === 'string' ? res.data : (res.data?.translatedText || res.data?.text || JSON.stringify(res.data));
                      translatedText = translatedText.replace(/<[^>]*>/g, '').trim();
                      thirdReply.translatedText = translatedText;
                    }
                  });
                }
              });
            }
          });
        }
        
        this.setData({ comments: comments });
        wx.showToast({ title: '翻译成功', icon: 'success' });
      }
    } catch (e) {
      wx.hideLoading();
      console.warn('翻译失败:', e.message);
      wx.showToast({ title: '翻译失败', icon: 'none' });
    }
  },

  async translateAndSpeak(e) {
    const commentId = e.currentTarget.dataset.commentId;
    
    // 先在一级评论中查找
    let targetItem = null;
    
    let comment = this.data.comments.find(c => c.id === commentId);
    if (comment) {
      targetItem = comment;
    } else {
      // 在二级回复中查找
      for (let c of this.data.comments) {
        if (c.replies && c.replies.length > 0) {
          let reply = c.replies.find(r => r.id === commentId);
          if (reply) {
            targetItem = reply;
            break;
          }
          
          // 在三级回复中查找
          for (let secondReply of c.replies) {
            if (secondReply.replies && secondReply.replies.length > 0) {
              let thirdReply = secondReply.replies.find(tr => tr.id === commentId);
              if (thirdReply) {
                targetItem = thirdReply;
                break;
              }
            }
          }
        }
        if (targetItem) break;
      }
    }
    
    if (!targetItem) return;
    
    // 如果已有翻译，直接朗读
    if (targetItem.translatedText) {
      this.synthesizeAndPlay(targetItem.translatedText, 'female', commentId);
    } else {
      // 如果没有翻译，先翻译再朗读
      try {
        wx.showLoading({ title: '翻译中...' });
        const res = await request({
          url: `/api/comments/${commentId}/translate`,
          method: 'POST',
          data: { text: targetItem.content }
        });
        wx.hideLoading();
        
        if (res.code === 0 && res.data) {
          // 翻译成功，直接朗读
          let translatedText = typeof res.data === 'string' ? res.data : (res.data?.translatedText || res.data?.text || JSON.stringify(res.data));
          translatedText = translatedText.replace(/<[^>]*>/g, '').trim();
          this.synthesizeAndPlay(translatedText, 'female', commentId);
        } else {
          wx.showToast({ title: '翻译失败', icon: 'none' });
        }
      } catch (e) {
        wx.hideLoading();
        console.warn('翻译并朗诵失败:', e.message);
        wx.showToast({ title: '翻译失败，请重试', icon: 'none' });
      }
    }
  },

  async synthesizeAndPlay(text, voice, commentId) {
    if (!text) return;
    try {
      wx.showLoading({ title: '合成中...' });
      const url = commentId 
        ? `/api/comments/${commentId}/tts`  // 按评论ID缓存
        : '/api/tts/synthesize';  // 备用接口（兼容性）
      
      const res = await request({
        url: url,
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

  startReply(e) {
    console.log('startReply clicked, event:', e);
    console.log('dataset:', e.currentTarget.dataset);
    const commentId = e.currentTarget.dataset.commentId;
    console.log('commentId:', commentId);
    
    // 先在一级评论中查找
    let comment = this.data.comments.find(c => c.id === commentId);
    
    // 如果找不到，说明是二级或三级回复，需要在replies中查找
    if (!comment) {
      for (let c of this.data.comments) {
        if (c.replies && c.replies.length > 0) {
          // 先在二级中查找
          let reply = c.replies.find(r => r.id === commentId);
          if (reply) {
            // 找到了二级回复，用一级评论作为被回复的对象
            comment = c;
            break;
          }
          
          // 执在二级的三级回复中查找
          for (let secondReply of c.replies) {
            if (secondReply.replies && secondReply.replies.length > 0) {
              let thirdReply = secondReply.replies.find(tr => tr.id === commentId);
              if (thirdReply) {
                // 找到了三级回复，用一级评论作为被回复的对象
                comment = c;
                break;
              }
            }
          }
        }
        if (comment) break;
      }
    }
    
    console.log('found comment:', comment);
    if (!comment) return;
    
    this.setData({
      replyingToId: commentId,
      replyingToUser: comment.user.nickname,
      showPublishComment: true,
      commentInput: ''
    });
  },

  toggleReplies(e) {
    const commentId = e.currentTarget.dataset.commentId;
    const comments = this.data.comments.map(c => {
      if (c.id === commentId) {
        // 切换展开/折叠状态
        if (this.data.expandedReplies[commentId]) {
          // 当前是展开的，要折叠：只显示前2条
          c.displayReplies = c.replies.slice(0, 2);
        } else {
          // 当前是折叠的，要展开：显示全部
          c.displayReplies = c.replies;
        }
      }
      return c;
    });
    
    // 更新expandedReplies状态
    const expandedReplies = { ...this.data.expandedReplies };
    expandedReplies[commentId] = !expandedReplies[commentId];
    
    this.setData({ comments: comments, expandedReplies: expandedReplies });
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
