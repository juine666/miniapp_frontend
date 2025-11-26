import React, { useEffect, useState } from 'react'
import { Button, Select, Space, Table, Tag, Input, Card, Modal, Image, message, Descriptions, Form, InputNumber, Upload, Input as AntInput } from 'antd'
import { SearchOutlined, EyeOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'
import { PERMISSIONS } from '../config/permissions'

const { Search } = Input
const { Option } = Select

const statusColors = { 
  PUBLISHED: 'green', 
  PENDING: 'gold', 
  REJECTED: 'red', 
  OFFLINE: 'default' 
}

const statusLabels = {
  PUBLISHED: '已发布',
  PENDING: '待审核',
  REJECTED: '已驳回',
  OFFLINE: '已下线'
}

export default function Products() {
  const { api, hasPermission } = useAuth()
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [uploadVisible, setUploadVisible] = useState(false)
  const [editImageFileList, setEditImageFileList] = useState([])
  const [editForm] = Form.useForm()
  const [uploadForm] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    keyword: '',
    status: '',  // 改为空字符串，表示显示所有状态
    categoryId: undefined
  })

  // 加载分类列表
  const loadCategories = async () => {
    try {
      const res = await api.get('/api/admin/categories', { params: { page: 0, size: 100 } })
      if (res.data.code === 0) {
        setCategories(res.data.data.content || [])
      }
    } catch (error) {
      console.error('加载分类列表失败', error)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const load = async (page = 0, size = 20) => {
    setLoading(true)
    try {
      const params = {
        page,
        size,
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.status !== '' && filters.status && { status: filters.status }),
        ...(filters.categoryId && { categoryId: filters.categoryId })
      }
      const res = await api.get('/api/admin/products', { params })
      if (res.data.code === 0) {
        const pageData = res.data.data
        setData({
          content: pageData.content || [],
          totalElements: pageData.totalElements || 0,
          totalPages: pageData.totalPages || 0
        })
        setPagination({
          current: page + 1,
          pageSize: size,
          total: pageData.totalElements || 0
        })
      }
    } catch (error) {
      console.error('加载商品列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(0, pagination.pageSize)
  }, [filters.keyword, filters.status, filters.categoryId])

  const handleTableChange = (newPagination) => {
    load(newPagination.current - 1, newPagination.pageSize)
  }

  const handleSearch = (value) => {
    setFilters({ ...filters, keyword: value })
  }

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value })
  }

  const setStatus = async (record, status) => {
    try {
      await api.put(`/api/admin/products/${record.id}/status/${status}`)
      message.success('状态已更新')
      load(pagination.current - 1, pagination.pageSize)
    } catch (error) {
      console.error('更新状态失败', error)
    }
  }

  const showDetail = (record) => {
    setSelectedProduct(record)
    setEditMode(false)
    setDetailVisible(true)
    setEditImageFileList([])  // 清空编辑图片列表
    // 初始化编辑表单
    editForm.setFieldsValue({
      name: record.name,
      price: record.price,
      description: record.description
    })
  }

  const handleEditStart = () => {
    if (!hasPermission(PERMISSIONS.PRODUCT_EDIT)) {
      message.error('您没有权限编辑商品')
      return
    }
    setEditMode(true)
  }

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields()
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('price', values.price)
      formData.append('description', values.description || '')
      
      // 如果有新图片，添加到 FormData 让后端处理
      if (editImageFileList.length > 0) {
        const file = editImageFileList[0]
        if (file.originFileObj) {
          formData.append('image', file.originFileObj)
        }
      }
      
      await api.put(`/api/admin/products/${selectedProduct.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      message.success('商品已更新')
      setEditMode(false)
      setEditImageFileList([])
      load(pagination.current - 1, pagination.pageSize)
      setDetailVisible(false)
    } catch (error) {
      console.error('更新商品失败', error)
      message.error('更新商品失败')
    }
  }

  const handleUploadProductSave = async () => {
    if (!hasPermission(PERMISSIONS.PRODUCT_CREATE)) {
      message.error('您没有权限上传商品')
      return
    }
    try {
      const values = await uploadForm.validateFields()
      const formData = new FormData()
      formData.append('name', values.name)
      formData.append('price', values.price)
      formData.append('description', values.description || '')
      formData.append('categoryId', values.categoryId || 1)
      
      // 添加图片文件，由后端处理上传
      if (values.coverUrl && values.coverUrl.fileList && values.coverUrl.fileList.length > 0) {
        const file = values.coverUrl.fileList[0]
        if (file.originFileObj) {
          formData.append('image', file.originFileObj)
        }
      } else {
        message.error('请选择商品图片')
        return
      }
      
      await api.post('/api/admin/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      message.success('商品上传成功')
      setUploadVisible(false)
      uploadForm.resetFields()
      load(0, pagination.pageSize)
    } catch (error) {
      console.error('上传商品失败', error)
      message.error('上传商品失败')
    }
  }

  // 从 coverUrl JSON 字符串中提取第一张图片 URL
  const getCoverImage = (coverUrl) => {
    if (!coverUrl) return null
    try {
      // 如果是 JSON 字符串，解析它
      if (typeof coverUrl === 'string') {
        const urls = JSON.parse(coverUrl)
        return Array.isArray(urls) && urls.length > 0 ? urls[0] : null
      }
      // 如果已经是数组
      if (Array.isArray(coverUrl)) {
        return coverUrl.length > 0 ? coverUrl[0] : null
      }
      return coverUrl
    } catch (e) {
      // 如果不是 JSON，直接返回
      return coverUrl
    }
  }

  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      width: 80,
      sorter: true
    },
    { 
      title: '标题', 
      dataIndex: 'name',
      ellipsis: true,
      width: 200
    },
    { 
      title: '封面', 
      dataIndex: 'coverUrl',
      width: 120,
      render: (coverUrl) => {
        const imageUrl = getCoverImage(coverUrl)
        return imageUrl ? (
          <Image 
            src={imageUrl} 
            alt="cover" 
            width={60} 
            height={60} 
            style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
            preview={{ mask: '查看全部图片' }}
          />
        ) : '-'
      }
    },
    { 
      title: '价格', 
      dataIndex: 'price',
      width: 100,
      render: (price) => price ? `¥${price.toFixed(2)}` : '-'
    },
    { 
      title: '分类', 
      dataIndex: 'categoryName',
      width: 120
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 100,
      render: (status) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt',
      width: 180,
      render: (date) => date ? new Date(date).toLocaleString('zh-CN') : '-'
    },
    { 
      title: '操作', 
      width: 300,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => showDetail(r)}>详情</Button>
          <Button size="small" type="primary" onClick={() => setStatus(r, 'PUBLISHED')}>发布</Button>
          <Button size="small" onClick={() => setStatus(r, 'PENDING')}>待审</Button>
          <Button size="small" danger onClick={() => setStatus(r, 'REJECTED')}>驳回</Button>
          <Button size="small" onClick={() => setStatus(r, 'OFFLINE')}>下线</Button>
        </Space>
      )
    }
  ]

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Search
            placeholder="搜索商品（名称、描述）"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
          >
            <Option value="PUBLISHED">已发布</Option>
            <Option value="PENDING">待审核</Option>
            <Option value="REJECTED">已驳回</Option>
            <Option value="OFFLINE">已下线</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadVisible(true)}>上传商品</Button>
          <Button onClick={() => load(pagination.current - 1, pagination.pageSize)}>刷新</Button>
        </Space>
        
        <Table
          rowKey="id"
          dataSource={data.content}
          columns={columns}
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            pageSizeOptions: ['10', '20', '50', '100']
          }}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Space>

      <Modal
        title={editMode ? '编辑商品' : '商品详情'}
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false)
          setEditMode(false)
        }}
        footer={editMode ? [
          <Button key="back" onClick={() => setEditMode(false)}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleEditSave}>保存</Button>
        ] : [
          <Button key="edit" type="primary" onClick={handleEditStart}>编辑</Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>
        ]}
        width={800}
      >
        {selectedProduct && editMode ? (
          <Form form={editForm} layout="vertical">
            <Form.Item label="标题" name="name" rules={[{ required: true, message: '请输入标题' }]}>
              <Input />
            </Form.Item>
            <Form.Item label="价格" name="price" rules={[{ required: true, message: '请输入价格' }]}>
              <InputNumber min={0} step={0.01} />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="图片">
              <div>
                <div style={{ color: '#999', fontSize: '12px', marginBottom: '8px' }}>
                  当前图片: 
                  {(() => {
                    const imageUrl = getCoverImage(selectedProduct.coverUrl)
                    return imageUrl ? (
                      <Image src={imageUrl} width={100} style={{ marginLeft: '8px' }} />
                    ) : '无'
                  })()}
                </div>
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  beforeUpload={() => false}
                  fileList={editImageFileList}
                  onChange={(info) => {
                    console.log('Upload onChange:', info.fileList)
                    setEditImageFileList(info.fileList)
                  }}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>点击更换图片</div>
                  </div>
                </Upload>
              </div>
            </Form.Item>
          </Form>
        ) : selectedProduct ? (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="ID">{selectedProduct.id}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusColors[selectedProduct.status] || 'default'}>
                {statusLabels[selectedProduct.status] || selectedProduct.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="标题" span={2}>{selectedProduct.name}</Descriptions.Item>
            <Descriptions.Item label="价格">¥{selectedProduct.price?.toFixed(2) || '-'}</Descriptions.Item>
            <Descriptions.Item label="分类">{selectedProduct.categoryName || '-'}</Descriptions.Item>
            <Descriptions.Item label="所有图片" span={2}>
              {(() => {
                try {
                  let images = []
                  if (typeof selectedProduct.coverUrl === 'string') {
                    images = JSON.parse(selectedProduct.coverUrl)
                  } else if (Array.isArray(selectedProduct.coverUrl)) {
                    images = selectedProduct.coverUrl
                  }
                  
                  if (Array.isArray(images) && images.length > 0) {
                    return (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {images.map((url, idx) => (
                          <Image
                            key={idx}
                            src={url}
                            alt={`product-${idx}`}
                            width={100}
                            height={100}
                            style={{ objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                            preview={true}
                          />
                        ))}
                      </div>
                    )
                  }
                } catch (e) {
                  console.error('解析图片失败', e)
                }
                return '-'
              })()}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {selectedProduct.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {selectedProduct.createdAt ? new Date(selectedProduct.createdAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {selectedProduct.updatedAt ? new Date(selectedProduct.updatedAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>

      <Modal
        title="上传新商品"
        open={uploadVisible}
        onCancel={() => {
          setUploadVisible(false)
          uploadForm.resetFields()
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setUploadVisible(false)
            uploadForm.resetFields()
          }}>取消</Button>,
          <Button key="submit" type="primary" onClick={handleUploadProductSave}>上传</Button>
        ]}
        width={800}
      >
        <Form form={uploadForm} layout="vertical">
          <Form.Item label="商品标题" name="name" rules={[{ required: true, message: '请输入商品标题' }]}>
            <Input placeholder="请输入商品标题" />
          </Form.Item>
          <Form.Item label="商品价格" name="price" rules={[{ required: true, message: '请输入商品价格' }]}>
            <InputNumber min={0} step={0.01} placeholder="请输入价格" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="商品描述" name="description">
            <Input.TextArea rows={4} placeholder="请输入商品描述" />
          </Form.Item>
          <Form.Item label="分类" name="categoryId" rules={[{ required: true, message: '请选择商品分类' }]}>
            <Select placeholder="请选择商品分类">
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="商品图片" name="coverUrl" rules={[{ required: true, message: '请上传至少一张商品图片' }]}>
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>点击上传图片</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
















