import React, { useMemo } from 'react'
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Button, Spin } from 'antd'
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
  SettingOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  DashboardOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import Login from './pages/Login'
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Categories = React.lazy(() => import('./pages/Categories'))
const Products = React.lazy(() => import('./pages/Products'))
const Users = React.lazy(() => import('./pages/Users'))
const Settings = React.lazy(() => import('./pages/Settings'))
const ExcelImport = React.lazy(() => import('./pages/ExcelImport'))
const StudentEnrollment = React.lazy(() => import('./pages/StudentEnrollment'))
const SystemConfig = React.lazy(() => import('./pages/SystemConfig'))
const PermissionManage = React.lazy(() => import('./pages/PermissionManage'))
import { AuthProvider, useAuth } from './auth/AuthContext'
import { PermissionCheck } from './components/PermissionCheck'
import { MENU_PERMISSIONS, PERMISSIONS } from './config/permissions'
import { useTheme } from './components/ThemeProvider'

const { Header, Sider, Content } = Layout
const { Text } = Typography

// 加载指示器
const PageLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
    <Spin tip="加载中..." />
  </div>
)

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
  
  // 所有 hooks 必须在条件检查之前调用
  const selectedKey = (() => {
    if (location.pathname === '/' || location.pathname.startsWith('/dashboard')) return '0'
    if (location.pathname.startsWith('/categories')) return '1'
    if (location.pathname.startsWith('/products')) return '2'
    if (location.pathname.startsWith('/users')) return '3'
    if (location.pathname.startsWith('/settings')) return '4-1'
    if (location.pathname.startsWith('/oss-config')) return '4-2'
    if (location.pathname.startsWith('/permission-manage')) return '4-3'
    if (location.pathname.startsWith('/excel-import')) return '5'
    if (location.pathname.startsWith('/student-enrollment')) return '6'
    return '0'
  })()
  
  // 使用 useMemo 优化菜单项生成，避免不必要的重新计算
  const menuItems = useMemo(() => [
    {
      key: '0',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">数据统计</Link>
    },
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
      label: '系统设置',
      permission: PERMISSIONS.SYSTEM_THEME,
      children: [
        {
          key: '4-1',
          label: <Link to="/settings">主题设置</Link>,
          permission: PERMISSIONS.SYSTEM_THEME
        },
        {
          key: '4-2',
          label: <Link to="/oss-config">OSS 配置</Link>,
          permission: PERMISSIONS.SYSTEM_CONFIG
        },
        {
          key: '4-3',
          label: <Link to="/permission-manage">权限管理</Link>,
          permission: PERMISSIONS.PERMISSION_MANAGE
        }
      ]
    },
    {
      key: '5',
      icon: <FileExcelOutlined />,
      label: <Link to="/excel-import">Excel 导入</Link>,
      permission: MENU_PERMISSIONS['/excel-import']
    },
    {
      key: '6',
      icon: <FileTextOutlined />,
      label: <Link to="/student-enrollment">学生登记</Link>,
      permission: MENU_PERMISSIONS['/student-enrollment']
    }
  ].filter(item => !item.permission || hasPermission(item.permission)).map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => !child.permission || hasPermission(child.permission))
      }
    }
    return item
  }), [hasPermission])
  
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
  
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Sider 
        width={240} 
        theme="dark"
        style={{ 
          background: 'linear-gradient(180deg, rgba(26, 26, 46, 0.95) 0%, rgba(26, 26, 46, 0.98) 100%)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ 
          height: 80, 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          <div style={{
            fontSize: 24,
            fontWeight: '800',
            background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px'
          }}>
            StyleMirror
          </div>
          <div style={{
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.6)',
            marginTop: '4px',
            letterSpacing: '2px'
          }}>
            ADMIN SYSTEM
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ 
            background: 'transparent',
            border: 'none',
            marginTop: '16px',
            padding: '0 12px'
          }}
          items={menuItems.map(item => ({
            ...item,
            style: {
              borderRadius: '12px',
              margin: '4px 0',
              height: '48px',
              lineHeight: '48px'
            }
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          padding: '0 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 24px rgba(31, 38, 135, 0.15)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          height: '72px'
        }}>
          <Text strong style={{ 
            fontSize: 24, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
          }}>管理后台</Text>
          <Space size="large">
            <div style={{
              padding: '8px 20px',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: '12px',
              border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
              <Text style={{ color: '#666', fontSize: '14px' }}>
                欢迎，<Text strong style={{ color: '#667eea' }}>{user?.username || '管理员'}</Text> ({user?.role || 'ADMIN'})
              </Text>
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar 
                size={48}
                style={{ 
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                icon={<UserOutlined />}
              />
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ 
          margin: 24, 
          padding: 0,
          background: 'transparent',
          minHeight: 280
        }}>
          <React.Suspense fallback={<PageLoadingFallback />}>
            <Routes>
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
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
            <Route 
              path="/oss-config" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.SYSTEM_CONFIG}>
                    <SystemConfig />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/permission-manage" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.PERMISSION_MANAGE}>
                    <PermissionManage />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/excel-import" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.EXCEL_IMPORT}>
                    <ExcelImport />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student-enrollment" 
              element={
                <ProtectedRoute>
                  <PermissionCheck permission={PERMISSIONS.STUDENT_ENROLLMENT_VIEW}>
                    <StudentEnrollment />
                  </PermissionCheck>
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </React.Suspense>
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
















