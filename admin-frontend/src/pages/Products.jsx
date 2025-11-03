import React, { useEffect, useState } from 'react'
import { Button, Select, Space, Table, Tag, message } from 'antd'
import { useAuth } from '../auth/AuthContext'

const statusColors = { PUBLISHED: 'green', PENDING: 'gold', REJECTED: 'red', OFFLINE: 'default' }

export default function Products() {
  const { api } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await api.get('/api/admin/products')
    setLoading(false)
    if (res.data.code === 0) setList(res.data.data)
  }
  useEffect(() => { load() }, [])

  const setStatus = async (record, status) => {
    await api.put(`/api/admin/products/${record.id}/status/${status}`)
    message.success('已更新'); load()
  }

  return (
    <Table rowKey="id" dataSource={list} loading={loading} columns=[
      { title: 'ID', dataIndex: 'id' },
      { title: '标题', dataIndex: 'name' },
      { title: '价格', dataIndex: 'price' },
      { title: '状态', dataIndex: 'status', render: s => <Tag color={statusColors[s] || 'default'}>{s}</Tag> },
      { title: '操作', render: (_, r) => <Space>
        <Button onClick={() => setStatus(r, 'PUBLISHED')}>发布</Button>
        <Button onClick={() => setStatus(r, 'PENDING')}>待审</Button>
        <Button danger onClick={() => setStatus(r, 'REJECTED')}>驳回</Button>
        <Button onClick={() => setStatus(r, 'OFFLINE')}>下线</Button>
      </Space> }
    ] />
  )
}
















