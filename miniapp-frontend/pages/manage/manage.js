const { request } = require('../../utils/request');

Page({
  data: {
    activeTab: 0, // 0: 我发布的, 1: 我关注的, 2: 系统配置
    products: [], // 我发布的商品
    favorites: [], // 我关注的商品
    currentProducts: [], // 当前显示的商品列表
    
    // 微信配置
    wechatAppId: '',
    wechatSecret: '',
    
    // 服务器配置
    serverUrl: '',
    
    // OSS配置
    ossEndpoint: '',
    ossBucket: '',
    ossAccessKeyId: '',
    ossAccessKeySecret: '',
    ossPublicBaseUrl: ''
  },
  onLoad() {
    this.loadProducts();
  },
  onShow() {
    // 根据当前标签页刷新数据
    if (this.data.activeTab === 0) {
      this.loadProducts();
    } else if (this.data.activeTab === 1) {
      this.loadFavorites();
    } else if (this.data.activeTab === 2) {
      this.loadConfig();
    }
  },
  // 切换标签页
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    if (this.data.activeTab === index) return;
    
    this.setData({ activeTab: index });
    
    // 根据标签页加载数据
    if (index === 0) {
      this.loadProducts();
    } else if (index === 1) {
      this.loadFavorites();
    } else if (index === 2) {
      this.loadConfig();
    }
  },
  // 加载我发布的商品
  async loadProducts() {
    try {
      const res = await request({ url: '/api/my/products' });
      if (res.code === 0) {
        const products = res.data?.content || res.data || [];
        this.setData({ 
          products: products,
          currentProducts: products
        });
      }
    } catch (error) {
      console.error('加载商品失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  // 加载我关注的商品
  async loadFavorites() {
    try {
      const res = await request({ url: '/api/favorites' });
      if (res.code === 0) {
        const favorites = res.data?.content || res.data || [];
        this.setData({ 
          favorites: favorites,
          currentProducts: favorites
        });
      }
    } catch (error) {
      console.error('加载关注商品失败:', error);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  // 跳转到商品详情页
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击查看商品详情，ID:', id, '类型:', typeof id);
    if (!id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      return;
    }
    // 跳转到详情页
    wx.navigateTo({ 
      url: `/pages/detail/detail?id=${id}`,
      fail: (err) => {
        console.error('跳转详情页失败:', err);
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  },
  // 编辑商品
  goEdit(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const id = e.currentTarget.dataset.id;
    console.log('点击编辑商品，ID:', id, '类型:', typeof id);
    if (!id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      return;
    }
    // 使用全局数据传递商品ID，因为publish页面在tabBar中
    const app = getApp();
    app.globalData.editingProductId = Number(id);
    wx.switchTab({ url: '/pages/publish/publish' });
  },
  async toggleStatus(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    console.log('切换商品状态，ID:', id, '类型:', typeof id);
    if (!id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      return;
    }
    
    const product = this.data.products.find(p => p.id == id);
    if (!product) {
      wx.showToast({ title: '商品不存在', icon: 'none' });
      return;
    }
    
    const newStatus = product.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED';
    console.log('当前状态:', product.status, '新状态:', newStatus);
    
    try {
      wx.showLoading({ title: '处理中...' });
      const res = await request({ 
        url: `/api/my/products/${id}/status?value=${newStatus}`, 
        method: 'PATCH'
      });
      wx.hideLoading();
      
      if (res.code === 0) {
        wx.showToast({ 
          title: newStatus === 'PUBLISHED' ? '已上架' : '已下架',
          icon: 'success'
        });
        // 延迟刷新，确保状态更新完成
        setTimeout(() => {
          if (this.data.activeTab === 0) {
            this.loadProducts();
          }
        }, 500);
      } else {
        wx.showToast({ 
          title: res.message || '操作失败', 
          icon: 'none' 
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('切换状态失败:', error);
      wx.showToast({ 
        title: '操作失败，请重试', 
        icon: 'none' 
      });
    }
  },
  
  // 加载配置
  async loadConfig() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 获取微信配置
      const wechatConfigs = await request({ url: '/api/admin/config/wechat' });
      if (wechatConfigs.code === 0) {
        const wechatConfig = wechatConfigs.data || {};
        this.setData({
          wechatAppId: wechatConfig.appid || '',
          wechatSecret: wechatConfig.secret || ''
        });
      }
      
      // 获取服务器配置
      const serverConfigs = await request({ url: '/api/admin/config/server' });
      if (serverConfigs.code === 0) {
        const serverConfig = serverConfigs.data || {};
        this.setData({
          serverUrl: serverConfig.url || ''
        });
      }
      
      // 获取OSS配置
      const ossConfigs = await request({ url: '/api/admin/config/oss' });
      if (ossConfigs.code === 0) {
        const ossConfig = ossConfigs.data || {};
        this.setData({
          ossEndpoint: ossConfig.endpoint || '',
          ossBucket: ossConfig.bucket || '',
          ossAccessKeyId: ossConfig.accessKeyId || '',
          ossAccessKeySecret: ossConfig.accessKeySecret || '',
          ossPublicBaseUrl: ossConfig.publicBaseUrl || ''
        });
      }
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('加载配置失败:', error);
      wx.showToast({ title: '加载配置失败', icon: 'none' });
    }
  },
  
  // 输入框变化事件
  onWechatAppIdChange(e) {
    this.setData({ wechatAppId: e.detail.value });
  },
  
  onWechatSecretChange(e) {
    this.setData({ wechatSecret: e.detail.value });
  },
  
  onServerUrlChange(e) {
    this.setData({ serverUrl: e.detail.value });
  },
  
  onOssEndpointChange(e) {
    this.setData({ ossEndpoint: e.detail.value });
  },
  
  onOssBucketChange(e) {
    this.setData({ ossBucket: e.detail.value });
  },
  
  onOssAccessKeyIdChange(e) {
    this.setData({ ossAccessKeyId: e.detail.value });
  },
  
  onOssAccessKeySecretChange(e) {
    this.setData({ ossAccessKeySecret: e.detail.value });
  },
  
  onOssPublicBaseUrlChange(e) {
    this.setData({ ossPublicBaseUrl: e.detail.value });
  },
  
  // 保存配置
  async saveConfig() {
    try {
      wx.showLoading({ title: '保存中...' });
      
      // 保存微信配置
      await request({
        url: '/api/admin/config/wechat',
        method: 'POST',
        data: {
          appid: this.data.wechatAppId,
          secret: this.data.wechatSecret
        }
      });
      
      // 保存服务器配置
      await request({
        url: '/api/admin/config/server',
        method: 'POST',
        data: {
          url: this.data.serverUrl
        }
      });
      
      // 保存OSS配置
      await request({
        url: '/api/admin/config/oss',
        method: 'POST',
        data: {
          endpoint: this.data.ossEndpoint,
          bucket: this.data.ossBucket,
          accessKeyId: this.data.ossAccessKeyId,
          accessKeySecret: this.data.ossAccessKeySecret,
          publicBaseUrl: this.data.ossPublicBaseUrl
        }
      });
      
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('保存配置失败:', error);
      wx.showToast({ title: '保存配置失败', icon: 'none' });
    }
  }
});