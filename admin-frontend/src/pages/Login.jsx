import React, { useState } from 'react'
import { Button, Card, Form, Input, message } from 'antd'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const onFinish = async (values) => {
    setLoading(true)
    const ok = await login(values.username, values.password)
    setLoading(false)
    if (!ok) message.error('登录失败')
  }
  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="Admin Login" style={{ width: 360 }}>
        <Form onFinish={onFinish} initialValues={{ username: 'admin', password: 'admin123' }}>
          <Form.Item name="username" rules={[{ required: true }]}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>登录</Button>
        </Form>
      </Card>
    </div>
  )
}
















