import React from 'react'
import { Button, Card, Form, Input } from 'antd'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login, loading } = useAuth()
  
  const onFinish = async (values) => {
    await login(values.username, values.password)
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
















