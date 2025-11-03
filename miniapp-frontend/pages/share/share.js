const { request } = require('../../utils/request');

Page({
  data: {
    productId: null,
    product: {}
  },
  async onLoad(query) {
    const productId = query.productId || query.id;
    if (!productId) {
      wx.showToast({ title: '商品ID无效', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }
    
    this.setData({ productId });
    await this.loadProduct(productId);
  },
  async loadProduct(productId) {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await request({ url: `/api/products/${productId}` });
      wx.hideLoading();
      
      if (res.code === 0 && res.data) {
        const data = res.data;
        // 处理数据格式，兼容后端返回的格式（可能是Product对象或Map）
        const product = {
          id: data.id || productId,
          name: data.name || '商品',
          description: data.description || '',
          coverUrl: data.coverUrl || data.cover_url || '',
          price: data.price ? (typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0) : 0
        };
        // 格式化价格，保留两位小数
        if (product.price) {
          product.price = parseFloat(product.price).toFixed(2);
        }
        this.setData({ product });
      } else {
        wx.showToast({ title: '商品不存在', icon: 'none' });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (e) {
      wx.hideLoading();
      console.error('加载商品失败', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  goToDetail() {
    if (this.data.productId) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${this.data.productId}`
      });
    }
  },
  onShareAppMessage() {
    return {
      title: this.data.product.name || '分享商品',
      path: `/pages/share/share?productId=${this.data.productId}`,
      imageUrl: this.data.product.coverUrl || ''
    };
  }
});
