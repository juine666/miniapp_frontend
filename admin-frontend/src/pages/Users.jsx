import React, { useEffect, useState } from 'react'
import { Button, Space, Table, Tag, message } from 'antd'
import { useAuth } from '../auth/AuthContext'

export default function Users() {
  const { api } = useAuth()
  const [list, setList] = useState([])

  const load = async () => {
    const res = await api.get('/api/admin/users')
    if (res.data.code === 0) setList(res.data.data)
  }
  useEffect(() => { load() }, [])

  const ban = async (r, to) => {
    await api.put(`/api/admin/users/${r.id}/${to ? 'ban' : 'unban'}`)
    message.success('已更新'); load()
  }

  return (
    <Table rowKey="id" dataSource={list} columns=[
      { title: 'ID', dataIndex: 'id' },
      { title: 'OpenID', dataIndex: 'openid' },
      { title: '昵称', dataIndex: 'nickname' },
      { title: '状态', dataIndex: 'banned', render: b => b ? <Tag color="red">已封禁</Tag> : <Tag color="green">正常</Tag> },
      { title: '操作', render: (_, r) => <Space>
        {r.banned ? <Button onClick={() => ban(r, false)}>解封</Button> : <Button danger onClick={() => ban(r, true)}>封禁</Button>}
      </Space> }
    ] />
  )
}
















