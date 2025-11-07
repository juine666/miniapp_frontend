const { request } = require('../../utils/request');

Page({
  data: { 
    id: null, 
    item: {}, 
    isFavorited: false,
    sellerInfo: { nickname: '卖家', avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg' },
    sellerContact: null,  // 卖家联系方式
    categoryName: '未分类',
    loading: false,
    imageList: [],  // 商品图片列表
    currentImageIndex: 0,  // 当前图片索引
    currentUserId: null,  // 当前用户ID
    isMyProduct: false  // 是否是自己的商品
  },
  onLoad(query) {
    console.log('详情页onLoad，query:', query);
    const id = query.id || query.productId;
    if (!id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      console.error('详情页缺少商品ID，query:', query);
      return;
    }
    
    console.log('详情页商品ID:', id, '类型:', typeof id);
    const newId = String(id);
    
    // 如果ID发生变化，清空旧数据并重新加载
    if (this.data.id !== newId) {
      this.setData({ 
        id: newId,
        item: {},
        imageList: [],
        sellerInfo: { nickname: '卖家', avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg' },
        sellerContact: null,
        categoryName: '未分类',
        isFavorited: false
      });
    } else {
      this.setData({ id: newId });
    }
    
    // 启用分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    this.loadCurrentUser();
    this.loadDetail();
    this.checkFavorite();
  },
  onShow() {
    // 每次显示页面时，如果ID存在，重新加载数据（防止数据缓存问题）
    const id = this.data.id;
    if (id) {
      console.log('详情页onShow，重新加载商品ID:', id);
      this.loadDetail();
      this.checkFavorite();
    }
  },
  async loadDetail() {
    const id = this.data.id;
    if (!id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      console.error('loadDetail: 商品ID不存在');
      return;
    }
    
    console.log('开始加载商品详情，ID:', id);
    
    try {
      this.setData({ loading: true });
      wx.showLoading({ title: '加载中...' });
      
      const res = await request({ url: `/api/products/${id}` });
      console.log('详情页API响应:', res);
      console.log('响应数据:', JSON.stringify(res, null, 2));
      
      if (res.code === 0 && res.data) {
        const data = res.data;
        console.log('商品详情数据:', data);
        console.log('数据字段:', Object.keys(data));
        
        // 处理图片列表：优先使用imageUrls，否则使用coverUrl
        let imageList = [];
        if (data.imageUrls && Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
          imageList = data.imageUrls;
          console.log('使用imageUrls:', imageList);
        } else if (data.coverUrl) {
          // 如果coverUrl是JSON格式，尝试解析
          try {
            if (typeof data.coverUrl === 'string' && data.coverUrl.startsWith('[')) {
              imageList = JSON.parse(data.coverUrl);
              console.log('解析coverUrl JSON成功:', imageList);
            } else {
              imageList = [data.coverUrl];
              console.log('使用单张coverUrl:', imageList);
            }
          } catch (e) {
            imageList = [data.coverUrl];
            console.warn('解析coverUrl失败，使用单张:', imageList);
          }
        } else {
          console.warn('没有图片数据');
        }
        
        console.log('最终图片列表:', imageList);
        
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
        
        console.log('商品信息已设置:', this.data.item);
        
        // 设置卖家信息（后端已返回）
        if (data.seller) {
          this.setData({ sellerInfo: data.seller });
          console.log('卖家信息已设置:', data.seller);
        } else if (data.sellerId) {
          // 如果没有seller对象，尝试加载
          console.log('尝试加载卖家信息，sellerId:', data.sellerId);
          await this.loadSellerInfo(data.sellerId);
        } else {
          console.warn('商品数据中没有sellerId:', data);
          // 设置默认卖家信息
          this.setData({ sellerInfo: { nickname: '卖家', avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg' } });
        }
        
        // 加载卖家联系方式
        if (data.sellerId) {
          await this.loadSellerContact(data.sellerId);
        }
        
        // 设置分类名称（后端已返回）
        if (data.categoryName) {
          this.setData({ categoryName: data.categoryName });
        } else if (data.categoryId) {
          // 如果没有categoryName，尝试加载
          await this.loadCategoryInfo(data.categoryId);
        } else {
          this.setData({ categoryName: '未分类' });
        }
        
        // 格式化时间
        if (data.createdAt) {
          this.formatTime(data.createdAt);
        } else {
          this.setData({ 'item.createdAt': '刚刚' });
        }
        
        // 验证关键数据
        if (!data.sellerId) {
          console.error('警告：商品数据缺少sellerId，聊天功能可能无法使用');
        }
        
        // 判断是否是自己的商品
        const isMyProduct = this.data.currentUserId && data.sellerId && String(this.data.currentUserId) === String(data.sellerId);
        this.setData({ isMyProduct });
        console.log('是否是自己的商品:', isMyProduct, 'currentUserId:', this.data.currentUserId, 'sellerId:', data.sellerId);
        
        this.setData({ loading: false });
      } else {
        console.error('详情页加载失败，响应:', res);
        console.error('错误码:', res.code, '错误信息:', res.message);
        wx.showToast({ title: res.message || '加载失败', icon: 'none', duration: 3000 });
        // 即使加载失败，也显示默认内容
        this.setData({ 
          loading: false,
          item: { 
            name: res.message || '加载失败', 
            price: 0, 
            description: '请稍后重试',
            status: 'OFFLINE'
          }
        });
      }
    } catch (e) {
      console.error('加载商品详情异常:', e);
      console.error('异常堆栈:', e.stack);
      wx.showToast({ title: '加载失败，请重试: ' + (e.message || '未知错误'), icon: 'none', duration: 3000 });
      // 即使出错，也显示默认内容
      this.setData({ 
        loading: false,
        item: { 
          name: '加载失败', 
          price: 0, 
          description: e.message || '请稍后重试',
          status: 'OFFLINE'
        }
      });
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
      console.error('加载卖家信息失败', e);
    }
  },
  async loadSellerContact(sellerId) {
    try {
      const res = await request({ url: `/api/user/${sellerId}/contact` });
      if (res.code === 0 && res.data) {
        this.setData({ sellerContact: res.data });
        console.log('卖家联系方式已加载:', res.data);
      }
    } catch (e) {
      console.error('加载卖家联系方式失败', e);
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
      console.error('加载分类信息失败', e);
    }
  },
  // 轮播图切换事件
  onSwiperChange(e) {
    this.setData({
      currentImageIndex: e.detail.current
    });
  },
  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index || 0;
    const urls = this.data.imageList;
    if (urls && urls.length > 0) {
      wx.previewImage({
        current: urls[index],
        urls: urls
      });
    }
  },
  formatTime(timestamp) {
    if (!timestamp) return;
    try {
      // 处理ISO格式的时间字符串或数字时间戳
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp));
      if (isNaN(date.getTime())) return;
      
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      let timeStr = '';
      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
          const minutes = Math.floor(diff / (1000 * 60));
          timeStr = minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
        } else {
          timeStr = `${hours}小时前`;
        }
      } else if (days < 7) {
        timeStr = `${days}天前`;
      } else if (days < 30) {
        timeStr = `${days}天前`;
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        timeStr = `${month}月${day}日`;
      }
      
      this.setData({ 'item.createdAt': timeStr });
    } catch (e) {
      console.error('格式化时间失败', e);
    }
  },
  async checkFavorite() {
    try {
      const res = await request({ url: `/api/favorites/${this.data.id}/check` });
      if (res.code === 0) {
        this.setData({ isFavorited: res.data });
      }
    } catch (e) {
      // 忽略错误
    }
  },
  async toggleFavorite() {
    // 如果是自己的商品，不允许收藏
    if (this.data.isMyProduct) {
      wx.showToast({ title: '不能收藏自己的商品', icon: 'none' });
      return;
    }
    
    const { id, isFavorited } = this.data;
    try {
      if (isFavorited) {
        await request({ url: `/api/favorites/${id}`, method: 'DELETE' });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } else {
        await request({ url: `/api/favorites/${id}`, method: 'POST' });
        wx.showToast({ title: '已收藏', icon: 'none' });
      }
      this.setData({ isFavorited: !isFavorited });
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
  async onBuy() {
    console.log('点击我想要按钮，商品ID:', this.data.id);
    
    // 如果是自己的商品，不允许购买
    if (this.data.isMyProduct) {
      wx.showToast({ title: '不能购买自己的商品', icon: 'none' });
      return;
    }
    
    if (!this.data.id) {
      wx.showToast({ title: '商品信息不完整', icon: 'none' });
      return;
    }
    
    try {
      wx.showLoading({ title: '创建订单中...' });
      
      const create = await request({ 
        url: '/api/orders', 
        method: 'POST', 
        data: { productId: this.data.id, quantity: 1 } 
      });
      
      wx.hideLoading();
      
      if (create.code === 0 && create.data) {
        const orderId = create.data.id;
        console.log('订单创建成功，订单ID:', orderId);
        
        // 订单创建成功后，直接跳转到订单页面
        wx.switchTab({ url: '/pages/orders/orders' });
      } else {
        wx.showToast({ 
          title: create.message || '创建订单失败', 
          icon: 'none' 
        });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('创建订单异常', e);
      wx.showToast({ 
        title: e.message || '操作失败，请重试', 
        icon: 'none',
        duration: 2000
      });
    }
  },
  async loadCurrentUser() {
    try {
      const res = await request({ url: '/api/user/me' });
      if (res.code === 0 && res.data) {
        this.setData({ currentUserId: res.data.id });
        console.log('当前用户ID:', res.data.id);
      }
    } catch (e) {
      console.error('获取当前用户信息失败', e);
    }
  },
  async onChat() {
    console.log('点击聊天按钮，当前数据:', {
      id: this.data.id,
      sellerId: this.data.item.sellerId,
      item: this.data.item,
      isMyProduct: this.data.isMyProduct
    });
    
    // 如果是自己的商品，不允许聊天
    if (this.data.isMyProduct) {
      wx.showToast({ title: '不能和自己的商品聊天', icon: 'none' });
      return;
    }
    
    const { id, item } = this.data;
    const app = getApp();
    
    if (!item.sellerId) {
      wx.showToast({ title: '卖家信息不完整', icon: 'none' });
      console.error('卖家ID不存在', item);
      return;
    }
    
    if (!id) {
      wx.showToast({ title: '商品信息不完整', icon: 'none' });
      return;
    }
    
    try {
      // 因为是tabBar页面，不能通过URL传参，使用全局数据传递
      app.globalData.chatParams = {
        userId: item.sellerId,
        productId: id,
        productName: item.name || '商品'
      };
      
      console.log('设置聊天参数到全局数据:', app.globalData.chatParams);
      console.log('准备跳转到消息页面（tabBar）');
      
      // 使用 switchTab 跳转到 tabBar 页面
      wx.switchTab({ 
        url: '/pages/message/message',
        success: () => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败', err);
          wx.showToast({ title: '跳转失败: ' + (err.errMsg || '未知错误'), icon: 'none' });
        }
      });
    } catch (e) {
      console.error('聊天按钮异常', e);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
  onShare() {
    const { id, item } = this.data;
    if (!id) {
      wx.showToast({ title: '商品信息不完整', icon: 'none' });
      return;
    }
    
    // 显示操作菜单
    wx.showActionSheet({
      itemList: ['分享给好友', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 分享给好友 - 提示用户点击右上角菜单
          wx.showToast({ 
            title: '请点击右上角菜单分享', 
            icon: 'none',
            duration: 2000
          });
          // 确保分享菜单已启用
          wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage', 'shareTimeline']
          });
        } else if (res.tapIndex === 1) {
          // 复制链接
          const sharePath = `/pages/share/share?productId=${id}`;
          wx.setClipboardData({
            data: sharePath,
            success: () => {
              wx.showToast({ 
                title: '链接已复制', 
                icon: 'success',
                duration: 1500
              });
            },
            fail: () => {
              wx.showToast({ title: '复制失败', icon: 'none' });
            }
          });
        }
      },
      fail: (err) => {
        console.log('取消分享', err);
      }
    });
  },
  onShareAppMessage() {
    return {
      title: this.data.item.name || '分享商品',
      path: `/pages/share/share?productId=${this.data.id}`,
      imageUrl: this.data.item.coverUrl || ''
    };
  },
  // 复制联系方式
  copyContact(e) {
    const value = e.currentTarget.dataset.value;
    const type = e.currentTarget.dataset.type;
    if (!value) {
      return;
    }
    wx.setClipboardData({
      data: value,
      success: () => {
        wx.showToast({ 
          title: '已复制到剪贴板', 
          icon: 'success',
          duration: 1500
        });
      },
      fail: () => {
        wx.showToast({ title: '复制失败', icon: 'none' });
      }
    });
  }
});

