import React, { useEffect, useState } from 'react'
import { Button, Select, Space, Table, Tag, Input, Card, Modal, Image, message, Descriptions } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'

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
  const { api } = useAuth()
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    keyword: '',
    status: undefined,
    categoryId: undefined
  })

  const load = async (page = 0, size = 20) => {
    setLoading(true)
    try {
      const params = {
        page,
        size,
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.status && { status: filters.status }),
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
  }, [filters])

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
    setDetailVisible(true)
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
      dataIndex: 'coverImage',
      width: 100,
      render: (image) => image ? (
        <Image 
          src={image} 
          alt="cover" 
          width={60} 
          height={60} 
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={false}
        />
      ) : '-'
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
        title="商品详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProduct && (
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
            <Descriptions.Item label="封面" span={2}>
              {selectedProduct.coverImage ? (
                <Image src={selectedProduct.coverImage} width={200} />
              ) : '-'}
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
        )}
      </Modal>
    </Card>
  )
}
















