const { request } = require('../../utils/request');

Page({
  data: {
    goodsList: [],
    loading: false,
    location: null, // {latitude, longitude}
    locationName: '定位中...',
    radius: 3, // 搜索半径（公里）
    refreshing: false
  },
  onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      });
    }
    
    // 如果没有位置信息，获取位置
    if (!this.data.location) {
      this.getLocation();
    } else {
      // 如果有位置信息，刷新商品列表
      this.loadNearbyGoods();
    }
  },
  async getLocation() {
    try {
      wx.showLoading({ title: '定位中...' });
      
      // 获取用户位置
      const res = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject
        });
      });
      
      wx.hideLoading();
      
      const location = {
        latitude: res.latitude,
        longitude: res.longitude
      };
      
      this.setData({ 
        location,
        locationName: '当前位置'
      });
      
      // 获取位置后加载附近商品
      this.loadNearbyGoods();
      
      // 尝试获取位置名称（可选）
      this.getLocationName(location);
    } catch (e) {
      wx.hideLoading();
      console.error('获取位置失败:', e);
      wx.showModal({
        title: '定位失败',
        content: '无法获取您的位置信息，请检查是否开启了位置权限',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            // 用户可以手动设置位置或重试
            this.setData({ locationName: '定位失败' });
          }
        }
      });
    }
  },
  async getLocationName(location) {
    // 可选：使用逆地理编码获取位置名称
    // 这里先不实现，后续可以添加
  },
  async loadNearbyGoods() {
    if (!this.data.location) {
      console.warn('没有位置信息，无法加载附近商品');
      return;
    }
    
    if (this.data.loading) {
      return;
    }
    
    this.setData({ loading: true });
    
    try {
      const { latitude, longitude } = this.data.location;
      const res = await request({
        url: `/api/products/nearby?lat=${latitude}&lng=${longitude}&radiusKm=${this.data.radius}`
      });
      
      console.log('附近商品API响应:', res);
      
      if (res.code === 0 && res.data) {
        const products = Array.isArray(res.data) ? res.data : [];
        
        // 处理图片URL和距离信息（后端已使用Haversine公式计算并排序）
        const newList = products.map(item => {
          let coverUrl = item.coverUrl || '';
          
          // 如果有imageUrls字段，优先使用第一张
          if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
            coverUrl = item.imageUrls[0];
          } 
          // 如果coverUrl是JSON格式，尝试解析
          else if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
            try {
              const imageUrls = JSON.parse(coverUrl);
              if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                coverUrl = imageUrls[0];
              }
            } catch (e) {
              console.warn('解析coverUrl失败:', e);
            }
          }
          
          // 使用后端返回的距离（已使用Haversine公式计算）
          const distance = item.distanceKm !== undefined ? item.distanceKm : null;
          
          // 格式化距离显示
          let distanceText = null;
          if (distance !== null && distance !== undefined) {
            if (distance < 1) {
              distanceText = (distance * 1000).toFixed(0) + 'm';
            } else {
              distanceText = distance.toFixed(1) + 'km';
            }
          }
          
          return {
            ...item,
            coverUrl: coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg',
            distance: distance,
            distanceText: distanceText,
            isFavorited: false
          };
        });
        
        // 后端已按距离排序，这里不需要再次排序
        
        this.setData({ 
          goodsList: newList,
          loading: false,
          refreshing: false
        });
        
        // 批量检查收藏状态
        await this.checkFavorites(newList);
      } else {
        this.setData({ 
          goodsList: [],
          loading: false,
          refreshing: false
        });
      }
    } catch (e) {
      console.error('加载附近商品失败:', e);
      this.setData({ 
        loading: false,
        refreshing: false
      });
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },
  // 计算两点之间的距离（公里）
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 地球半径（公里）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },
  async checkFavorites(newList = null) {
    const goodsList = newList || this.data.goodsList;
    for (let i = 0; i < goodsList.length; i++) {
      try {
        const checkRes = await request({ url: `/api/favorites/${goodsList[i].id}/check` });
        if (checkRes.code === 0) {
          const index = this.data.goodsList.findIndex(item => item.id === goodsList[i].id);
          if (index >= 0) {
            this.setData({ [`goodsList[${index}].isFavorited`]: checkRes.data });
          }
        }
      } catch (e) {
        // 忽略错误
      }
    }
  },
  async toggleFavorite(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const item = this.data.goodsList[index];
    const isFavorited = item.isFavorited;
    
    try {
      if (isFavorited) {
        await request({ url: `/api/favorites/${id}`, method: 'DELETE' });
        wx.showToast({ title: '已取消收藏', icon: 'none' });
      } else {
        await request({ url: `/api/favorites/${id}`, method: 'POST' });
        wx.showToast({ title: '已收藏', icon: 'none' });
      }
      this.setData({ [`goodsList[${index}].isFavorited`]: !isFavorited });
    } catch (e) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },
  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    if (this.data.location) {
      await this.loadNearbyGoods();
    } else {
      await this.getLocation();
    }
    wx.stopPullDownRefresh();
  },
  onTapDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },
  onShare(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/share/share?productId=${id}`
    });
  },
  onRetryLocation() {
    this.getLocation();
  }
});

