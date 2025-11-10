import React from 'react'
import { useAuth } from '../auth/AuthContext'
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../config/permissions'

/**
 * 权限检查组件
 * 根据用户权限显示或隐藏内容
 */
export function PermissionCheck({ 
  permission, 
  permissions, 
  requireAll = false,
  fallback = null,
  children 
}) {
  const { user } = useAuth()
  const userPermissions = user?.permissions || []
  
  let hasAccess = false
  
  if (permission) {
    // 检查单个权限
    hasAccess = hasPermission(userPermissions, permission)
  } else if (permissions) {
    // 检查多个权限
    if (requireAll) {
      hasAccess = hasAllPermissions(userPermissions, permissions)
    } else {
      hasAccess = hasAnyPermission(userPermissions, permissions)
    }
  } else {
    // 没有指定权限，默认显示
    hasAccess = true
  }
  
  return hasAccess ? children : fallback
}

/**
 * 权限检查Hook
 */
export function usePermission() {
  const { user } = useAuth()
  const userPermissions = user?.permissions || []
  
  return {
    hasPermission: (permission) => hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions) => hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions) => hasAllPermissions(userPermissions, permissions),
  }
}

