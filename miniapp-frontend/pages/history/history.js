const { request } = require('../../utils/request');

Page({
  data: {
    historyList: []
  },
  onLoad() {
    this.loadHistory();
  },
  async loadHistory() {
    try {
      const res = await request({ url: '/api/browse-history' });
      if (res.code === 0) {
        this.setData({ historyList: res.data || [] });
      }
    } catch (e) {
      console.error('加载浏览历史失败', e);
    }
  },
  onTapProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  }
});

