const { request } = require('../../utils/request');

Page({
  data: {
    // 微信配置
    wechatAppId: '',
    wechatSecret: '',
    
    // 服务器配置
    serverUrl: '',
    
    // OSS配置
    ossEndpoint: '',
    ossBucket: '',
    ossAccessKeyId: '',
    ossAccessKeySecret: '',
    ossPublicBaseUrl: ''
  },

  onLoad() {
    this.loadConfig();
  },

  // 加载配置
  async loadConfig() {
    try {
      wx.showLoading({ title: '加载中...' });
      
      // 获取微信配置
      const wechatConfigs = await request({ url: '/api/admin/config/wechat' });
      if (wechatConfigs.code === 0) {
        const wechatConfig = wechatConfigs.data || {};
        this.setData({
          wechatAppId: wechatConfig.appid || '',
          wechatSecret: wechatConfig.secret || ''
        });
      }
      
      // 获取服务器配置
      const serverConfigs = await request({ url: '/api/admin/config/server' });
      if (serverConfigs.code === 0) {
        const serverConfig = serverConfigs.data || {};
        this.setData({
          serverUrl: serverConfig.url || ''
        });
      }
      
      // 获取OSS配置
      const ossConfigs = await request({ url: '/api/admin/config/oss' });
      if (ossConfigs.code === 0) {
        const ossConfig = ossConfigs.data || {};
        this.setData({
          ossEndpoint: ossConfig.endpoint || '',
          ossBucket: ossConfig.bucket || '',
          ossAccessKeyId: ossConfig.accessKeyId || '',
          ossAccessKeySecret: ossConfig.accessKeySecret || '',
          ossPublicBaseUrl: ossConfig.publicBaseUrl || ''
        });
      }
      
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('加载配置失败:', error);
      wx.showToast({ title: '加载配置失败', icon: 'none' });
    }
  },

  // 输入框变化事件
  onWechatAppIdChange(e) {
    this.setData({ wechatAppId: e.detail.value });
  },

  onWechatSecretChange(e) {
    this.setData({ wechatSecret: e.detail.value });
  },

  onServerUrlChange(e) {
    this.setData({ serverUrl: e.detail.value });
  },

  onOssEndpointChange(e) {
    this.setData({ ossEndpoint: e.detail.value });
  },

  onOssBucketChange(e) {
    this.setData({ ossBucket: e.detail.value });
  },

  onOssAccessKeyIdChange(e) {
    this.setData({ ossAccessKeyId: e.detail.value });
  },

  onOssAccessKeySecretChange(e) {
    this.setData({ ossAccessKeySecret: e.detail.value });
  },

  onOssPublicBaseUrlChange(e) {
    this.setData({ ossPublicBaseUrl: e.detail.value });
  },

  // 保存配置
  async saveConfig() {
    try {
      wx.showLoading({ title: '保存中...' });
      
      // 保存微信配置
      await request({
        url: '/api/admin/config/wechat',
        method: 'POST',
        data: {
          appid: this.data.wechatAppId,
          secret: this.data.wechatSecret
        }
      });
      
      // 保存服务器配置
      await request({
        url: '/api/admin/config/server',
        method: 'POST',
        data: {
          url: this.data.serverUrl
        }
      });
      
      // 保存OSS配置
      await request({
        url: '/api/admin/config/oss',
        method: 'POST',
        data: {
          endpoint: this.data.ossEndpoint,
          bucket: this.data.ossBucket,
          accessKeyId: this.data.ossAccessKeyId,
          accessKeySecret: this.data.ossAccessKeySecret,
          publicBaseUrl: this.data.ossPublicBaseUrl
        }
      });
      
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('保存配置失败:', error);
      wx.showToast({ title: '保存配置失败', icon: 'none' });
    }
  }
});