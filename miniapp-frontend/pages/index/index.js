const { request } = require('../../utils/request');
Page({
  data: {
    categoryList: [],
    categoryIndex: 0,
    currentCatId: null,
    goodsList: [],
    page: 0,
    size: 20,
    hasMore: true,
    loading: false,
    searchKeyword: '', // 搜索关键词
    // 排序相关
    sortOptions: [
      { label: '最新', sortBy: 'latest', sortOrder: 'desc'}
      // { label: '价格从低到高', sortBy: 'price', sortOrder: 'asc' },
      // { label: '价格从高到低', sortBy: 'price', sortOrder: 'desc' }
    ],
    sortIndex: 0,
    sortBy: 'latest',
    sortOrder: 'desc'
  },
  onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },
  async onLoad() {
    const cats = await request({ url: '/api/categories' });
    this.setData({
      categoryList: [{ id: null, name: '全部' }, ...(cats.data || [])],
      categoryIndex: 0
    });
    this.resetAndLoad();
  },
  onCategoryChange(e) {
    const index = Number(e.detail.value);
    const category = this.data.categoryList[index];
    const categoryId = (category && category.id !== null && category.id !== undefined) ? Number(category.id) : null;
    console.log('选择分类，索引:', index, '分类ID:', categoryId);
    this.setData({ 
      categoryIndex: index,
      currentCatId: categoryId
    });
    this.resetAndLoad();
  },
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    // 可以添加防抖，这里先不添加
  },
  onSearchConfirm(e) {
    const keyword = e.detail.value || this.data.searchKeyword;
    console.log('搜索关键词:', keyword);
    this.setData({ searchKeyword: keyword });
    this.resetAndLoad();
  },
  onClearSearch() {
    this.setData({ searchKeyword: '' });
    this.resetAndLoad();
  },
  onSortChange(e) {
    const index = Number(e.detail.value);
    const sortOption = this.data.sortOptions[index];
    this.setData({ 
      sortIndex: index,
      sortBy: sortOption.sortBy,
      sortOrder: sortOption.sortOrder
    });
    this.resetAndLoad();
  },
  resetAndLoad() {
    this.setData({ goodsList: [], page: 0, hasMore: true });
    const categoryId = this.data.currentCatId;
    const keyword = this.data.searchKeyword && this.data.searchKeyword.trim();
    console.log('resetAndLoad，分类ID:', categoryId, '搜索关键词:', keyword);
    this.loadGoods(categoryId, keyword, true);
  },
  async loadGoods(categoryId, keyword, reset = false) {
    if (this.data.loading || (!this.data.hasMore && !reset)) return;
    this.setData({ loading: true });
    
    const page = reset ? 0 : this.data.page;
    const { sortBy, sortOrder } = this.data;
    let res;
    
    // 确保categoryId是数字或null
    const catId = (categoryId === null || categoryId === undefined || categoryId === 'null' || categoryId === 'undefined' || categoryId === '') ? null : Number(categoryId);
    const searchKeyword = keyword && keyword.trim() ? keyword.trim() : null;
    
    console.log('loadGoods，分类ID:', catId, '搜索关键词:', searchKeyword, '页码:', page, '排序:', sortBy, sortOrder);
    
    try {
      // 如果有搜索关键词，使用搜索接口
      if (searchKeyword) {
        res = await request({ 
          url: `/api/products/search?q=${encodeURIComponent(searchKeyword)}&page=${page}&size=${this.data.size}` 
        });
        console.log('搜索API响应:', res);
      }
      // 如果有分类ID，使用分类接口
      else if (catId !== null && !isNaN(catId)) {
        res = await request({ 
          url: `/api/products/by-category/${catId}?page=${page}&size=${this.data.size}&sortBy=${sortBy}&sortOrder=${sortOrder}` 
        });
        console.log('分类筛选API响应:', res);
      } 
      // 否则获取全部商品
      else {
        res = await request({ 
          url: `/api/products?page=${page}&size=${this.data.size}&sortBy=${sortBy}&sortOrder=${sortOrder}` 
        });
        console.log('全部商品API响应:', res);
      }
    } catch (e) {
      console.error('加载商品失败:', e);
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      return;
    }
    
    if (res.code === 0 && res.data) {
      const pageData = res.data.content || [];
      
      // 处理图片URL：解析coverUrl（可能是JSON格式）或使用imageUrls
      const newList = pageData.map(item => {
        let coverUrl = item.coverUrl || '';
        
        // 如果有imageUrls字段，优先使用第一张
        if (item.imageUrls && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
          coverUrl = item.imageUrls[0];
          console.log('商品ID:', item.id, '使用imageUrls:', coverUrl);
        } 
        // 如果coverUrl是JSON格式，尝试解析
        else if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
          try {
            const imageUrls = JSON.parse(coverUrl);
            if (Array.isArray(imageUrls) && imageUrls.length > 0) {
              coverUrl = imageUrls[0];
              console.log('商品ID:', item.id, '解析JSON coverUrl成功:', coverUrl);
            } else {
              console.warn('商品ID:', item.id, '解析JSON coverUrl为空数组');
            }
          } catch (e) {
            // 解析失败，使用原始值
            console.warn('商品ID:', item.id, '解析coverUrl JSON失败:', e, '原始值:', coverUrl);
          }
        } else if (coverUrl) {
          console.log('商品ID:', item.id, '使用原始coverUrl:', coverUrl);
        } else {
          console.warn('商品ID:', item.id, '没有coverUrl，使用默认图片');
        }
        
        return { 
          ...item, 
          coverUrl: coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg',
          isFavorited: false 
        };
      });
      
      if (reset) {
        this.setData({ goodsList: newList });
      } else {
        // 去重：基于ID去重
        const existingIds = new Set(this.data.goodsList.map(g => g.id));
        const filteredNewList = newList.filter(item => !existingIds.has(item.id));
        this.setData({ goodsList: [...this.data.goodsList, ...filteredNewList] });
      }
      
      const hasMore = res.data.hasNext !== false && newList.length === this.data.size;
      this.setData({ 
        page: page + 1,
        hasMore: hasMore,
        loading: false
      });
      
      // 批量检查收藏状态
      await this.checkFavorites(newList);
    } else {
      this.setData({ loading: false });
    }
  },
  async checkFavorites(newList = null) {
    // 如果用户未登录，不检查收藏状态
    const app = getApp();
    if (!app.globalData.token) {
      return;
    }
    
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
    this.resetAndLoad();
    wx.stopPullDownRefresh();
  },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      const keyword = this.data.searchKeyword && this.data.searchKeyword.trim();
      this.loadGoods(this.data.currentCatId, keyword);
    }
  },
  onTapDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },
  onTapAdd() {
    wx.navigateTo({ url: '/pages/publish/publish' });
  },
  onShare(e) {
    const id = e.currentTarget.dataset.id;
    const item = e.currentTarget.dataset.item;
    if (!id) return;
    
    // 方案1：跳转到分享页面（用户可以看到分享预览）
    wx.navigateTo({
      url: `/pages/share/share?productId=${id}`
    });
    
    // 方案2：提示用户使用右上角分享（备用）
    // wx.showShareMenu({
    //   withShareTicket: true,
    //   menus: ['shareAppMessage', 'shareTimeline']
    // });
    // wx.showToast({
    //   title: '请点击右上角分享',
    //   icon: 'none',
    //   duration: 2000
    // });
  },
  onShareAppMessage(options) {
    // 当用户点击右上角分享按钮时
    const productId = options.query?.productId;
    if (productId) {
      const item = this.data.goodsList.find(p => p.id == productId);
      return {
        title: item?.name || '分享商品',
        path: `/pages/share/share?productId=${productId}`,
        imageUrl: item?.coverUrl || ''
      };
    }
    return {
      title: 'StyleMirror - 闲置好物',
      path: '/pages/index/index'
    };
  }
});

