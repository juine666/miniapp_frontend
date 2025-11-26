import React from 'react'
import { Button, Form, Input, Card, Space, Typography, Spin, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useAuth } from '../auth/AuthContext'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  
  const onFinish = async (values) => {
    const success = await login(values.username, values.password)
    if (success) {
      // 登录成功，直接跳转到首页（不延迟，避免闪现）
      navigate('/dashboard', { replace: true })
    }
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <Spin spinning={loading} size="large">
        <Card 
          style={{
            width: 420,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            borderRadius: '12px',
            border: 'none'
          }}
          bodyStyle={{ padding: '40px' }}
        >
          {/* 头部 */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              color: 'white',
              fontSize: 28,
              fontWeight: 'bold'
            }}>
              SM
            </div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#333' }}>StyleMirror</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>管理后台登录</Text>
          </div>

          {/* 表单 */}
          <Form 
            form={form}
            onFinish={onFinish} 
            initialValues={{ username: 'admin', password: 'admin123' }}
            layout="vertical"
            autoComplete="off"
          >
            <Form.Item 
              name="username" 
              rules={[{ required: true, message: '请输入用户名' }]}
              style={{ marginBottom: '20px' }}
            >
              <Input 
                size="large"
                placeholder="用户名"
                prefix={<UserOutlined style={{ color: '#667eea' }} />}
                style={{
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: 14
                }}
              />
            </Form.Item>
            
            <Form.Item 
              name="password" 
              rules={[{ required: true, message: '请输入密码' }]}
              style={{ marginBottom: '30px' }}
            >
              <Input.Password 
                size="large"
                placeholder="密码"
                prefix={<LockOutlined style={{ color: '#667eea' }} />}
                style={{
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: 14
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                loading={loading}
                size="large"
                style={{
                  height: 44,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: 16,
                  fontWeight: '500',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)'
                  e.target.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)'
                  e.target.style.transform = 'translateY(0)'
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>

          {/* 底部提示 */}
          <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              演示账号：admin / admin123
            </Text>
          </div>
        </Card>
      </Spin>
    </div>
  )
}
















