const { request } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    products: [], // 商品列表 [{images: [], description: '', price: '', categoryId: null}]
    categoryList: [],
    uploading: false,
    publishing: false
  },
  async onLoad() {
    await this.loadCategories();
  },
  async loadCategories() {
    try {
      const res = await request({ url: '/api/categories' });
      if (res.code === 0 && res.data) {
        this.setData({ categoryList: res.data || [] });
      }
    } catch (e) {
      console.error('加载分类失败', e);
    }
  },
  // 批量选择图片（每张图片创建一个商品）
  async chooseImages() {
    try {
      wx.showLoading({ title: '选择图片中...' });
      const choose = await wx.chooseMedia({ 
        count: 9, // 最多选择9张图片
        mediaType: ['image'],
        sourceType: ['album', 'camera'] // 支持相册和拍照
      });
      
      if (!choose.tempFiles || choose.tempFiles.length === 0) {
        wx.hideLoading();
        return;
      }
      
      wx.hideLoading();
      
      // 直接按每张图片创建一个商品的方式处理
      this.createProductsFromImages(choose.tempFiles);
    } catch (e) {
      wx.hideLoading();
      console.error('选择图片失败', e);
      wx.showToast({ title: '选择图片失败', icon: 'none' });
    }
  },
  // 从图片创建商品（每张图片创建一个商品）
  async createProductsFromImages(tempFiles) {
    this.setData({ uploading: true });
    wx.showLoading({ title: '上传图片中...' });
    
    try {
      const fs = wx.getFileSystemManager();
      const MAX_BYTES = 3 * 1024 * 1024;
      const MIN_BYTES = 1 * 1024 * 1024;
      
      // 压缩所有图片
      const compressedFiles = [];
      for (const file of tempFiles) {
        const stat = fs.statSync(file.tempFilePath);
        const compressedPath = await compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES);
        compressedFiles.push(compressedPath);
      }
      
      // 获取上传凭证
      const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0,10)) + '/';
      const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } });
      if (policy.code !== 0) {
        wx.hideLoading();
        this.setData({ uploading: false });
        wx.showToast({ title: '获取上传凭证失败', icon: 'none' });
        return;
      }
      
      const { accessid, host, policy: p, signature, dir } = policy.data;
      
      // 上传所有图片到OSS
      const uploadedUrls = [];
      for (let i = 0; i < compressedFiles.length; i++) {
        const filePath = compressedFiles[i];
        const filename = dir + 'image_' + Date.now() + '_' + i + '.jpg';
        
        await new Promise((resolve, reject) => {
          wx.uploadFile({
            url: host,
            filePath,
            name: 'file',
            formData: {
              key: filename,
              policy: p,
              OSSAccessKeyId: accessid,
              signature: signature,
              success_action_status: '200'
            },
            success: (res) => {
              if (res.statusCode === 200 || res.statusCode === 204) {
                const ossUrl = host.replace(/\/$/, '') + '/' + filename;
                uploadedUrls.push(ossUrl);
                resolve();
              } else {
                reject(new Error('上传到OSS失败'));
              }
            },
            fail: reject
          });
        });
      }
      
      // 每张图片创建一个商品
      const defaultCategoryId = this.data.categoryList.length > 0 ? this.data.categoryList[0].id : null;
      const products = uploadedUrls.map(url => ({
        images: [url],
        description: '',
        price: '',
        categoryId: defaultCategoryId,
        categoryIndex: 0
      }));
      
      this.setData({ 
        products: [...this.data.products, ...products],
        uploading: false
      });
      
      wx.hideLoading();
      wx.showToast({ title: `已添加${products.length}个商品`, icon: 'success' });
    } catch (e) {
      this.setData({ uploading: false });
      wx.hideLoading();
      console.error('处理图片失败', e);
      wx.showToast({ title: '处理失败', icon: 'none' });
    }
  },
  // 粘贴聊天记录文本
  onPasteText(e) {
    const text = e.detail.value;
    if (!text) return;
    
    // 解析文本，提取商品信息
    const lines = text.split('\n').filter(line => line.trim());
    const products = [];
    let currentProduct = null;
    
    for (const line of lines) {
      // 检测价格：包含"元"的数字
      const priceMatch = line.match(/(\d+(?:\.\d+)?)\s*元/);
      if (priceMatch) {
        // 如果当前商品有价格，保存它并创建新商品
        if (currentProduct && currentProduct.price) {
          products.push(currentProduct);
        }
        currentProduct = {
          images: [],
          description: line.trim(),
          price: priceMatch[1],
          categoryId: this.data.categoryList.length > 0 ? this.data.categoryList[0].id : null,
          categoryIndex: 0
        };
      } else if (currentProduct) {
        // 追加到当前商品的描述中
        currentProduct.description += (currentProduct.description ? '\n' : '') + line.trim();
      } else {
        // 创建新商品（没有价格）
        currentProduct = {
          images: [],
          description: line.trim(),
          price: '',
          categoryId: this.data.categoryList.length > 0 ? this.data.categoryList[0].id : null,
          categoryIndex: 0
        };
      }
    }
    
    // 保存最后一个商品
    if (currentProduct) {
      products.push(currentProduct);
    }
    
    if (products.length > 0) {
      this.setData({ products: [...this.data.products, ...products] });
      wx.showToast({ title: `已解析${products.length}个商品`, icon: 'success' });
    } else {
      wx.showToast({ title: '未能解析出商品信息', icon: 'none' });
    }
  },
  // 添加商品
  addProduct() {
    const products = [...this.data.products];
    products.push({
      images: [],
      description: '',
      price: '',
      categoryId: this.data.categoryList.length > 0 ? this.data.categoryList[0].id : null,
      categoryIndex: 0
    });
    this.setData({ products });
  },
  // 编辑商品描述
  onDescriptionInput(e) {
    const index = e.currentTarget.dataset.index;
    const products = [...this.data.products];
    products[index].description = e.detail.value;
    this.setData({ products });
  },
  // 编辑商品价格
  onPriceInput(e) {
    const index = e.currentTarget.dataset.index;
    const products = [...this.data.products];
    products[index].price = e.detail.value;
    this.setData({ products });
  },
  // 选择分类
  onCategoryChange(e) {
    const index = e.currentTarget.dataset.index;
    const categoryIndex = Number(e.detail.value);
    const products = [...this.data.products];
    products[index].categoryId = this.data.categoryList[categoryIndex].id;
    products[index].categoryIndex = categoryIndex;
    this.setData({ products });
  },
  // 为商品添加图片
  async addImageToProduct(e) {
    const productIndex = e.currentTarget.dataset.index;
    const product = this.data.products[productIndex];
    const remainingCount = 3 - product.images.length;
    
    if (remainingCount <= 0) {
      wx.showToast({ title: '最多3张图片', icon: 'none' });
      return;
    }
    
    try {
      wx.showLoading({ title: '选择图片中...' });
      const choose = await wx.chooseMedia({ 
        count: remainingCount, 
        mediaType: ['image'] 
      });
      
      if (!choose.tempFiles || choose.tempFiles.length === 0) {
        wx.hideLoading();
        return;
      }
      
      wx.hideLoading();
      wx.showLoading({ title: '上传中...' });
      
      const fs = wx.getFileSystemManager();
      const MAX_BYTES = 3 * 1024 * 1024;
      const MIN_BYTES = 1 * 1024 * 1024;
      
      // 压缩图片
      const compressedFiles = [];
      for (const file of choose.tempFiles) {
        const stat = fs.statSync(file.tempFilePath);
        const compressedPath = await compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES);
        compressedFiles.push(compressedPath);
      }
      
      // 获取上传凭证
      const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0,10)) + '/';
      const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } });
      if (policy.code !== 0) {
        wx.hideLoading();
        wx.showToast({ title: '获取上传凭证失败', icon: 'none' });
        return;
      }
      
      const { accessid, host, policy: p, signature, dir } = policy.data;
      
      // 上传图片
      const uploadedUrls = [];
      for (let i = 0; i < compressedFiles.length; i++) {
        const filePath = compressedFiles[i];
        
        await new Promise((resolve, reject) => {
          wx.uploadFile({
            url: 'http://192.168.101.4:8081/api/upload',
            filePath,
            name: 'file',
            formData: {},
            success: (res) => {
              try {
                const response = JSON.parse(res.data);
                if (response.code === 0 && response.data && response.data.url) {
                  uploadedUrls.push(response.data.url);
                  resolve();
                } else {
                  reject(new Error(response.message || '上传失败'));
                }
              } catch (e) {
                reject(new Error('解析响应失败'));
              }
            },
            fail: reject
          });
        });
      }
      
      // 更新商品图片
      const products = [...this.data.products];
      products[productIndex].images = [...products[productIndex].images, ...uploadedUrls];
      this.setData({ products });
      
      wx.hideLoading();
      wx.showToast({ title: `已添加${uploadedUrls.length}张图片`, icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      console.error('添加图片失败', e);
      wx.showToast({ title: '添加失败', icon: 'none' });
    }
  },
  // 删除商品图片
  deleteImage(e) {
    e.stopPropagation();
    const productIndex = e.currentTarget.dataset.productIndex;
    const imageIndex = e.currentTarget.dataset.imageIndex;
    const products = [...this.data.products];
    products[productIndex].images.splice(imageIndex, 1);
    this.setData({ products });
  },
  // 单独发布一个商品
  async publishSingle(e) {
    const index = e.currentTarget.dataset.index;
    await this.publishProduct(index);
  },
  // 批量发布所有商品
  async batchPublish() {
    if (this.data.products.length === 0) {
      wx.showToast({ title: '没有可发布的商品', icon: 'none' });
      return;
    }
    
    wx.showModal({
      title: '确认发布',
      content: `确定要发布${this.data.products.length}个商品吗？`,
      success: async (res) => {
        if (res.confirm) {
          this.setData({ publishing: true });
          wx.showLoading({ title: '批量发布中...' });
          
          let successCount = 0;
          let failCount = 0;
          
          for (let i = 0; i < this.data.products.length; i++) {
            try {
              await this.publishProduct(i);
              successCount++;
            } catch (e) {
              failCount++;
              console.error(`发布第${i+1}个商品失败`, e);
            }
          }
          
          this.setData({ publishing: false });
          wx.hideLoading();
          
          if (failCount === 0) {
            wx.showToast({ title: `成功发布${successCount}个商品`, icon: 'success' });
            this.setData({ products: [] });
            setTimeout(() => {
              wx.navigateBack();
            }, 1500);
          } else {
            wx.showModal({
              title: '发布完成',
              content: `成功：${successCount}个，失败：${failCount}个`,
              showCancel: false
            });
          }
        }
      }
    });
  },
  // 发布单个商品
  async publishProduct(index) {
    const product = this.data.products[index];
    
    // 验证
    if (!product.images || product.images.length === 0) {
      wx.showToast({ title: `商品${index+1}缺少图片`, icon: 'none' });
      throw new Error('缺少图片');
    }
    if (!product.price) {
      wx.showToast({ title: `商品${index+1}缺少价格`, icon: 'none' });
      throw new Error('缺少价格');
    }
    if (!product.categoryId) {
      wx.showToast({ title: `商品${index+1}缺少分类`, icon: 'none' });
      throw new Error('缺少分类');
    }
    
    const res = await request({ 
      url: '/api/products', 
      method: 'POST', 
      data: { 
        name: product.description.split('\n')[0] || '', 
        description: product.description || '', 
        price: Number(product.price), 
        coverUrl: product.images[0],
        imageUrls: product.images,
        categoryId: product.categoryId
      } 
    });
    
    if (res.code !== 0) {
      throw new Error(res.message || '发布失败');
    }
    
    return res;
  }
});

async function compressToTarget(srcPath, currentSize, maxBytes, minBytes) {
  if (currentSize <= maxBytes) return srcPath;
  
  const fs = wx.getFileSystemManager();
  const qualities = [80, 70, 60, 50, 40, 35, 30];
  let bestPath = srcPath;
  let bestSize = currentSize;
  
  for (const q of qualities) {
    try {
      const outPath = await compressOnce(srcPath, q);
      const s = fs.statSync(outPath).size;
      if (s <= maxBytes) {
        if (s >= minBytes) return outPath;
        if (s < bestSize) { bestPath = outPath; bestSize = s; }
        return outPath;
      }
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

