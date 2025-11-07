const { request } = require('../../utils/request');

Page({
  data: {
    products: []
  },
  onLoad() {
    this.loadProducts();
  },
  onShow() {
    this.loadProducts();
  },
  async loadProducts() {
    const res = await request({ url: '/api/my/products' });
    if (res.code === 0) {
      this.setData({ products: res.data || [] });
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
          this.loadProducts();
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
  }
});

