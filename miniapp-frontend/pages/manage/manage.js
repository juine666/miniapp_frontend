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
  goEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/publish/publish?id=${id}` });
  },
  async toggleStatus(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const product = this.data.products.find(p => p.id === id);
    const newStatus = product.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED';
    const res = await request({ url: `/api/my/products/${id}/status?value=${newStatus}`, method: 'PATCH' });
    if (res.code === 0) {
      wx.showToast({ title: newStatus === 'PUBLISHED' ? '已上架' : '已下架' });
      this.loadProducts();
    }
  }
});

