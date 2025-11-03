const { request } = require('../../utils/request');

Page({
  data: { user: {}, contact: {} },
  onLoad() {
    this.load();
  },
  async load() {
    try {
      const me = await request({ url: '/api/user/me' });
      if (me.code === 0) {
        this.setData({ user: me.data || {} });
      }
    } catch (e) {
      console.error('加载用户信息失败', e);
      this.setData({ user: { nickname: '', avatarUrl: '' } });
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
      
      const MAX_BYTES = 3 * 1024 * 1024;
      const MIN_BYTES = 1 * 1024 * 1024;
      
      if (stat.size > MAX_BYTES) {
        wx.showLoading({ title: '压缩中...' });
        filePath = await this.compressToTarget(filePath, stat.size, MAX_BYTES, MIN_BYTES);
      }
      
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
      
      await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: host,
          filePath,
          name: 'file',
          formData: { 
            key, 
            policy: p, 
            OSSAccessKeyId: accessid, 
            signature, 
            success_action_status: '200' 
          },
          success: (res) => {
            console.log('头像上传成功', res);
            // 构造完整的图片URL
            let url = host;
            if (!url.endsWith('/')) {
              url += '/';
            }
            url += key;
            console.log('头像URL:', url);
            
            // 立即更新显示
            this.setData({ 
              'user.avatarUrl': url 
            }, () => {
              console.log('头像URL已更新到页面');
            });
            
            wx.hideLoading();
            wx.showToast({ title: '上传成功', icon: 'success' });
            resolve();
          },
          fail: (err) => {
            console.error('头像上传失败', err);
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
            reject(err);
          }
        });
      });
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
  async saveAll() {
    try {
      wx.showLoading({ title: '保存中...' });
      
      // 保存基本资料和联系方式
      const [profileRes, contactRes] = await Promise.allSettled([
        request({ 
          url: '/api/user/profile', 
          method: 'POST', 
          data: { 
            nickname: this.data.user.nickname, 
            avatarUrl: this.data.user.avatarUrl 
          } 
        }),
        request({ 
          url: '/api/user/contact', 
          method: 'POST', 
          data: this.data.contact 
        })
      ]);
      
      wx.hideLoading();
      
      let successCount = 0;
      let errorMessages = [];
      
      if (profileRes.status === 'fulfilled' && profileRes.value.code === 0) {
        successCount++;
      } else {
        const error = profileRes.status === 'fulfilled' 
          ? profileRes.value.message || '保存基本资料失败'
          : '保存基本资料失败';
        errorMessages.push(error);
      }
      
      if (contactRes.status === 'fulfilled' && contactRes.value.code === 0) {
        successCount++;
      } else {
        const error = contactRes.status === 'fulfilled' 
          ? contactRes.value.message || '保存联系方式失败'
          : '保存联系方式失败';
        errorMessages.push(error);
      }
      
      if (successCount === 2) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        await this.load(); // 重新加载数据
      } else if (successCount === 1) {
        wx.showToast({ 
          title: `部分保存成功：${errorMessages.join('；')}`, 
          icon: 'none',
          duration: 3000
        });
        await this.load();
      } else {
        wx.showToast({ 
          title: errorMessages.join('；') || '保存失败，请重试', 
          icon: 'none',
          duration: 3000
        });
      }
    } catch (e) {
      wx.hideLoading();
      console.error('保存资料失败', e);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
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
        await this.load();
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
        await this.load();
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (e) {
      console.error('保存联系方式失败', e);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  }
});

