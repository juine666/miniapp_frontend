import React, { useEffect, useState } from 'react'
import { Button, Space, Table, Tag, Input, Select, message, Card } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'

const { Search } = Input
const { Option } = Select

export default function Users() {
  const { api } = useAuth()
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [filters, setFilters] = useState({
    keyword: '',
    banned: undefined
  })

  const load = async (page = 0, size = 20) => {
    setLoading(true)
    try {
      const params = {
        page,
        size,
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.banned !== undefined && { banned: filters.banned })
      }
      const res = await api.get('/api/admin/users', { params })
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
      console.error('加载用户列表失败', error)
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

  const ban = async (r, to) => {
    try {
      const endpoint = to ? `/api/admin/users/${r.id}/ban` : `/api/admin/users/${r.id}/unban`
      await api.put(endpoint)
      message.success(to ? '用户已封禁' : '用户已解封')
      load(pagination.current - 1, pagination.pageSize)
    } catch (error) {
      console.error('操作失败', error)
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
      title: 'OpenID', 
      dataIndex: 'openid', 
      ellipsis: true,
      width: 200
    },
    { 
      title: '昵称', 
      dataIndex: 'nickname',
      ellipsis: true
    },
    { 
      title: '头像', 
      dataIndex: 'avatar',
      width: 80,
      render: (avatar) => avatar ? (
        <img src={avatar} alt="avatar" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
      ) : '-'
    },
    { 
      title: '状态', 
      dataIndex: 'banned', 
      width: 100,
      render: (banned) => banned ? (
        <Tag color="red">已封禁</Tag>
      ) : (
        <Tag color="green">正常</Tag>
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
      width: 120,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          {r.banned ? (
            <Button size="small" onClick={() => ban(r, false)}>解封</Button>
          ) : (
            <Button size="small" danger onClick={() => ban(r, true)}>封禁</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Space>
          <Search
            placeholder="搜索用户（昵称、OpenID）"
            allowClear
            style={{ width: 300 }}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
          />
          <Select
            placeholder="筛选状态"
            allowClear
            style={{ width: 150 }}
            value={filters.banned}
            onChange={(value) => handleFilterChange('banned', value)}
          >
            <Option value={false}>正常</Option>
            <Option value={true}>已封禁</Option>
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
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  )
}
















