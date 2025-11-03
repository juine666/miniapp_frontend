const { request } = require('../../utils/request');

Page({
  data: { 
    user: {}, 
    contact: {},
    isLoggedIn: false,
    currentTab: 'published',
    productList: [],
    productPage: 0,
    hasMore: true,
    loading: false,
    publishCount: 0,
    favoriteCount: 0,
    orderCount: 0,
    emptyText: '暂无发布的商品',
    editingNickname: false  // 是否正在编辑昵称
  },
  onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 4
      });
    }
    this.checkLoginStatus();
    if (this.data.isLoggedIn) {
      this.load(); 
      this.loadStats();
      // 只有在列表为空时才加载，避免重复加载
      if (this.data.productList.length === 0) {
        this.loadProducts(true);
      }
    }
  },
  checkLoginStatus() {
    const app = getApp();
    const token = wx.getStorageSync('token');
    const isLoggedIn = !!(token || app.globalData.token);
    this.setData({ isLoggedIn });
    
    if (!isLoggedIn) {
      // 未登录时清空用户数据
      this.setData({ 
        user: {},
        productList: [],
        publishCount: 0,
        favoriteCount: 0,
        orderCount: 0
      });
    }
  },
  async load() {
    // 未登录时不加载用户信息
    if (!this.data.isLoggedIn) {
      return;
    }
    
    try {
      const me = await request({ url: '/api/user/me' });
      if (me.code === 0) {
        this.setData({ user: me.data || {} });
      }
    } catch (e) {
      console.error('加载用户信息失败', e);
      // 如果401未授权，说明token失效，清除登录状态
      if (e.statusCode === 401) {
        this.handleLogout(false);
      }
    }
    
    try {
      const ci = await request({ url: '/api/user/contact' });
      if (ci.code === 0) {
        this.setData({ contact: ci.data || {} });
      }
    } catch (e) {
      console.error('加载联系方式失败', e);
      this.setData({ contact: {} });
    }
  },
  onInput(e) { this.setData({ [`user.${e.currentTarget.dataset.key}`]: e.detail.value }); },
  onContact(e) { this.setData({ [`contact.${e.currentTarget.dataset.key}`]: e.detail.value }); },
  async chooseAvatar() {
    try {
      wx.showLoading({ title: '选择图片...' });
      const choose = await wx.chooseMedia({ count: 1, mediaType: ['image'] });
      let filePath = choose.tempFiles[0].tempFilePath;
      const fs = wx.getFileSystemManager();
      const stat = fs.statSync(filePath);
      
      // 压缩图片（1-3MB）
      const MAX_BYTES = 3 * 1024 * 1024;
      const MIN_BYTES = 1 * 1024 * 1024;
      
      if (stat.size > MAX_BYTES) {
        wx.showLoading({ title: '压缩中...' });
        filePath = await this.compressToTarget(filePath, stat.size, MAX_BYTES, MIN_BYTES);
      }
      
      // 上传到OSS
      wx.showLoading({ title: '上传中...' });
      const dirPrefix = 'avatars/' + (new Date().toISOString().slice(0,10)) + '/';
      let policy;
      try {
        policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } });
      } catch (e) {
        wx.hideLoading();
        console.error('获取上传凭证失败', e);
        wx.showToast({ title: '获取上传凭证失败，请检查网络', icon: 'none' });
        return;
      }
      
      if (!policy || policy.code !== 0) {
        wx.hideLoading();
        wx.showToast({ title: policy?.message || '获取上传凭证失败', icon: 'none' });
        return;
      }
      
      const { accessid, host, policy: p, signature, dir } = policy.data;
      const key = dir + Date.now() + '_' + Math.floor(Math.random()*1000) + '.jpg';
      await wx.uploadFile({
        url: host,
        filePath,
        name: 'file',
        formData: { key, policy: p, OSSAccessKeyId: accessid, signature, success_action_status: '200' }
      });
      
      const url = host + '/' + key;
      this.setData({ 'user.avatarUrl': url });
      wx.hideLoading();
      wx.showToast({ title: '上传成功', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      console.error('上传头像失败', e);
      wx.showToast({ title: '上传失败', icon: 'none' });
    }
  },
  async compressToTarget(srcPath, currentSize, maxBytes, minBytes) {
    if (currentSize <= maxBytes) return srcPath;
    
    const fs = wx.getFileSystemManager();
    const qualities = [80, 70, 60, 50, 40, 35, 30];
    let bestPath = srcPath;
    let bestSize = currentSize;
    
    for (const q of qualities) {
      try {
        const outPath = await this.compressOnce(srcPath, q);
        const s = fs.statSync(outPath).size;
        if (s <= maxBytes) {
          if (s >= minBytes) return outPath;
          if (s < bestSize) { bestPath = outPath; bestSize = s; }
          return outPath;
        }
        if (s < bestSize) { bestPath = outPath; bestSize = s; }
      } catch (e) {}
    }
    return bestPath;
  },
  compressOnce(srcPath, quality) {
    return new Promise((resolve, reject) => {
      wx.compressImage({
        src: srcPath,
        quality,
        success: (res) => resolve(res.tempFilePath),
        fail: reject
      });
    });
  },
  async saveProfile() {
    try {
      const res = await request({ 
        url: '/api/user/profile', 
        method: 'POST', 
        data: { 
          nickname: this.data.user.nickname, 
          avatarUrl: this.data.user.avatarUrl 
        } 
      });
      if (res.code === 0) {
        wx.showToast({ title: '已保存', icon: 'success' });
        await this.load(); // 重新加载数据
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (e) {
      console.error('保存资料失败', e);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },
  async saveContact() {
    try {
      const res = await request({ 
        url: '/api/user/contact', 
        method: 'POST', 
        data: this.data.contact 
      });
      if (res.code === 0) {
        wx.showToast({ title: '已保存', icon: 'success' });
        await this.load(); // 重新加载数据
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (e) {
      console.error('保存联系方式失败', e);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },
  async loadProducts(reset = false) {
    if (!this.data.isLoggedIn) {
      return;
    }
    
    const { currentTab } = this.data;
    if (this.data.loading) return;
    
    this.setData({ loading: true });
    const page = reset ? 0 : (this.data.productPage || 0);
    const size = 20;
    
    try {
      if (currentTab === 'published') {
        const res = await request({ url: `/api/my/products?page=${page}&size=${size}` });
        if (res.code === 0 && res.data) {
          const pageData = res.data.content || [];
          console.log('加载我发布的商品数据:', pageData);
          
          // 处理图片URL：解析coverUrl（可能是JSON格式）或使用imageUrls
          const validData = pageData.map(item => {
            let coverUrl = item.coverUrl || '';
            
            // 如果coverUrl是JSON格式，尝试解析
            if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
              try {
                const imageUrls = JSON.parse(coverUrl);
                if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                  coverUrl = imageUrls[0];
                  console.log('商品ID:', item.id, '解析JSON coverUrl成功:', coverUrl);
                }
              } catch (e) {
                console.warn('商品ID:', item.id, '解析coverUrl JSON失败:', e);
              }
            }
            
            return {
              ...item,
              coverUrl: coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'
            };
          }).filter(item => item && item.id);
          
          console.log('处理后商品数据:', validData);
          
          // 去重：基于ID去重
          let productList;
          if (reset) {
            productList = validData;
          } else {
            const existingIds = new Set(this.data.productList.map(p => p.id));
            const newItems = validData.filter(item => !existingIds.has(item.id));
            productList = [...this.data.productList, ...newItems];
          }
          
          this.setData({ 
            productList,
            productPage: page + 1,
            hasMore: res.data.hasNext !== false && pageData.length === size,
            publishCount: res.data.total || productList.length,
            emptyText: '暂无发布的商品',
            loading: false
          });
        } else {
          console.error('加载我发布的商品失败:', res);
          this.setData({ loading: false });
        }
      } else if (currentTab === 'sold') {
        const res = await request({ url: `/api/my/orders/sold?page=${page}&size=${size}` });
        if (res.code === 0 && res.data) {
          const pageData = res.data.content || [];
          
          // 去重：基于ID去重
          let productList;
          if (reset) {
            productList = pageData;
          } else {
            const existingIds = new Set(this.data.productList.map(p => p.id));
            const newItems = pageData.filter(item => !existingIds.has(item.id));
            productList = [...this.data.productList, ...newItems];
          }
          
          this.setData({ 
            productList,
            productPage: page + 1,
            hasMore: res.data.hasNext !== false && pageData.length === size,
            emptyText: '暂无卖出的商品',
            loading: false
          });
        }
      } else if (currentTab === 'bought') {
        // 我关注的：加载收藏的商品
        const res = await request({ url: `/api/favorites?page=${page}&size=${size}` });
        if (res.code === 0 && res.data) {
          const pageData = res.data.content || res.data || [];
          
          // 处理图片URL：解析coverUrl（可能是JSON格式）或使用imageUrls
          const validData = pageData.map(item => {
            // 收藏接口返回的可能是商品对象，需要提取商品信息
            const product = item.product || item;
            let coverUrl = product.coverUrl || '';
            
            // 如果coverUrl是JSON格式，尝试解析
            if (coverUrl && typeof coverUrl === 'string' && coverUrl.startsWith('[')) {
              try {
                const imageUrls = JSON.parse(coverUrl);
                if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                  coverUrl = imageUrls[0];
                }
              } catch (e) {
                console.warn('解析coverUrl JSON失败:', e);
              }
            }
            
            return {
              ...product,
              coverUrl: coverUrl || 'https://img.yzcdn.cn/vant/cat.jpeg'
            };
          }).filter(item => item && item.id);
          
          // 去重：基于ID去重
          let productList;
          if (reset) {
            productList = validData;
          } else {
            const existingIds = new Set(this.data.productList.map(p => p.id));
            const newItems = validData.filter(item => !existingIds.has(item.id));
            productList = [...this.data.productList, ...newItems];
          }
          
          this.setData({ 
            productList,
            productPage: page + 1,
            hasMore: res.data.hasNext !== false && pageData.length === size,
            emptyText: '暂无关注的商品',
            loading: false
          });
        } else {
          this.setData({ loading: false });
        }
      }
    } catch (e) {
      console.error('加载商品列表失败', e);
      this.setData({ loading: false });
    }
  },
  async loadStats() {
    if (!this.data.isLoggedIn) {
      return;
    }
    
    try {
      const [products, favorites, orders] = await Promise.all([
        request({ url: '/api/my/products?page=0&size=1' }).catch(() => ({ data: { total: 0 } })),
        request({ url: '/api/favorites?page=0&size=1' }).catch(() => ({ data: { total: 0 } })),
        request({ url: '/api/orders?page=0&size=1' }).catch(() => ({ data: { total: 0 } }))
      ]);
      this.setData({
        publishCount: products.data?.total || 0,
        favoriteCount: favorites.data?.total || 0,
        orderCount: orders.data?.total || 0
      });
    } catch (e) {
      console.error('加载统计数据失败', e);
    }
  },
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) {
      return; // 如果点击的是当前tab，不重复加载
    }
    this.setData({ currentTab: tab, productList: [], productPage: 0, hasMore: true });
    this.loadProducts(true);
  },
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadProducts();
    }
  },
  goProduct(e) {
    console.log('goProduct 被调用', e);
    const id = e.currentTarget.dataset.id;
    const { currentTab } = this.data;
    
    console.log('商品ID:', id, '类型:', typeof id, '当前标签:', currentTab);
    
    if (!id) {
      wx.showToast({ title: '商品ID不存在', icon: 'none' });
      console.error('商品ID不存在', e);
      return;
    }
    
    // 确保ID是字符串
    const productId = String(id);
    
    if (currentTab === 'published') {
      // 我发布的可以编辑
      // 由于 publish 页面在 tabBar 中，使用全局数据传递 ID
      console.log('跳转到编辑页面，ID:', productId);
      const app = getApp();
      app.globalData.editingProductId = productId;
      
      wx.switchTab({ 
        url: '/pages/publish/publish',
        success: () => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败', err);
          wx.showToast({ title: '跳转失败', icon: 'none' });
        }
      });
    } else {
      // 我卖出的、我买到的只能查看详情
      console.log('跳转到详情页面，ID:', productId);
      wx.navigateTo({ 
        url: `/pages/detail/detail?id=${productId}`,
        success: () => {
          console.log('跳转成功');
        },
        fail: (err) => {
          console.error('跳转失败', err);
          wx.showToast({ title: '跳转失败', icon: 'none' });
        }
      });
    }
  },
  async toggleStatus(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const product = this.data.productList.find(p => p.id === id);
    const newStatus = product.status === 'PUBLISHED' ? 'OFFLINE' : 'PUBLISHED';
    const res = await request({ url: `/api/my/products/${id}/status?value=${newStatus}`, method: 'PATCH' });
    if (res.code === 0) {
      wx.showToast({ title: newStatus === 'PUBLISHED' ? '已上架' : '已下架' });
      this.loadProducts();
    }
  },
  async handleLogin() {
    if (this.data.isLoggedIn) {
      return;
    }
    
    wx.showLoading({ title: '登录中...' });
    const app = getApp();
    
    try {
      // 获取登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });
      
      if (!loginRes.code) {
        throw new Error('获取登录code失败');
      }
      
      console.log('准备登录，code:', loginRes.code.substring(0, 10) + '...');
      
      // 先尝试获取用户信息（新版本微信可以让用户选择是否使用）
      let nickname = null;
      let avatarUrl = null;
      
      // 显示提示，让用户选择是否使用微信头像和昵称
      wx.hideLoading();
      const chooseRes = await new Promise((resolve) => {
        wx.showModal({
          title: '完善资料',
          content: '是否使用微信头像和昵称？您也可以稍后在设置中自定义',
          confirmText: '使用微信',
          cancelText: '稍后设置',
          success: (res) => {
            resolve(res.confirm);
          },
          fail: () => {
            resolve(false);
          }
        });
      });
      
      if (chooseRes) {
        // 用户选择使用微信头像和昵称
        wx.showLoading({ title: '获取信息中...' });
        
        // 通过头像昵称填写能力获取（需要用户主动选择）
        // 注意：这里不能直接获取，需要用户通过组件选择
        // 所以我们需要一个临时页面或者弹窗让用户选择
        
        // 方案：显示一个页面让用户选择头像和昵称
        wx.hideLoading();
        wx.showModal({
          title: '提示',
          content: '请点击头像和昵称进行设置',
          showCancel: false,
          success: () => {
            // 先完成登录，然后提示用户设置
            this.doLoginWithCode(loginRes.code, null, null);
          }
        });
        return;
      } else {
        // 用户选择稍后设置，直接登录
        wx.showLoading({ title: '登录中...' });
        await this.doLoginWithCode(loginRes.code, null, null);
      }
    } catch (e) {
      wx.hideLoading();
      console.error('登录失败', e);
      wx.showToast({ 
        title: e.message || '登录失败，请重试', 
        icon: 'none',
        duration: 2000
      });
    }
  },
  // 执行登录（单独提取方法）
  async doLoginWithCode(code, nickname, avatarUrl) {
    const app = getApp();
    
    try {
      const res = await request({
        url: '/api/auth/wechat/login',
        method: 'POST',
        data: {
          code: code,
          nickname: nickname,
          avatarUrl: avatarUrl
        }
      });
      
      if (res.code === 0) {
        const { token, openid, userId, nickname: savedNickname, avatarUrl: savedAvatarUrl } = res.data;
        app.globalData.token = token;
        app.globalData.openid = openid;
        app.globalData.userId = userId;
        wx.setStorageSync('token', token);
        wx.setStorageSync('openid', openid);
        wx.setStorageSync('userId', userId);
        
        wx.hideLoading();
        
        // 如果用户没有设置头像和昵称，提示设置
        if (!savedNickname || !savedAvatarUrl) {
          wx.showToast({ 
            title: '登录成功，请设置头像和昵称', 
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showToast({ title: '登录成功', icon: 'success' });
        }
        
        // 重新加载数据
        this.checkLoginStatus();
        this.load();
        this.loadStats();
        this.loadProducts(true);
      } else {
        throw new Error(res.message || '登录失败');
      }
    } catch (e) {
      wx.hideLoading();
      throw e;
    }
  },
  // 选择头像（使用新的头像昵称填写能力）
  // 用户可以选择微信头像或自定义头像
  async onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('选择头像:', avatarUrl);
    
    if (!avatarUrl) {
      wx.showToast({ title: '未选择头像', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '上传头像中...' });
    
    try {
      // 压缩头像
      const fs = wx.getFileSystemManager();
      const stat = fs.statSync(avatarUrl);
      const MAX_BYTES = 3 * 1024 * 1024;
      const MIN_BYTES = 1 * 1024 * 1024;
      
      let finalPath = avatarUrl;
      if (stat.size > MAX_BYTES) {
        finalPath = await this.compressToTarget(avatarUrl, stat.size, MAX_BYTES, MIN_BYTES);
      }
      
      // 上传到OSS
      const dirPrefix = 'avatars/' + (new Date().toISOString().slice(0,10)) + '/';
      const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } });
      if (policy.code !== 0) {
        wx.hideLoading();
        wx.showToast({ title: '获取上传凭证失败', icon: 'none' });
        return;
      }
      
      const { accessid, host, policy: p, signature, dir } = policy.data;
      const key = dir + Date.now() + '_avatar_' + Math.floor(Math.random()*1000) + '.jpg';
      
      await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: host,
          filePath: finalPath,
          name: 'file',
          formData: { 
            key, 
            policy: p, 
            OSSAccessKeyId: accessid, 
            signature, 
            success_action_status: '200' 
          },
          success: (res) => {
            let url = host;
            if (!url.endsWith('/')) url += '/';
            url += key;
            
            // 保存头像到后端
            request({
              url: '/api/user/profile',
              method: 'POST',
              data: { avatarUrl: url }
            }).then(() => {
              // 更新本地显示
              this.setData({ 'user.avatarUrl': url });
              wx.hideLoading();
              wx.showToast({ title: '头像已更新', icon: 'success' });
              resolve();
            }).catch(reject);
          },
          fail: reject
        });
      });
    } catch (e) {
      wx.hideLoading();
      console.error('上传头像失败', e);
      wx.showToast({ title: '上传头像失败', icon: 'none' });
    }
  },
  // 开始编辑昵称
  startEditNickname() {
    this.setData({ editingNickname: true });
  },
  // 昵称输入失焦
  async onNicknameBlur(e) {
    const nickname = e.detail.value.trim();
    if (nickname && nickname !== this.data.user.nickname) {
      await this.saveNickname(nickname);
    }
    this.setData({ editingNickname: false });
  },
  // 昵称输入确认
  async onNicknameConfirm(e) {
    const nickname = e.detail.value.trim();
    if (nickname) {
      await this.saveNickname(nickname);
    }
    this.setData({ editingNickname: false });
  },
  // 保存昵称
  async saveNickname(nickname) {
    if (!nickname || nickname.trim() === '') {
      return;
    }
    
    wx.showLoading({ title: '保存中...' });
    try {
      const res = await request({
        url: '/api/user/profile',
        method: 'POST',
        data: { nickname: nickname.trim() }
      });
      
      if (res.code === 0) {
        this.setData({ 
          'user.nickname': nickname.trim(),
          editingNickname: false
        });
        wx.hideLoading();
        wx.showToast({ title: '昵称已更新', icon: 'success' });
      } else {
        throw new Error(res.message || '保存失败');
      }
    } catch (e) {
      wx.hideLoading();
      console.error('保存昵称失败', e);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },
  handleLogout(showConfirm = true) {
    if (!this.data.isLoggedIn) {
      return;
    }
    
    const doLogout = () => {
      // 清除登录信息
      const app = getApp();
      app.globalData.token = '';
      app.globalData.openid = '';
      app.globalData.userId = '';
      wx.removeStorageSync('token');
      wx.removeStorageSync('openid');
      wx.removeStorageSync('userId');
      
      // 更新页面状态
      this.setData({
        isLoggedIn: false,
        user: {},
        productList: [],
        publishCount: 0,
        favoriteCount: 0,
        orderCount: 0
      });
      
      wx.showToast({ title: '已退出', icon: 'success' });
    };
    
    if (showConfirm) {
      wx.showModal({
        title: '确认退出',
        content: '退出后需要重新登录才能使用相关功能',
        confirmText: '退出',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            doLogout();
          }
        }
      });
    } else {
      doLogout();
    }
  },
  goFavorite() { 
    if (!this.data.isLoggedIn) {
      this.handleLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/favorite/favorite' }); 
  },
  goManage() { 
    if (!this.data.isLoggedIn) {
      this.handleLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/manage/manage' }); 
  },
  goOrders() { 
    if (!this.data.isLoggedIn) {
      this.handleLogin();
      return;
    }
    wx.switchTab({ url: '/pages/orders/orders' }); 
  },
  goProfile() { 
    if (!this.data.isLoggedIn) {
      this.handleLogin();
      return;
    }
    wx.navigateTo({ url: '/pages/profile/profile' }); 
  }
});

