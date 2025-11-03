const { request } = require('../../utils/request');

Page({
  data: { 
    list: [],
    page: 0,
    size: 20,
    hasMore: true,
    loading: false
  },
  onLoad() {
    this.resetAndLoad();
  },
  async onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
    // 每次显示时刷新订单列表
    this.resetAndLoad();
  },
  resetAndLoad() {
    this.setData({ list: [], page: 0, hasMore: true });
    this.loadOrders(true);
  },
  async loadOrders(reset = false) {
    if (this.data.loading || (!this.data.hasMore && !reset)) return;
    this.setData({ loading: true });
    
    try {
      const page = reset ? 0 : this.data.page;
      const res = await request({ url: `/api/orders?page=${page}&size=${this.data.size}` });
      if (res.code === 0 && res.data) {
        // 处理分页数据
        const pageData = res.data.content || res.data || [];
        const newList = pageData.map(order => {
          // 格式化订单状态
          const statusMap = {
            'CREATED': '待支付',
            'PAID': '已支付',
            'SHIPPED': '已发货',
            'COMPLETED': '已完成',
            'CANCELLED': '已取消'
          };
          return {
            ...order,
            statusText: statusMap[order.status] || order.status,
            formattedDate: this.formatTime(order.createdAt)
          };
        });
        
        // 去重：基于ID去重
        let list;
        if (reset) {
          list = newList;
        } else {
          const existingIds = new Set(this.data.list.map(o => o.id));
          const newItems = newList.filter(order => !existingIds.has(order.id));
          list = [...this.data.list, ...newItems];
        }
        
        const hasMore = res.data.hasNext !== false && newList.length === this.data.size;
        this.setData({ 
          list: list,
          page: page + 1,
          hasMore: hasMore,
          loading: false
        });
      } else {
        this.setData({ loading: false });
        if (res.message) {
          wx.showToast({ title: res.message, icon: 'none' });
        }
      }
    } catch (e) {
      console.error('加载订单失败', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },
  formatTime(timestamp) {
    if (!timestamp) return '刚刚';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(Number(timestamp));
      if (isNaN(date.getTime())) return '刚刚';
      
      const now = new Date();
      const diff = now - date;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
          const minutes = Math.floor(diff / (1000 * 60));
          return minutes <= 0 ? '刚刚' : `${minutes}分钟前`;
        }
        return `${hours}小时前`;
      } else if (days < 7) {
        return `${days}天前`;
      } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
      }
    } catch (e) {
      return '刚刚';
    }
  },
  async onPullDownRefresh() {
    await this.resetAndLoad();
    wx.stopPullDownRefresh();
  },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrders();
    }
  },
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${id}`
      });
    }
  },
  async handlePay(e) {
    const orderId = e.currentTarget.dataset.id;
    if (!orderId) return;
    
    try {
      wx.showLoading({ title: '发起支付中...' });
      const payRes = await request({ 
        url: `/api/orders/${orderId}/pay`, 
        method: 'POST' 
      });
      wx.hideLoading();
      
      if (payRes.code === 0 && payRes.data) {
        const p = payRes.data;
        wx.requestPayment({
          timeStamp: p.timeStamp,
          nonceStr: p.nonceStr,
          package: p.package,
          signType: p.signType,
          paySign: p.paySign,
          success: async () => {
            wx.showToast({ title: '支付成功', icon: 'success' });
            
            // 确认支付成功（调用后端更新订单状态）
            try {
              await request({
                url: `/api/orders/${orderId}/confirm-pay`,
                method: 'POST'
              });
              console.log('订单状态已更新为已支付');
            } catch (confirmError) {
              console.error('更新订单状态失败', confirmError);
            }
            
            // 刷新订单列表
            setTimeout(() => {
              this.resetAndLoad();
            }, 1500);
          },
          fail: (err) => {
            console.error('支付失败', err);
            if (err.errMsg && err.errMsg.includes('cancel')) {
              wx.showToast({ title: '支付已取消', icon: 'none' });
            } else {
              wx.showToast({ title: '支付失败', icon: 'none' });
            }
          }
        });
      } else {
        wx.showToast({ title: payRes.message || '支付失败', icon: 'none' });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('支付异常', e);
      wx.showToast({ title: '支付失败，请重试', icon: 'none' });
    }
  },
  handleDetail(e) {
    const orderId = e.currentTarget.dataset.id;
    // 暂时跳转到订单详情（可以后续实现）
    wx.showToast({ title: '订单详情功能开发中', icon: 'none' });
  },
  handleReview(e) {
    const orderId = e.currentTarget.dataset.id;
    // 暂时跳转到评价页面（可以后续实现）
    wx.showToast({ title: '评价功能开发中', icon: 'none' });
  },
  goShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});

