import React, { useEffect, useState } from 'react'
import { Button, Modal, Form, Input, Space, Table, message } from 'antd'
import { useAuth } from '../auth/AuthContext'

export default function Categories() {
  const { api } = useAuth()
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = async () => {
    const res = await api.get('/api/admin/categories')
    if (res.data.code === 0) setList(res.data.data)
  }
  useEffect(() => { load() }, [])

  const onSubmit = async (values) => {
    if (editing) {
      await api.put(`/api/admin/categories/${editing.id}`, values)
    } else {
      await api.post('/api/admin/categories', values)
    }
    message.success('已保存')
    setOpen(false); setEditing(null); load()
  }
  const onDelete = async (record) => {
    await api.delete(`/api/admin/categories/${record.id}`)
    message.success('已删除'); load()
  }

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => { setEditing(null); setOpen(true) }}>新增分类</Button>
      </Space>
      <Table rowKey="id" dataSource={list} columns=[
        { title: 'ID', dataIndex: 'id' },
        { title: '名称', dataIndex: 'name' },
        { title: '描述', dataIndex: 'description' },
        { title: '操作', render: (_, r) => <Space>
          <Button onClick={() => { setEditing(r); setOpen(true) }}>编辑</Button>
          <Button danger onClick={() => onDelete(r)}>删除</Button>
        </Space> }
      ] />
      <Modal title={editing ? '编辑分类' : '新增分类'} open={open} onCancel={() => setOpen(false)} footer={null}>
        <Form onFinish={onSubmit} initialValues={editing || {}} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="描述"><Input.TextArea /></Form.Item>
          <Button type="primary" htmlType="submit">保存</Button>
        </Form>
      </Modal>
    </div>
  )
}
















