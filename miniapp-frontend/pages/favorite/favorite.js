const { request } = require('../../utils/request');

Page({
  data: {
    products: [],
    loading: false
  },
  onLoad() {
    this.loadFavorites();
  },
  onShow() {
    // 只在非首次加载时刷新（例如从详情页返回时）
    if (this.data.loading === false && this.data.products.length > 0) {
      // 如果已经有数据，可以选择刷新或不刷新
      // 这里选择不自动刷新，避免重复请求
      // 如果需要刷新，可以取消下面的注释
      // this.loadFavorites();
    }
  },
  async loadFavorites() {
    // 防止重复调用
    if (this.data.loading) {
      return;
    }
    
    this.setData({ loading: true });
    try {
      const res = await request({ url: '/api/favorites' });
      console.log('收藏列表API响应:', res);
      
      if (res.code === 0 && res.data) {
        // 后端返回的是PageResponse格式，需要取records字段
        let products = [];
        if (res.data.records && Array.isArray(res.data.records)) {
          products = res.data.records;
        } else if (Array.isArray(res.data)) {
          // 兼容直接返回数组的情况
          products = res.data;
        }
        
        // 处理图片URL，确保coverUrl字段正确
        products = products.map(item => {
          // 如果coverUrl是JSON字符串，解析它
          let coverUrl = item.coverUrl;
          if (typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
            try {
              const urls = JSON.parse(coverUrl);
              coverUrl = Array.isArray(urls) && urls.length > 0 ? urls[0] : '';
            } catch (e) {
              console.warn('解析coverUrl失败:', e);
            }
          }
          
          return {
            ...item,
            coverUrl: coverUrl || item.cover_url || ''
          };
        });
        
        console.log('处理后的收藏列表:', products);
        this.setData({ products });
      } else {
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
        this.setData({ products: [] });
      }
    } catch (e) {
      console.error('加载收藏失败', e);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      this.setData({ products: [] });
    } finally {
      this.setData({ loading: false });
    }
  },
  onTapProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});

