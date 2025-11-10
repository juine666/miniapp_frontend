import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button } from 'antd'
import { 
  Link, 
  Route, 
  Routes, 
  useLocation, 
  useNavigate,
  Navigate
} from 'react-router-dom'
import {
  AppstoreOutlined,
  ShoppingOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons'
import Login from './pages/Login'
import Categories from './pages/Categories'
import Products from './pages/Products'
import Users from './pages/Users'
import Settings from './pages/Settings'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { PermissionCheck } from './components/PermissionCheck'
import { MENU_PERMISSIONS, PERMISSIONS } from './config/permissions'
import { useTheme } from './components/ThemeProvider'

const { Header, Sider, Content } = Layout
const { Text } = Typography

// 权限路由保护组件
function ProtectedRoute({ children }) {
  const { isAuthenticated, hasAdminRole } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (!hasAdminRole()) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Text type="danger" style={{ fontSize: 16 }}>您没有权限访问此页面</Text>
      </div>
    )
  }
  
  return children
}

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token, user, logout, isAuthenticated, hasAdminRole, hasPermission } = useAuth()
  const { theme } = useTheme()
  
  // 如果未登录，显示登录页面
  if (!isAuthenticated || !token) {
    return <Login />
  }
  
  // 如果没有管理员权限，显示无权限提示
  if (!hasAdminRole()) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <Text type="danger" style={{ fontSize: 16, marginBottom: 16 }}>
          您没有管理员权限
        </Text>
        <Button onClick={logout}>退出登录</Button>
      </div>
    )
  }
  
  // 根据路径确定选中的菜单项
  const getSelectedKey = () => {
    if (location.pathname.startsWith('/categories')) return '1'
    if (location.pathname.startsWith('/products')) return '2'
    if (location.pathname.startsWith('/users')) return '3'
    if (location.pathname.startsWith('/settings')) return '4'
    return '1'
  }
  
  const selectedKey = getSelectedKey()
  
  // 根据权限动态生成菜单
  const menuItems = [
    {
      key: '1',
      icon: <AppstoreOutlined />,
      label: <Link to="/categories">分类管理</Link>,
      permission: MENU_PERMISSIONS['/categories']
    },
    {
      key: '2',
      icon: <ShoppingOutlined />,
      label: <Link to="/products">商品审核</Link>,
      permission: MENU_PERMISSIONS['/products']
    },
    {
      key: '3',
      icon: <UserOutlined />,
      label: <Link to="/users">用户管理</Link>,
      permission: MENU_PERMISSIONS['/users']
    },
    {
      key: '4',
      icon: <SettingOutlined />,
      label: <Link to="/settings">系统设置</Link>,
      permission: PERMISSIONS.SYSTEM_THEME
    }
  ].filter(item => !item.permission || hasPermission(item.permission))
  
  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        navigate('/login')
      }
    }
  ]
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        width={200} 
        theme="dark"
        style={{ 
          background: theme.siderBg 
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: theme.siderTextColor,
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          StyleMirror Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ background: theme.siderBg }}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: theme.headerBg, 
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Text strong style={{ fontSize: 18, color: theme.headerTextColor }}>管理后台</Text>
          <Space>
            <Text type="secondary" style={{ color: theme.headerTextColor }}>
              欢迎，{user?.username || '管理员'} ({user?.role || 'ADMIN'})
            </Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar 
                style={{ cursor: 'pointer' }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ 
          margin: 24, 
          padding: 24, 
          background: theme.contentBg,
          minHeight: 280
        }}>
          <Routes>
            <Route 
              path="/categories" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.CATEGORY_VIEW}>
                    <Categories />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/products" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.PRODUCT_VIEW}>
                    <Products />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.USER_VIEW}>
                    <Users />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.SYSTEM_THEME}>
                    <Settings />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/categories" replace />} />
            <Route path="*" element={<Navigate to="/categories" replace />} />
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
















