/**
 * 权限配置
 * 从数据库动态加载权限配置
 */

// 权限配置缓存
let permissionConfig = null
let configLoadPromise = null

/**
 * 从后端加载权限配置
 */
export async function loadPermissionConfig() {
  // 如果已经加载过，直接返回缓存
  if (permissionConfig) {
    return permissionConfig
  }
  
  // 如果正在加载中，返回同一个Promise
  if (configLoadPromise) {
    return configLoadPromise
  }
  
  // 开始加载
  configLoadPromise = (async () => {
    try {
      const response = await fetch('http://localhost:8081/api/admin/permissions/config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error('加载权限配置失败')
      }
      
      const result = await response.json()
      if (result.code === 0) {
        permissionConfig = result.data
        return permissionConfig
      } else {
        throw new Error(result.message || '加载权限配置失败')
      }
    } catch (error) {
      console.error('加载权限配置失败，使用默认配置:', error)
      // 加载失败时使用默认配置
      permissionConfig = getDefaultPermissionConfig()
      return permissionConfig
    } finally {
      configLoadPromise = null
    }
  })()
  
  return configLoadPromise
}

/**
 * 获取默认权限配置（用于加载失败时的降级方案）
 */
function getDefaultPermissionConfig() {
  const PERMISSIONS = {
    // 分类管理
    CATEGORY_VIEW: 'category:view',
    CATEGORY_CREATE: 'category:create',
    CATEGORY_EDIT: 'category:edit',
    CATEGORY_DELETE: 'category:delete',
    
    // 商品管理
    PRODUCT_VIEW: 'product:view',
    PRODUCT_CREATE: 'product:create',
    PRODUCT_EDIT: 'product:edit',
    PRODUCT_AUDIT: 'product:audit',
    PRODUCT_PUBLISH: 'product:publish',
    PRODUCT_REJECT: 'product:reject',
    PRODUCT_OFFLINE: 'product:offline',
    
    // 用户管理
    USER_VIEW: 'user:view',
    USER_BAN: 'user:ban',
    USER_UNBAN: 'user:unban',
    
    // 系统管理
    SYSTEM_CONFIG: 'system:config',
    SYSTEM_THEME: 'system:theme',
    EXCEL_IMPORT: 'excel:import',
    
    // 学生登记管理
    STUDENT_ENROLLMENT_VIEW: 'student_enrollment:view',
    STUDENT_ENROLLMENT_CREATE: 'student_enrollment:create',
    STUDENT_ENROLLMENT_EDIT: 'student_enrollment:edit',
    STUDENT_ENROLLMENT_DELETE: 'student_enrollment:delete',
    STUDENT_ENROLLMENT_EXPORT: 'student_enrollment:export',
    
    // 权限管理
    PERMISSION_MANAGE: 'permission:manage',
    ROLE_CREATE: 'role:create',
    ROLE_EDIT: 'role:edit',
    ROLE_DELETE: 'role:delete',
    
    // 订单管理
    ORDER_VIEW: 'order:view',
    ORDER_CREATE: 'order:create',
    ORDER_EDIT: 'order:edit',
    ORDER_DELETE: 'order:delete',
    ORDER_EXPORT: 'order:export',
  }
  
  return {
    PERMISSIONS,
    ROLE_PERMISSIONS: {
      SUPER_ADMIN: Object.values(PERMISSIONS),
      ADMIN: Object.values(PERMISSIONS),
      AUDITOR: [
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.PRODUCT_AUDIT,
        PERMISSIONS.PRODUCT_PUBLISH,
        PERMISSIONS.PRODUCT_REJECT,
      ],
      EDITOR: [
        PERMISSIONS.CATEGORY_VIEW,
        PERMISSIONS.CATEGORY_CREATE,
        PERMISSIONS.CATEGORY_EDIT,
        PERMISSIONS.PRODUCT_VIEW,
      ],
      VIEWER: [
        PERMISSIONS.CATEGORY_VIEW,
        PERMISSIONS.PRODUCT_VIEW,
        PERMISSIONS.USER_VIEW,
      ],
    }
  }
}

/**
 * 获取权限常量对象
 */
export async function getPermissions() {
  const config = await loadPermissionConfig()
  return config.PERMISSIONS
}

/**
 * 获取角色权限映射
 */
export async function getRolePermissions() {
  const config = await loadPermissionConfig()
  return config.ROLE_PERMISSIONS
}

// 兼容旧代码的同步导出（使用默认配置）
const defaultConfig = getDefaultPermissionConfig()
export const PERMISSIONS = defaultConfig.PERMISSIONS
export const ROLE_PERMISSIONS = defaultConfig.ROLE_PERMISSIONS

// 获取角色的权限列表（同步版本，使用默认配置）
export function getPermissionsByRole(role) {
  return defaultConfig.ROLE_PERMISSIONS[role] || []
}

// 菜单权限映射
export const MENU_PERMISSIONS = {
  '/categories': PERMISSIONS.CATEGORY_VIEW,
  '/products': PERMISSIONS.PRODUCT_VIEW,
  '/users': PERMISSIONS.USER_VIEW,
  '/settings': PERMISSIONS.SYSTEM_THEME,
  '/oss-config': PERMISSIONS.SYSTEM_CONFIG,
  '/excel-import': PERMISSIONS.EXCEL_IMPORT,
  '/student-enrollment': PERMISSIONS.STUDENT_ENROLLMENT_VIEW,
  '/permission-manage': PERMISSIONS.PERMISSION_MANAGE,
  '/orders': PERMISSIONS.ORDER_VIEW,  // 订单管理菜单
}

/**
 * 检查用户是否有指定权限
 * @param {string[]} userPermissions - 用户权限列表
 * @param {string} permission - 要检查的权限
 * @returns {boolean}
 */
export function hasPermission(userPermissions, permission) {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false
  }
  return userPermissions.includes(permission) || userPermissions.includes(PERMISSIONS.SYSTEM_CONFIG)
}

/**
 * 检查用户是否有任一权限
 * @param {string[]} userPermissions - 用户权限列表
 * @param {string[]} permissions - 要检查的权限列表
 * @returns {boolean}
 */
export function hasAnyPermission(userPermissions, permissions) {
  if (!permissions || !Array.isArray(permissions)) {
    return false
  }
  return permissions.some(permission => hasPermission(userPermissions, permission))
}

/**
 * 检查用户是否有所有权限
 * @param {string[]} userPermissions - 用户权限列表
 * @param {string[]} permissions - 要检查的权限列表
 * @returns {boolean}
 */
export function hasAllPermissions(userPermissions, permissions) {
  if (!permissions || !Array.isArray(permissions)) {
    return false
  }
  return permissions.every(permission => hasPermission(userPermissions, permission))
}

