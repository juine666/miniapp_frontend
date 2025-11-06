const { request } = require('../../utils/request');
const app = getApp();

Page({
  data: { 
    productId: null,
    form: { name: '', description: '', price: '', imageUrls: [], categoryId: null },
    categoryList: [],
    categoryIndex: 0,
    categoryName: '',
    uploading: false,
    saving: false,  // 添加保存状态，防止重复提交
    location: null, // 商品位置 {latitude, longitude}
    locationName: '未设置位置' // 位置名称
  },
  async onLoad(options) {
    // 重置保存状态
    this.setData({ saving: false });
    
    // 加载分类列表（即使失败也继续）
    try {
      await this.loadCategories();
    } catch (e) {
      console.error('加载分类失败，但继续加载页面', e);
      // 不显示错误提示，避免干扰用户
    }
    
    // 优先从 options.id 获取（如果是从非tabBar页面跳转）
    // 其次从全局数据获取（如果是从tabBar页面跳转）
    const app = getApp();
    const productId = options.id || app.globalData.editingProductId;
    
    if (productId) {
      console.log('加载编辑模式，商品ID:', productId);
      this.setData({ productId: productId });
      wx.setNavigationBarTitle({ title: '编辑商品' });
      try {
        await this.loadProduct(productId);
      } catch (e) {
        console.error('加载商品失败', e);
        wx.showToast({ title: '加载商品失败', icon: 'none' });
      }
      // 清除全局数据，避免重复编辑
      app.globalData.editingProductId = null;
    } else {
      console.log('加载发布模式');
      wx.setNavigationBarTitle({ title: '发布商品' });
      // 确保是新建模式，清除可能残留的数据
      this.resetForm();
    }
  },
  onShow() {
    // 更新自定义tabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      });
    }
    // 每次显示页面时检查是否有待编辑的商品ID
    const app = getApp();
    // 如果已经有productId，说明已经在编辑模式，不要重复加载
    if (app.globalData.editingProductId && !this.data.productId && !this.data.saving) {
      const productId = app.globalData.editingProductId;
      this.setData({ productId: productId });
      wx.setNavigationBarTitle({ title: '编辑商品' });
      this.loadProduct(productId);
      // 清除全局数据
      app.globalData.editingProductId = null;
    }
    // 如果当前没有productId且不在保存状态，确保是新建模式
    else if (!this.data.productId && !this.data.saving) {
      wx.setNavigationBarTitle({ title: '发布商品' });
      // 如果是通过tabBar进入的新建模式，确保表单是空的
      // 检查是否有残留数据（除了默认分类）
      const hasData = (this.data.form.imageUrls && this.data.form.imageUrls.length > 0) ||
                      (this.data.form.description && this.data.form.description.trim()) ||
                      (this.data.form.price && this.data.form.price.trim()) ||
                      (this.data.location);
      if (hasData) {
        console.log('检测到残留数据，清除表单');
        this.resetForm();
      }
    }
  },
  // 重置表单数据
  resetForm() {
    // 获取默认分类（如果有）
    const defaultCategoryId = this.data.categoryList.length > 0 ? this.data.categoryList[0].id : null;
    const defaultCategoryName = this.data.categoryList.length > 0 ? this.data.categoryList[0].name : '';
    
    this.setData({ 
      productId: null,
      'form.name': '',
      'form.description': '',
      'form.price': '',
      'form.imageUrls': [],
      'form.categoryId': defaultCategoryId,
      categoryIndex: this.data.categoryList.length > 0 ? 0 : 0,
      categoryName: defaultCategoryName,
      location: null,
      locationName: '未设置位置'
    });
    console.log('表单已重置');
  },
  async loadCategories() {
    try {
      const res = await request({ url: '/api/categories' });
      if (res.code === 0 && res.data) {
        const categories = res.data || [];
        this.setData({ categoryList: categories });
        
        // 如果是新发布（不是编辑），默认选择第一个分类
        if (!this.data.productId && categories.length > 0) {
          const firstCategory = categories[0];
          this.setData({ 
            'form.categoryId': firstCategory.id,
            categoryIndex: 0,
            categoryName: firstCategory.name
          });
          console.log('默认选择第一个分类:', firstCategory.name, 'ID:', firstCategory.id);
        } else if (categories.length === 0) {
          // 如果没有分类数据，重置索引
          this.setData({ categoryIndex: 0 });
          wx.showToast({ title: '暂无分类，请联系管理员', icon: 'none' });
        }
      } else {
        console.error('加载分类失败，响应:', res);
        wx.showToast({ title: '加载分类失败', icon: 'none' });
      }
    } catch (e) {
      console.error('加载分类失败', e);
      // 即使加载失败，也要确保categoryIndex有有效值
      this.setData({ categoryIndex: 0 });
      // 不抛出错误，让页面可以继续加载
      console.error('分类加载失败，但页面继续加载');
    }
  },
  async loadProduct(id) {
    console.log('开始加载商品，ID:', id);
    try {
      const res = await request({ url: `/api/my/products` });
      if (res.code === 0) {
        const pageData = res.data.content || res.data || [];
        const product = pageData.find(p => p.id == id);
        console.log('找到商品:', product);
        
        if (product) {
          const categoryIndex = this.data.categoryList.findIndex(c => c.id == product.categoryId);
          const category = this.data.categoryList.find(c => c.id == product.categoryId);
          
          // 处理图片URL：优先从imageUrls字段获取，否则从coverUrl解析
          let imageUrls = [];
          if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
            imageUrls = product.imageUrls;
            console.log('使用imageUrls字段:', imageUrls);
          } else if (product.coverUrl) {
            // 如果coverUrl是JSON格式，尝试解析
            try {
              if (typeof product.coverUrl === 'string' && product.coverUrl.startsWith('[')) {
                imageUrls = JSON.parse(product.coverUrl);
                console.log('解析coverUrl JSON:', imageUrls);
              } else {
                imageUrls = [product.coverUrl];
                console.log('使用单张coverUrl:', imageUrls);
              }
            } catch (e) {
              // 解析失败，当作单张图片
              imageUrls = [product.coverUrl];
              console.log('解析失败，使用单张图片:', imageUrls);
            }
          }
          
          console.log('最终图片列表:', imageUrls);
          
          // 加载位置信息
          const location = (product.latitude && product.longitude) ? {
            latitude: product.latitude,
            longitude: product.longitude
          } : null;
          
          this.setData({
            'form.name': product.name || '',
            'form.description': product.description || '',
            'form.price': product.price ? String(product.price) : '',
            'form.imageUrls': imageUrls,
            'form.categoryId': product.categoryId || null,
            categoryIndex: categoryIndex >= 0 ? categoryIndex : 0,
            categoryName: category ? category.name : '',
            location: location,
            locationName: location ? '已设置位置' : '未设置位置'
          });
          
          console.log('商品数据加载完成，图片数量:', imageUrls.length);
        } else {
          console.error('未找到商品，ID:', id);
          wx.showToast({ title: '商品不存在', icon: 'none' });
        }
      } else {
        console.error('加载商品失败:', res);
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
      }
    } catch (e) {
      console.error('加载商品异常:', e);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },
  onCategoryChange(e) {
    const index = Number(e.detail.value);
    const category = this.data.categoryList[index];
    if (category) {
      this.setData({ 
        'form.categoryId': category.id,
        categoryIndex: index,
        categoryName: category.name
      });
      console.log('选择分类:', category.name, 'ID:', category.id);
    }
  },
  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`form.${key}`]: e.detail.value });
  },
  async chooseImage() {
    try {
      const currentImages = this.data.form.imageUrls || [];
      const remainingCount = 3 - currentImages.length;
      
      if (remainingCount <= 0) {
        wx.showToast({ title: '最多只能上传3张图片', icon: 'none' });
        return;
      }
      
      this.setData({ uploading: true });
      wx.showLoading({ title: '选择图片中...' });
      const choose = await wx.chooseMedia({ 
        count: remainingCount, 
        mediaType: ['image'] 
      });
      
      if (!choose.tempFiles || choose.tempFiles.length === 0) {
        this.setData({ uploading: false });
        wx.hideLoading();
        return;
      }
      
      wx.showLoading({ title: '压缩图片中...' });
      const fs = wx.getFileSystemManager();
      const MAX_BYTES = 3 * 1024 * 1024;
      const MIN_BYTES = 1 * 1024 * 1024;
      
      // 压缩所有选中的图片
      const compressedFiles = [];
      for (const file of choose.tempFiles) {
        const stat = fs.statSync(file.tempFilePath);
        const compressedPath = await compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES);
        compressedFiles.push(compressedPath);
      }
      
      wx.showLoading({ title: '获取上传凭证...' });
      const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0,10)) + '/';
      const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } });
      if (policy.code !== 0) {
        wx.hideLoading();
        this.setData({ uploading: false });
        wx.showToast({ title: '获取上传凭证失败', icon: 'none' });
        return;
      }
      
      const { accessid, host, policy: p, signature, dir } = policy.data;
      
      wx.showLoading({ title: '上传中...' });
      const uploadedUrls = [];
      
      // 逐个上传图片
      for (let i = 0; i < compressedFiles.length; i++) {
        const filePath = compressedFiles[i];
        const key = dir + Date.now() + '_' + i + '_' + Math.floor(Math.random()*1000) + '.jpg';
        
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
              let url = host;
              if (!url.endsWith('/')) {
                url += '/';
              }
              url += key;
              uploadedUrls.push(url);
              resolve();
            },
            fail: (err) => {
              console.error('OSS上传失败', err);
              reject(err);
            }
          });
        });
      }
      
      // 更新图片URL数组
      const newImageUrls = [...currentImages, ...uploadedUrls];
      this.setData({ 
        'form.imageUrls': newImageUrls,
        uploading: false
      });
      
      wx.hideLoading();
      wx.showToast({ title: `成功上传${uploadedUrls.length}张图片`, icon: 'success' });
    } catch (e) {
      this.setData({ uploading: false });
      wx.hideLoading();
      console.error('图片上传异常', e);
      wx.showToast({ title: '操作失败: ' + (e.message || '未知错误'), icon: 'none', duration: 2000 });
    }
  },
  deleteImage(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const index = e.currentTarget.dataset.index;
    const imageUrls = this.data.form.imageUrls || [];
    if (imageUrls.length <= 1) {
      wx.showToast({ title: '至少需要保留一张图片', icon: 'none' });
      return;
    }
    imageUrls.splice(index, 1);
    this.setData({ 'form.imageUrls': imageUrls });
    console.log('删除图片，剩余:', imageUrls.length);
  },
  // 替换图片（点击已上传的图片）
  async replaceImage(e) {
    const index = e.currentTarget.dataset.index;
    console.log('替换图片，索引:', index);
    
    try {
      const currentImages = this.data.form.imageUrls || [];
      
      this.setData({ uploading: true });
      wx.showLoading({ title: '选择图片中...' });
      const choose = await wx.chooseMedia({ 
        count: 1, 
        mediaType: ['image'] 
      });
      
      if (!choose.tempFiles || choose.tempFiles.length === 0) {
        this.setData({ uploading: false });
        wx.hideLoading();
        return;
      }
      
      wx.showLoading({ title: '压缩图片中...' });
      const fs = wx.getFileSystemManager();
      const MAX_BYTES = 3 * 1024 * 1024;
      const MIN_BYTES = 1 * 1024 * 1024;
      
      const file = choose.tempFiles[0];
      const stat = fs.statSync(file.tempFilePath);
      const compressedPath = await compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES);
      
      wx.showLoading({ title: '获取上传凭证...' });
      const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0,10)) + '/';
      const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } });
      if (policy.code !== 0) {
        wx.hideLoading();
        this.setData({ uploading: false });
        wx.showToast({ title: '获取上传凭证失败', icon: 'none' });
        return;
      }
      
      const { accessid, host, policy: p, signature, dir } = policy.data;
      
      wx.showLoading({ title: '上传中...' });
      const key = dir + Date.now() + '_' + index + '_' + Math.floor(Math.random()*1000) + '.jpg';
      
      await new Promise((resolve, reject) => {
        wx.uploadFile({
          url: host,
          filePath: compressedPath,
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
            if (!url.endsWith('/')) {
              url += '/';
            }
            url += key;
            
            // 替换指定位置的图片
            const newImageUrls = [...currentImages];
            newImageUrls[index] = url;
            
            this.setData({ 
              'form.imageUrls': newImageUrls,
              uploading: false
            });
            
            wx.hideLoading();
            wx.showToast({ title: '替换成功', icon: 'success' });
            resolve();
          },
          fail: (err) => {
            console.error('OSS上传失败', err);
            reject(err);
          }
        });
      });
    } catch (e) {
      this.setData({ uploading: false });
      wx.hideLoading();
      console.error('替换图片异常', e);
      wx.showToast({ title: '替换失败: ' + (e.message || '未知错误'), icon: 'none', duration: 2000 });
    }
  },
  onImageError(e) {
    console.error('图片加载失败', e);
    wx.showToast({ title: '图片加载失败', icon: 'none' });
  },
  goBatchPublish() {
    wx.navigateTo({
      url: '/pages/batch-publish/batch-publish'
    });
  },
  // 使用当前位置（快捷按钮）
  async useCurrentLocation() {
    try {
      wx.showLoading({ title: '定位中...' });
      
      const locationRes = await new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: resolve,
          fail: reject
        });
      });
      
      wx.hideLoading();
      
      const location = {
        latitude: locationRes.latitude,
        longitude: locationRes.longitude
      };
      
      // 尝试使用逆地理编码获取地址名称
      let locationName = '当前位置';
      
      // 尝试调用腾讯地图逆地理编码API（如果配置了key）
      // 或者可以使用后端API
      try {
        // 这里可以调用后端或第三方API进行逆地理编码
        // 暂时使用简单提示
        locationName = '当前位置';
      } catch (geoError) {
        console.warn('逆地理编码失败', geoError);
      }
      
      this.setData({ 
        location,
        locationName
      });
      
      wx.showToast({ title: '位置已设置', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      console.error('获取当前位置失败:', e);
      wx.showModal({
        title: '定位失败',
        content: '无法获取您的位置信息，请检查是否开启了位置权限',
        showCancel: true,
        confirmText: '重试',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.useCurrentLocation();
          }
        }
      });
    }
  },
  
  // 选择位置（打开地图选择）
  async chooseLocation() {
    try {
      // 使用微信地图选择位置，可以返回地址名称
      const res = await new Promise((resolve, reject) => {
        wx.chooseLocation({
          success: resolve,
          fail: reject
        });
      });
      
      const location = {
        latitude: res.latitude,
        longitude: res.longitude
      };
      
      // 使用选择的位置名称，如果没有则使用地址
      let locationName = res.name || res.address || '已选择位置';
      
      // 如果地址很长，截取前面的部分
      if (locationName.length > 20) {
        locationName = locationName.substring(0, 20) + '...';
      }
      
      this.setData({ 
        location,
        locationName
      });
      
      wx.showToast({ title: '位置已设置', icon: 'success' });
    } catch (e) {
      console.error('选择位置失败:', e);
      
      // 如果用户取消选择，不显示错误提示
      if (e.errMsg && e.errMsg.includes('cancel')) {
        return;
      }
      
      // 如果chooseLocation失败，提示用户
      wx.showToast({ 
        title: '选择位置失败', 
        icon: 'none',
        duration: 2000
      });
    }
  },
  async submit() {
    // 防止重复提交
    if (this.data.saving) {
      console.log('正在保存中，请勿重复提交');
      return;
    }
    
    const { productId, form } = this.data;
    const { name, description, price, imageUrls, categoryId } = form;
    
    // 验证：分类和价格必填
    if (!categoryId) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }
    
    if (!price) {
      wx.showToast({ title: '请填写价格', icon: 'none' });
      return;
    }
    
    // 图片验证：至少需要一张图片
    const imageList = imageUrls || [];
    if (imageList.length === 0) {
      wx.showToast({ title: '请至少上传一张图片', icon: 'none' });
      return;
    }
    
    // 第一张图片作为封面图
    const coverUrl = imageList[0];
    
    // 设置保存状态
    this.setData({ saving: true });
    wx.showLoading({ title: productId ? '保存中...' : '发布中...' });
    
    try {
      if (productId) {
        // 编辑模式
        console.log('编辑商品，ID:', productId);
        const requestData = { 
          name: name || '', 
          description: description || '', 
          price: Number(price), 
          coverUrl: coverUrl,
          imageUrls: imageList, // 传递所有图片URL
          categoryId: categoryId
        };
        
        // 如果有位置信息，添加到请求数据中
        if (this.data.location) {
          requestData.latitude = this.data.location.latitude;
          requestData.longitude = this.data.location.longitude;
          console.log('编辑商品时添加位置信息:', requestData.latitude, requestData.longitude);
        }
        
        const res = await request({ 
          url: `/api/my/products/${productId}`, 
          method: 'PUT', 
          data: requestData
        });
        
        wx.hideLoading();
        this.setData({ saving: false });
        
        if (res.code === 0) {
          wx.showToast({ title: '已更新', icon: 'success' });
          // 立即返回，不要清除productId（因为页面即将关闭）
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else {
          wx.showToast({ title: res.message || '更新失败', icon: 'none' });
        }
      } else {
        // 发布模式
        console.log('发布新商品');
        const requestData = { 
          name: name || '', 
          description: description || '', 
          price: Number(price), 
          coverUrl: coverUrl,
          imageUrls: imageList, // 传递所有图片URL
          categoryId: categoryId
        };
        
        // 如果有位置信息，添加到请求数据中
        if (this.data.location) {
          requestData.latitude = this.data.location.latitude;
          requestData.longitude = this.data.location.longitude;
          console.log('发布商品时添加位置信息:', requestData.latitude, requestData.longitude);
        }
        
        const res = await request({ 
          url: '/api/products', 
          method: 'POST', 
          data: requestData
        });
        
        wx.hideLoading();
        this.setData({ saving: false });
        
        if (res.code === 0) {
          wx.showToast({ title: '已发布', icon: 'success' });
          // 清除所有表单数据，包括位置信息
          this.resetForm();
          setTimeout(() => {
            wx.navigateBack();
          }, 1000);
        } else {
          wx.showToast({ title: res.message || '发布失败', icon: 'none' });
        }
      }
    } catch (e) {
      wx.hideLoading();
      this.setData({ saving: false });
      console.error('保存失败', e);
      wx.showToast({ title: '操作失败，请重试', icon: 'none' });
    }
  }
});

async function compressToTarget(srcPath, currentSize, maxBytes, minBytes) {
  // 若已小于最大限制，直接返回
  if (currentSize <= maxBytes) return srcPath;

  // 逐步降低质量尝试压缩到 <= maxBytes，避免过小（< minBytes）
  const fs = wx.getFileSystemManager();
  const qualities = [80, 70, 60, 50, 40, 35, 30];
  let bestPath = srcPath;
  let bestSize = currentSize;

  for (const q of qualities) {
    try {
      const outPath = await compressOnce(srcPath, q);
      const s = fs.statSync(outPath).size;
      // 选择不超过max的最优（尽量接近但不小于min）
      if (s <= maxBytes) {
        if (s >= minBytes) return outPath; // 命中理想区间
        // 小于minBytes也接受，但先记录，继续看看是否有更接近min的
        if (s < bestSize) { bestPath = outPath; bestSize = s; }
        // 继续尝试更高质量（但我们是从高到低，这里直接返回更合理）
        return outPath;
      }
      // s > maxBytes，记录更小的也行，继续下降质量
      if (s < bestSize) { bestPath = outPath; bestSize = s; }
    } catch (e) {
      // 压缩失败跳过
    }
  }
  return bestPath;
}

function compressOnce(srcPath, quality) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: srcPath,
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    });
  });
}

