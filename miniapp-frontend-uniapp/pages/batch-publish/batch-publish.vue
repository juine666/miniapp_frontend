<template>
  <view class="batch-container">
    <view class="action-bar">
      <button class="action-btn primary" @tap="chooseImages">
        <text class="btn-icon">📷</text>
        <text>批量选择图片</text>
        <text class="btn-tip">（每张图片一个商品）</text>
      </button>
      <button class="action-btn" @tap="addProduct">
        <text class="btn-icon">➕</text>
        <text>手动添加</text>
      </button>
    </view>
    
    <view class="paste-section">
      <view class="paste-header">
        <text class="paste-label">或粘贴聊天记录文本</text>
        <text class="paste-tip">自动解析商品信息</text>
      </view>
      <textarea 
        class="paste-input" 
        placeholder="例如：哑铃一样两个 五元一起打包出"
        @input="onPasteText"
      ></textarea>
    </view>
    
    <view class="products-list">
      <view v-for="(item, index) in products" :key="index" class="product-item">
        <view class="product-header">
          <text class="product-index">商品 {{ index + 1 }}</text>
          <view class="header-actions">
            <button class="delete-btn" @tap="deleteProduct" :data-index="index">删除</button>
          </view>
        </view>
        
        <view class="images-section">
          <view class="images-grid">
            <view v-for="(imgUrl, imgIndex) in item.images" :key="imgIndex" class="image-item">
              <image class="uploaded-image" :src="imgUrl" mode="aspectFill"></image>
              <view class="delete-img-btn" @tap.stop="deleteImage" :data-product-index="index" :data-image-index="imgIndex">×</view>
            </view>
            <view v-if="item.images.length < 3" class="add-image" @tap="addImageToProduct" :data-index="index">
              <text class="add-icon">+</text>
              <text class="add-text">添加图片</text>
            </view>
          </view>
        </view>
        
        <view class="form-section">
          <view class="form-row">
            <text class="form-label">描述</text>
            <input class="form-input" placeholder="商品描述" :value="item.description" @input="onDescriptionInput" :data-index="index"/>
          </view>
          <view class="form-row">
            <text class="form-label">价格</text>
            <input class="form-input" type="digit" placeholder="价格" :value="item.price" @input="onPriceInput" :data-index="index"/>
          </view>
          <view class="form-row">
            <text class="form-label">分类</text>
            <picker mode="selector" :range="categoryList" range-key="name" :value="getCategoryIndex(item.categoryId)" @change="onCategoryChange" :data-index="index">
              <view class="picker-value">{{ getCategoryName(item.categoryId) || '请选择分类' }}</view>
            </picker>
          </view>
        </view>
      </view>
    </view>
    
    <view class="publish-actions">
      <button class="publish-btn" :disabled="publishing" @tap="batchPublish">批量发布</button>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

async function compressToTarget(srcPath, currentSize, maxBytes, minBytes) {
  if (currentSize <= maxBytes) return srcPath
  const fs = uni.getFileSystemManager()
  const qualities = [80, 70, 60, 50, 40, 35, 30]
  let bestPath = srcPath
  let bestSize = currentSize
  for (const q of qualities) {
    try {
      const outPath = await compressOnce(srcPath, q)
      const s = fs.statSync(outPath).size
      if (s <= maxBytes) {
        if (s >= minBytes) return outPath
        if (s < bestSize) { bestPath = outPath; bestSize = s }
        return outPath
      }
      if (s < bestSize) { bestPath = outPath; bestSize = s }
    } catch (e) {}
  }
  return bestPath
}

function compressOnce(srcPath, quality) {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src: srcPath,
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail: reject
    })
  })
}

export default {
  data() {
    return {
      products: [],
      categoryList: [],
      uploading: false,
      publishing: false
    }
  },
  async onLoad() {
    await this.loadCategories()
  },
  methods: {
    async loadCategories() {
      try {
        const res = await request({ url: '/api/categories' })
        if (res.code === 0 && res.data) {
          this.categoryList = res.data || []
        }
      } catch (e) {
        console.error('加载分类失败', e)
      }
    },
    async chooseImages() {
      try {
        uni.showLoading({ title: '选择图片中...' })
        const choose = await uni.chooseMedia({
          count: 9,
          mediaType: ['image'],
          sourceType: ['album', 'camera']
        })
        
        if (!choose.tempFiles || choose.tempFiles.length === 0) {
          uni.hideLoading()
          return
        }
        
        uni.hideLoading()
        this.createProductsFromImages(choose.tempFiles)
      } catch (e) {
        uni.hideLoading()
        console.error('选择图片失败', e)
        uni.showToast({ title: '选择图片失败', icon: 'none' })
      }
    },
    async createProductsFromImages(tempFiles) {
      this.uploading = true
      uni.showLoading({ title: '上传图片中...' })
      
      try {
        const fs = uni.getFileSystemManager()
        const MAX_BYTES = 3 * 1024 * 1024
        const MIN_BYTES = 1 * 1024 * 1024
        
        const compressedFiles = []
        for (const file of tempFiles) {
          const stat = fs.statSync(file.tempFilePath)
          const compressedPath = await compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES)
          compressedFiles.push(compressedPath)
        }
        
        const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0, 10)) + '/'
        const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } })
        if (policy.code !== 0) {
          uni.hideLoading()
          this.uploading = false
          uni.showToast({ title: '获取上传凭证失败', icon: 'none' })
          return
        }
        
        const { accessid, host, policy: p, signature, dir } = policy.data
        
        const uploadedUrls = []
        for (let i = 0; i < compressedFiles.length; i++) {
          const filePath = compressedFiles[i]
          const key = dir + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 1000) + '.jpg'
          
          await new Promise((resolve, reject) => {
            uni.uploadFile({
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
                let url = host
                if (!url.endsWith('/')) url += '/'
                url += key
                uploadedUrls.push(url)
                resolve()
              },
              fail: reject
            })
          })
        }
        
        const newProducts = uploadedUrls.map(url => ({
          images: [url],
          description: '',
          price: '',
          categoryId: this.categoryList.length > 0 ? this.categoryList[0].id : null
        }))
        
        this.products = [...this.products, ...newProducts]
        this.uploading = false
        uni.hideLoading()
        uni.showToast({ title: `成功创建${newProducts.length}个商品`, icon: 'success' })
      } catch (e) {
        this.uploading = false
        uni.hideLoading()
        console.error('创建商品失败', e)
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },
    addProduct() {
      this.products.push({
        images: [],
        description: '',
        price: '',
        categoryId: this.categoryList.length > 0 ? this.categoryList[0].id : null
      })
    },
    deleteProduct(e) {
      const index = e.currentTarget.dataset.index
      this.products.splice(index, 1)
    },
    onDescriptionInput(e) {
      const index = e.currentTarget.dataset.index
      this.products[index].description = e.detail.value
    },
    onPriceInput(e) {
      const index = e.currentTarget.dataset.index
      this.products[index].price = e.detail.value
    },
    onCategoryChange(e) {
      const index = e.currentTarget.dataset.index
      const categoryIndex = Number(e.detail.value)
      const category = this.categoryList[categoryIndex]
      if (category) {
        this.products[index].categoryId = category.id
      }
    },
    getCategoryIndex(categoryId) {
      return this.categoryList.findIndex(c => c.id === categoryId)
    },
    getCategoryName(categoryId) {
      const category = this.categoryList.find(c => c.id === categoryId)
      return category ? category.name : ''
    },
    async addImageToProduct(e) {
      const productIndex = e.currentTarget.dataset.index
      try {
        const choose = await uni.chooseMedia({ count: 1, mediaType: ['image'] })
        if (!choose.tempFiles || choose.tempFiles.length === 0) return
        
        const file = choose.tempFiles[0]
        const fs = uni.getFileSystemManager()
        const stat = fs.statSync(file.tempFilePath)
        const MAX_BYTES = 3 * 1024 * 1024
        const MIN_BYTES = 1 * 1024 * 1024
        
        uni.showLoading({ title: '压缩中...' })
        const compressedPath = await compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES)
        
        const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0, 10)) + '/'
        const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } })
        if (policy.code !== 0) {
          uni.hideLoading()
          return
        }
        
        const { accessid, host, policy: p, signature, dir } = policy.data
        const key = dir + Date.now() + '_' + Math.floor(Math.random() * 1000) + '.jpg'
        
        await new Promise((resolve, reject) => {
          uni.uploadFile({
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
              let url = host
              if (!url.endsWith('/')) url += '/'
              url += key
              this.products[productIndex].images.push(url)
              uni.hideLoading()
              resolve()
            },
            fail: reject
          })
        })
      } catch (e) {
        uni.hideLoading()
        console.error('添加图片失败', e)
      }
    },
    deleteImage(e) {
      const productIndex = e.currentTarget.dataset.productIndex
      const imageIndex = e.currentTarget.dataset.imageIndex
      this.products[productIndex].images.splice(imageIndex, 1)
    },
    onPasteText(e) {
      // 简单的文本解析逻辑
      const text = e.detail.value
      // 这里可以添加更复杂的解析逻辑
    },
    async batchPublish() {
      if (this.publishing || this.products.length === 0) return
      
      this.publishing = true
      uni.showLoading({ title: '发布中...' })
      
      try {
        let successCount = 0
        for (const product of this.products) {
          if (!product.images.length || !product.price || !product.categoryId) {
            continue
          }
          
          try {
            await request({
              url: '/api/products',
              method: 'POST',
              data: {
                name: product.description || '',
                description: product.description || '',
                price: Number(product.price),
                coverUrl: product.images[0],
                imageUrls: product.images,
                categoryId: product.categoryId
              }
            })
            successCount++
          } catch (e) {
            console.error('发布失败', e)
          }
        }
        
        uni.hideLoading()
        uni.showToast({ title: `成功发布${successCount}个商品`, icon: 'success' })
        
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
      } catch (e) {
        uni.hideLoading()
        uni.showToast({ title: '发布失败', icon: 'none' })
      } finally {
        this.publishing = false
      }
    }
  }
}
</script>

<style scoped>
.batch-container {
  background: #f6f6f6;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.action-bar {
  padding: 20rpx;
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  padding: 24rpx;
  background: #fff;
  border-radius: 12rpx;
  border: none;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.action-btn.primary {
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
}

.btn-icon {
  font-size: 32rpx;
}

.btn-tip {
  font-size: 22rpx;
  opacity: 0.8;
}

.paste-section {
  margin: 20rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
}

.paste-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.paste-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
}

.paste-tip {
  font-size: 24rpx;
  color: #999;
}

.paste-input {
  width: 100%;
  min-height: 120rpx;
  padding: 16rpx;
  background: #f6f6f6;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.products-list {
  padding: 0 20rpx;
}

.product-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.product-index {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.delete-btn {
  padding: 8rpx 20rpx;
  background: #ffe0e0;
  color: #f44336;
  border-radius: 8rpx;
  font-size: 24rpx;
  border: none;
}

.images-section {
  margin-bottom: 20rpx;
}

.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  width: calc((100% - 32rpx) / 3);
  aspect-ratio: 1;
  border-radius: 12rpx;
  background: #f0f0f0;
  position: relative;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.delete-img-btn {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 40rpx;
  height: 40rpx;
  background: #ff4757;
  color: #fff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.add-image {
  width: calc((100% - 32rpx) / 3);
  aspect-ratio: 1;
  border-radius: 12rpx;
  background: #f6f6f6;
  border: 2rpx dashed #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.add-icon {
  font-size: 48rpx;
  color: #999;
}

.add-text {
  font-size: 24rpx;
  color: #999;
}

.form-section {
  border-top: 1rpx solid #f0f0f0;
  padding-top: 20rpx;
}

.form-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-row:last-child {
  border-bottom: none;
}

.form-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #666;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.picker-value {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  text-align: right;
}

.publish-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
}

.publish-btn {
  width: 100%;
  padding: 28rpx;
  background: linear-gradient(90deg, #fcc822, #f6b733);
  color: #fff;
  border-radius: 999rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}
</style>

