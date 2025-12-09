import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import axios from 'axios'
import { message } from 'antd'
import { loadPermissionConfig, ROLE_PERMISSIONS } from '../config/permissions'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const api = useMemo(() => {
    const instance = axios.create({ 
      baseURL: 'https://fxyw.work/api',
      timeout: 60000  // 增加到60秒,给首次查询足够时间
    })
    
    // 请求拦截器：添加token
    instance.interceptors.request.use(
      cfg => {
        if (token) {
          cfg.headers['Authorization'] = `Bearer ${token}`
        }
        return cfg
      },
      error => Promise.reject(error)
    )
    
    // 响应拦截器：处理错误和权限
    instance.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          const { status, data } = error.response
          if (status === 401) {
            // 未授权，清除token并跳转登录
            setToken('')
            localStorage.removeItem('adminToken')
            message.error('登录已过期，请重新登录')
          } else if (status === 403) {
            message.error('没有权限访问此资源')
          } else if (status >= 500) {
            message.error('服务器错误，请稍后重试')
          } else {
            message.error(data?.message || '请求失败')
          }
        } else if (error.request) {
          message.error('网络错误，请检查网络连接')
        } else {
          message.error('请求失败：' + error.message)
        }
        return Promise.reject(error)
      }
    )
    
    return instance
  }, [token])

  // 从token中解析用户信息（直接使用本地配置）
  useEffect(() => {
    if (token) {
      try {
        // JWT token的payload部分（base64解码）
        const payload = JSON.parse(atob(token.split('.')[1]))
        const role = payload.role || 'ADMIN'
        const username = payload.sub?.replace('admin:', '') || 'admin'
        
        // 直接使用本地的角色权限配置，不调用后端 API
        const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['ADMIN']
        
        setUser({
          username,
          role,
          permissions,
          // 支持从token中获取权限（如果后端返回）
          ...(payload.permissions && { permissions: payload.permissions })
        })
      } catch (e) {
        console.error('解析token失败', e)
        // 降级方案:给ADMIN完整权限
        setUser({ 
          username: 'admin', 
          role: 'ADMIN',
          permissions: ROLE_PERMISSIONS['ADMIN']
        })
      }
    } else {
      setUser(null)
    }
  }, [token])

  const login = async (username, password) => {
    setLoading(true)
    try {
      const res = await axios.post('http://fxyw.work/api/admin/auth/login', { username, password })
      if (res.data?.code === 0) {
        const t = res.data.data.token
        setToken(t)
        localStorage.setItem('adminToken', t)
        message.success('登录成功')
        return true
      } else {
        message.error(res.data?.message || '登录失败')
        return false
      }
    } catch (error) {
      if (error.response?.status === 401) {
        message.error('用户名或密码错误')
      } else {
        message.error('登录失败，请稍后重试')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('adminToken')
    message.success('已退出登录')
  }

  // 检查是否有管理员权限
  const hasAdminRole = () => {
    return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
  }

  // 检查是否有权限
  const hasPermission = (permission) => {
    if (!user?.permissions) return false
    return user.permissions.includes(permission) || user.permissions.includes('system:config')
  }

  // 检查是否有任一权限
  const hasAnyPermission = (permissions) => {
    if (!user?.permissions || !permissions) return false
    return permissions.some(permission => hasPermission(permission))
  }

  return (
    <AuthCtx.Provider value={{ 
      token, 
      user, 
      api, 
      login, 
      logout, 
      loading,
      hasAdminRole,
      hasPermission,
      hasAnyPermission,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthCtx)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
















