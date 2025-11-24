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
  DashboardOutlined
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
















