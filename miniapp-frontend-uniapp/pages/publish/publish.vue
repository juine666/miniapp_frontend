<template>
  <view class="xy-container">
    <!-- 批量发布入口 -->
    <view v-if="!productId" class="batch-entry">
      <text class="batch-text">需要批量发布？</text>
      <text class="batch-link" @tap="goBatchPublish">点击这里</text>
    </view>
    
    <view class="xy-card">
      <!-- 图片上传区域 -->
      <view class="images-section">
        <view class="images-grid">
          <!-- 已上传的图片 -->
          <view v-for="(item, index) in form.imageUrls" :key="index" class="image-item">
            <image :src="item" mode="aspectFill" class="uploaded-image" @tap="replaceImage" :data-index="index" @error="onImageError"/>
            <view class="delete-btn" @tap.stop="deleteImage" :data-index="index">×</view>
          </view>
          <!-- 添加图片按钮 -->
          <view v-if="form.imageUrls.length < 3" class="image-item add-image" @tap="chooseImage">
            <view v-if="uploading" class="upload-mask">
              <text>上传中...</text>
            </view>
            <view v-else class="add-placeholder">+</view>
          </view>
        </view>
        <view class="image-tip">最多可上传3张图片</view>
      </view>
      
      <!-- 分类选择 -->
      <view class="xy-input-group category-group">
        <text class="xy-label">分类</text>
        <picker v-if="categoryList.length > 0" class="category-picker" mode="selector" :range="categoryList" range-key="name" :value="categoryIndex >= 0 ? categoryIndex : 0" @change="onCategoryChange">
          <view :class="['picker-value', form.categoryId ? '' : 'placeholder']">
            {{ categoryName || (form.categoryId ? '请选择分类' : '请选择分类（必填）') }}
          </view>
        </picker>
        <view v-else class="picker-value placeholder">加载分类中...</view>
      </view>
      
      <view class="desc-section">
        <textarea class="xy-input desc" placeholder="详细说明（选填）" @input="onInput" data-key="description" maxlength="140" :auto-height="true" cursor-spacing="20" :value="form.description"></textarea>
      </view>
      <view class="xy-input-group">
        <text class="xy-label">价格</text>
        <input class="xy-input price" placeholder="￥(必填)" type="digit" @input="onInput" data-key="price" :value="form.price" maxlength="8"/>
        <text class="xy-label">元</text>
      </view>
      <button class="xy-btn-primary" @tap="submit">{{ productId ? '保存修改' : '发布闲置' }}</button>
    </view>
  </view>
</template>

<script>
import { request } from '@/utils/request'

export default {
  data() {
    return {
      productId: null,
      form: {
        name: '',
        description: '',
        price: '',
        imageUrls: [],
        categoryId: null
      },
      categoryList: [],
      categoryIndex: 0,
      categoryName: '',
      uploading: false,
      saving: false
    }
  },
  async onLoad(options) {
    this.saving = false
    
    await this.loadCategories()
    
    const app = getApp()
    const productId = options.id || app.globalData.editingProductId
    
    if (productId) {
      console.log('加载编辑模式，商品ID:', productId)
      this.productId = productId
      uni.setNavigationBarTitle({ title: '编辑商品' })
      await this.loadProduct(productId)
      app.globalData.editingProductId = null
    } else {
      console.log('加载发布模式')
      uni.setNavigationBarTitle({ title: '发布商品' })
      this.productId = null
      this.form.imageUrls = []
      this.form.description = ''
      this.form.price = ''
      this.form.categoryId = null
    }
  },
  onShow() {
    const app = getApp()
    if (app.globalData.editingProductId && !this.productId && !this.saving) {
      const productId = app.globalData.editingProductId
      this.productId = productId
      uni.setNavigationBarTitle({ title: '编辑商品' })
      this.loadProduct(productId)
      app.globalData.editingProductId = null
    } else if (!this.productId && !this.saving) {
      uni.setNavigationBarTitle({ title: '发布商品' })
    }
  },
  methods: {
    async loadCategories() {
      try {
        const res = await request({ url: '/api/categories' })
        if (res.code === 0 && res.data) {
          const categories = res.data || []
          this.categoryList = categories
          
          if (!this.productId && categories.length > 0) {
            const firstCategory = categories[0]
            this.form.categoryId = firstCategory.id
            this.categoryIndex = 0
            this.categoryName = firstCategory.name
            console.log('默认选择第一个分类:', firstCategory.name, 'ID:', firstCategory.id)
          } else if (categories.length === 0) {
            this.categoryIndex = 0
          }
        }
      } catch (e) {
        console.error('加载分类失败', e)
        this.categoryIndex = 0
      }
    },
    async loadProduct(id) {
      console.log('开始加载商品，ID:', id)
      try {
        const res = await request({ url: `/api/my/products` })
        if (res.code === 0) {
          const pageData = res.data.content || res.data || []
          const product = pageData.find(p => p.id == id)
          console.log('找到商品:', product)
          
          if (product) {
            const categoryIndex = this.categoryList.findIndex(c => c.id == product.categoryId)
            const category = this.categoryList.find(c => c.id == product.categoryId)
            
            let imageUrls = []
            if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
              imageUrls = product.imageUrls
            } else if (product.coverUrl) {
              try {
                if (typeof product.coverUrl === 'string' && product.coverUrl.startsWith('[')) {
                  imageUrls = JSON.parse(product.coverUrl)
                } else {
                  imageUrls = [product.coverUrl]
                }
              } catch (e) {
                imageUrls = [product.coverUrl]
              }
            }
            
            this.form.name = product.name || ''
            this.form.description = product.description || ''
            this.form.price = product.price ? String(product.price) : ''
            this.form.imageUrls = imageUrls
            this.form.categoryId = product.categoryId || null
            this.categoryIndex = categoryIndex >= 0 ? categoryIndex : 0
            this.categoryName = category ? category.name : ''
            
            console.log('商品数据加载完成，图片数量:', imageUrls.length)
          } else {
            console.error('未找到商品，ID:', id)
            uni.showToast({ title: '商品不存在', icon: 'none' })
          }
        } else {
          console.error('加载商品失败:', res)
          uni.showToast({ title: res.message || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载商品异常:', e)
        uni.showToast({ title: '加载失败，请重试', icon: 'none' })
      }
    },
    onCategoryChange(e) {
      const index = Number(e.detail.value)
      const category = this.categoryList[index]
      if (category) {
        this.form.categoryId = category.id
        this.categoryIndex = index
        this.categoryName = category.name
        console.log('选择分类:', category.name, 'ID:', category.id)
      }
    },
    onInput(e) {
      const key = e.currentTarget.dataset.key
      this.form[key] = e.detail.value
    },
    async chooseImage() {
      try {
        const currentImages = this.form.imageUrls || []
        const remainingCount = 3 - currentImages.length
        
        if (remainingCount <= 0) {
          uni.showToast({ title: '最多只能上传3张图片', icon: 'none' })
          return
        }
        
        this.uploading = true
        uni.showLoading({ title: '选择图片中...' })
        const choose = await uni.chooseMedia({
          count: remainingCount,
          mediaType: ['image']
        })
        
        if (!choose.tempFiles || choose.tempFiles.length === 0) {
          this.uploading = false
          uni.hideLoading()
          return
        }
        
        uni.showLoading({ title: '压缩图片中...' })
        const fs = uni.getFileSystemManager()
        const MAX_BYTES = 3 * 1024 * 1024
        const MIN_BYTES = 1 * 1024 * 1024
        
        const compressedFiles = []
        for (const file of choose.tempFiles) {
          const stat = fs.statSync(file.tempFilePath)
          const compressedPath = await this.compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES)
          compressedFiles.push(compressedPath)
        }
        
        uni.showLoading({ title: '获取上传凭证...' })
        const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0, 10)) + '/'
        const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } })
        if (policy.code !== 0) {
          uni.hideLoading()
          this.uploading = false
          uni.showToast({ title: '获取上传凭证失败', icon: 'none' })
          return
        }
        
        const { accessid, host, policy: p, signature, dir } = policy.data
        
        uni.showLoading({ title: '上传中...' })
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
                if (!url.endsWith('/')) {
                  url += '/'
                }
                url += key
                uploadedUrls.push(url)
                resolve()
              },
              fail: (err) => {
                console.error('OSS上传失败', err)
                reject(err)
              }
            })
          })
        }
        
        const newImageUrls = [...currentImages, ...uploadedUrls]
        this.form.imageUrls = newImageUrls
        this.uploading = false
        
        uni.hideLoading()
        uni.showToast({ title: `成功上传${uploadedUrls.length}张图片`, icon: 'success' })
      } catch (e) {
        this.uploading = false
        uni.hideLoading()
        console.error('图片上传异常', e)
        uni.showToast({ title: '操作失败: ' + (e.message || '未知错误'), icon: 'none', duration: 2000 })
      }
    },
    deleteImage(e) {
      e.stopPropagation()
      const index = e.currentTarget.dataset.index
      const imageUrls = this.form.imageUrls || []
      if (imageUrls.length <= 1) {
        uni.showToast({ title: '至少需要保留一张图片', icon: 'none' })
        return
      }
      imageUrls.splice(index, 1)
      this.form.imageUrls = imageUrls
      console.log('删除图片，剩余:', imageUrls.length)
    },
    async replaceImage(e) {
      const index = e.currentTarget.dataset.index
      console.log('替换图片，索引:', index)
      
      try {
        const currentImages = this.form.imageUrls || []
        
        this.uploading = true
        uni.showLoading({ title: '选择图片中...' })
        const choose = await uni.chooseMedia({
          count: 1,
          mediaType: ['image']
        })
        
        if (!choose.tempFiles || choose.tempFiles.length === 0) {
          this.uploading = false
          uni.hideLoading()
          return
        }
        
        uni.showLoading({ title: '压缩图片中...' })
        const fs = uni.getFileSystemManager()
        const MAX_BYTES = 3 * 1024 * 1024
        const MIN_BYTES = 1 * 1024 * 1024
        
        const file = choose.tempFiles[0]
        const stat = fs.statSync(file.tempFilePath)
        const compressedPath = await this.compressToTarget(file.tempFilePath, stat.size, MAX_BYTES, MIN_BYTES)
        
        uni.showLoading({ title: '获取上传凭证...' })
        const dirPrefix = 'uploads/' + (new Date().toISOString().slice(0, 10)) + '/'
        const policy = await request({ url: '/api/oss/policy', method: 'POST', data: { dirPrefix } })
        if (policy.code !== 0) {
          uni.hideLoading()
          this.uploading = false
          uni.showToast({ title: '获取上传凭证失败', icon: 'none' })
          return
        }
        
        const { accessid, host, policy: p, signature, dir } = policy.data
        
        uni.showLoading({ title: '上传中...' })
        const key = dir + Date.now() + '_' + index + '_' + Math.floor(Math.random() * 1000) + '.jpg'
        
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
              if (!url.endsWith('/')) {
                url += '/'
              }
              url += key
              
              const newImageUrls = [...currentImages]
              newImageUrls[index] = url
              
              this.form.imageUrls = newImageUrls
              this.uploading = false
              
              uni.hideLoading()
              uni.showToast({ title: '替换成功', icon: 'success' })
              resolve()
            },
            fail: (err) => {
              console.error('OSS上传失败', err)
              reject(err)
            }
          })
        })
      } catch (e) {
        this.uploading = false
        uni.hideLoading()
        console.error('替换图片异常', e)
        uni.showToast({ title: '替换失败: ' + (e.message || '未知错误'), icon: 'none', duration: 2000 })
      }
    },
    onImageError(e) {
      console.error('图片加载失败', e)
      uni.showToast({ title: '图片加载失败', icon: 'none' })
    },
    goBatchPublish() {
      uni.navigateTo({
        url: '/pages/batch-publish/batch-publish'
      })
    },
    async submit() {
      if (this.saving) {
        console.log('正在保存中，请勿重复提交')
        return
      }
      
      const { productId, form } = this
      const { name, description, price, imageUrls, categoryId } = form
      
      if (!categoryId) {
        uni.showToast({ title: '请选择分类', icon: 'none' })
        return
      }
      
      if (!price) {
        uni.showToast({ title: '请填写价格', icon: 'none' })
        return
      }
      
      const imageList = imageUrls || []
      if (imageList.length === 0) {
        uni.showToast({ title: '请至少上传一张图片', icon: 'none' })
        return
      }
      
      const coverUrl = imageList[0]
      
      this.saving = true
      uni.showLoading({ title: productId ? '保存中...' : '发布中...' })
      
      try {
        if (productId) {
          console.log('编辑商品，ID:', productId)
          const res = await request({
            url: `/api/my/products/${productId}`,
            method: 'PUT',
            data: {
              name: name || '',
              description: description || '',
              price: Number(price),
              coverUrl: coverUrl,
              imageUrls: imageList,
              categoryId: categoryId
            }
          })
          
          uni.hideLoading()
          this.saving = false
          
          if (res.code === 0) {
            uni.showToast({ title: '已更新', icon: 'success' })
            setTimeout(() => {
              uni.navigateBack()
            }, 1000)
          } else {
            uni.showToast({ title: res.message || '更新失败', icon: 'none' })
          }
        } else {
          console.log('发布新商品')
          const res = await request({
            url: '/api/products',
            method: 'POST',
            data: {
              name: name || '',
              description: description || '',
              price: Number(price),
              coverUrl: coverUrl,
              imageUrls: imageList,
              categoryId: categoryId
            }
          })
          
          uni.hideLoading()
          this.saving = false
          
          if (res.code === 0) {
            uni.showToast({ title: '已发布', icon: 'success' })
            this.form.imageUrls = []
            this.form.description = ''
            this.form.price = ''
            this.form.categoryId = null
            setTimeout(() => {
              uni.navigateBack()
            }, 1000)
          } else {
            uni.showToast({ title: res.message || '发布失败', icon: 'none' })
          }
        }
      } catch (e) {
        uni.hideLoading()
        this.saving = false
        console.error('保存失败', e)
        uni.showToast({ title: '操作失败，请重试', icon: 'none' })
      }
    },
    async compressToTarget(srcPath, currentSize, maxBytes, minBytes) {
      if (currentSize <= maxBytes) return srcPath
      
      const fs = uni.getFileSystemManager()
      const qualities = [80, 70, 60, 50, 40, 35, 30]
      let bestPath = srcPath
      let bestSize = currentSize
      
      for (const q of qualities) {
        try {
          const outPath = await this.compressOnce(srcPath, q)
          const s = fs.statSync(outPath).size
          if (s <= maxBytes) {
            if (s >= minBytes) return outPath
            if (s < bestSize) {
              bestPath = outPath
              bestSize = s
            }
            return outPath
          }
          if (s < bestSize) {
            bestPath = outPath
            bestSize = s
          }
        } catch (e) {
          // 压缩失败跳过
        }
      }
      return bestPath
    },
    compressOnce(srcPath, quality) {
      return new Promise((resolve, reject) => {
        uni.compressImage({
          src: srcPath,
          quality,
          success: (res) => resolve(res.tempFilePath),
          fail: reject
        })
      })
    }
  }
}
</script>

<style scoped>
.xy-container {
  background: #f6f6f6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 50rpx;
}

.batch-entry {
  width: 90vw;
  padding: 20rpx;
  background: #fff3cd;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  font-size: 28rpx;
}

.batch-text {
  color: #856404;
}

.batch-link {
  color: #fcc822;
  font-weight: bold;
  text-decoration: underline;
}

.xy-card {
  width: 90vw;
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 12rpx 40rpx rgba(0, 0, 0, 0.02), 0 1rpx 2rpx #ecd5a7;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 38rpx 32rpx 52rpx 32rpx;
  gap: 32rpx;
}

.images-section {
  margin-bottom: 20rpx;
}
.images-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.image-item {
  width: calc((100% - 40rpx) / 3);
  aspect-ratio: 1;
  border-radius: 16rpx;
  background: #f8f8f8;
  border: 2rpx solid #f5eac4;
  overflow: hidden;
  position: relative;
}
.add-image {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.add-placeholder {
  color: #bfa144;
  font-size: 80rpx;
  font-weight: bold;
}
.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.uploaded-image:active {
  opacity: 0.8;
}
.delete-btn {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 48rpx;
  height: 48rpx;
  background: #ff4757;
  color: #fff;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.image-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
  text-align: center;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24rpx;
  z-index: 10;
  border-radius: 16rpx;
}

.desc-section {
  width: 100%;
  margin-bottom: 10rpx;
}
.xy-input.desc {
  width: 100%;
  min-height: 160rpx;
  padding: 20rpx 0;
  font-size: 28rpx;
  line-height: 44rpx;
  border: none;
  border-bottom: 2rpx solid #f0e5c3;
  background: #fff;
  box-sizing: border-box;
  display: block;
  word-wrap: break-word;
  word-break: break-all;
}
.xy-input-group {
  display: flex;
  align-items: center;
  gap: 11rpx;
  background: #faf7ef;
  border-radius: 8rpx;
  padding: 10rpx 24rpx;
  min-height: 60rpx;
}

.category-group {
  justify-content: space-between;
}

.category-picker {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.picker-value {
  font-size: 30rpx;
  color: #333;
  text-align: right;
  padding-right: 20rpx;
}

.picker-value.placeholder {
  color: #999;
}
.xy-label {
  color: #e6bd3b;
  font-size: 30rpx;
}
.xy-input.price {
  border: none;
  background: #faf7ef;
  font-size: 38rpx;
  color: #c1972d;
  width: 180rpx;
  margin: 0 8rpx;
  text-align: left;
}
.xy-btn-primary {
  width: 100%;
  background: linear-gradient(90deg, #fcc822, #f6b733 80%);
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
  border: none;
  border-radius: 99rpx;
  padding: 32rpx 0;
  margin-top: 20rpx;
  margin-bottom: 4rpx;
  box-shadow: 0 6rpx 32rpx rgba(248, 184, 0, 0.2);
}
</style>

