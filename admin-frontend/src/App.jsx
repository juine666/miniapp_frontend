import React from 'react'
import { Layout, Menu } from 'antd'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Users from './pages/Users'
import { AuthProvider, useAuth } from './auth/AuthContext'

const { Header, Sider, Content } = Layout

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, logout } = useAuth()
  const selected = location.pathname.startsWith('/categories') ? '1' : location.pathname.startsWith('/products') ? '2' : '3'
  if (!token) return <Login />
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <Menu theme="dark" mode="inline" selectedKeys={[selected]}>
          <Menu.Item key="1"><Link to="/categories">分类管理</Link></Menu.Item>
          <Menu.Item key="2"><Link to="/products">商品审核</Link></Menu.Item>
          <Menu.Item key="3"><Link to="/users">用户管理</Link></Menu.Item>
          <Menu.Item key="9" onClick={() => { logout(); navigate('/'); }}>退出</Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff' }}>StyleMirror Admin</Header>
        <Content style={{ margin: 16 }}>
          <Routes>
            <Route path="/categories" element={<Categories />} />
            <Route path="/products" element={<Products />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Categories />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
















