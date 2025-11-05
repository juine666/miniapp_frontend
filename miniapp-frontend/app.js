// 环境配置
const ENV_CONFIG = {
  // 开发环境（本地开发）
  development: 'http://localhost:8081',
  // 生产环境（部署到服务器后修改为你的服务器地址）
  production: "https://api.fxyw.work",  // 或 'http://your-server-ip:8081'
};

// 当前环境：开发时使用 development，发布时改为 production
const CURRENT_ENV = 'production';

App({
  globalData: {
    baseURL: ENV_CONFIG[CURRENT_ENV],
    token: '',
    openid: '',
    editingProductId: null,  // 用于在tabBar页面间传递编辑的商品ID
    chatParams: null,  // 用于在tabBar页面间传递聊天参数 {userId, productId, productName}
    unreadMessageCount: 0  // 未读消息总数
  },
  unreadTimer: null,  // 未读消息定时器
  onLaunch() {
    // 恢复已保存的登录状态，但不自动登录
    const token = wx.getStorageSync('token');
    const openid = wx.getStorageSync('openid');
    const userId = wx.getStorageSync('userId');
    if (token) {
      this.globalData.token = token;
      this.globalData.openid = openid;
      this.globalData.userId = userId;
      // 登录后开始更新未读消息数
      this.updateUnreadCount();
      this.startUnreadTimer();
    }
  },
  onShow() {
    // 页面显示时更新未读消息数
    if (this.globalData.token) {
      this.updateUnreadCount();
      if (!this.unreadTimer) {
        this.startUnreadTimer();
      }
    }
  },
  onHide() {
    // 页面隐藏时停止定时器
    if (this.unreadTimer) {
      clearInterval(this.unreadTimer);
      this.unreadTimer = null;
    }
  },
  // 更新未读消息数
  async updateUnreadCount() {
    if (!this.globalData.token) {
      return;
    }
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: this.globalData.baseURL + '/api/messages/unread-count',
          method: 'GET',
          header: {
            'Authorization': 'Bearer ' + this.globalData.token
          },
          success: resolve,
          fail: reject
        });
      });
      if (res.data && res.data.code === 0) {
        const count = res.data.data || 0;
        this.globalData.unreadMessageCount = count;
        // 更新 tabBar 角标
        if (count > 0) {
          wx.setTabBarBadge({
            index: 3,  // 消息 tab 的索引（从0开始：首页0，订单1，发布2，消息3，我的4）
            text: count > 99 ? '99+' : String(count)
          });
        } else {
          wx.removeTabBarBadge({
            index: 3
          });
        }
      }
    } catch (e) {
      console.error('获取未读消息数失败', e);
    }
  },
  // 启动未读消息定时器
  startUnreadTimer() {
    if (this.unreadTimer) {
      clearInterval(this.unreadTimer);
    }
    // 每30秒更新一次未读消息数
    this.unreadTimer = setInterval(() => {
      this.updateUnreadCount();
    }, 30000);
  },
  doLogin(nickname, avatarUrl) {
    return new Promise((resolve, reject) => {
      // 登录获取code
      wx.login({
        success: (res) => {
          if (res.code) {
            console.log('获取到登录code:', res.code);
            wx.request({
              url: this.globalData.baseURL + '/api/auth/wechat/login',
              method: 'POST',
              data: { 
                code: res.code,
                nickname: nickname,
                avatarUrl: avatarUrl
              },
              success: (r) => {
                if (r.data && r.data.code === 0) {
                  const { token, openid, userId, nickname: savedNickname, avatarUrl: savedAvatarUrl } = r.data.data;
                  this.globalData.token = token;
                  this.globalData.openid = openid;
                  this.globalData.userId = userId;
                  wx.setStorageSync('token', token);
                  wx.setStorageSync('openid', openid);
                  wx.setStorageSync('userId', userId);
                  resolve({ token, openid, userId });
                  // 登录成功后更新未读消息数
                  this.updateUnreadCount();
                  this.startUnreadTimer();
                } else {
                  reject(new Error(r.data?.message || '登录失败'));
                }
              },
              fail: (err) => {
                console.error('登录请求失败', err);
                reject(err);
              }
            });
          } else {
            console.error('wx.login失败，未获取到code');
            reject(new Error('获取登录code失败'));
          }
        },
        fail: (err) => {
          console.error('wx.login调用失败', err);
          reject(err);
        }
      });
    });
  }
});

