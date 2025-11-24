/**
 * 权限配置
 * 定义不同角色可以访问的功能
 */

// 权限常量
export const PERMISSIONS = {
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
}

// 角色权限映射
export const ROLE_PERMISSIONS = {
  // 超级管理员 - 所有权限
  SUPER_ADMIN: Object.values(PERMISSIONS),
  
  // 管理员 - 大部分权限
  ADMIN: [
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_EDIT,
    PERMISSIONS.CATEGORY_DELETE,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_EDIT,
    PERMISSIONS.PRODUCT_AUDIT,
    PERMISSIONS.PRODUCT_PUBLISH,
    PERMISSIONS.PRODUCT_REJECT,
    PERMISSIONS.PRODUCT_OFFLINE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_BAN,
    PERMISSIONS.USER_UNBAN,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.SYSTEM_THEME,
    PERMISSIONS.EXCEL_IMPORT,
    PERMISSIONS.STUDENT_ENROLLMENT_VIEW,
    PERMISSIONS.STUDENT_ENROLLMENT_CREATE,
    PERMISSIONS.STUDENT_ENROLLMENT_EDIT,
    PERMISSIONS.STUDENT_ENROLLMENT_DELETE,
    PERMISSIONS.STUDENT_ENROLLMENT_EXPORT,
  ],
  
  // 审核员 - 只能审核商品
  AUDITOR: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_AUDIT,
    PERMISSIONS.PRODUCT_PUBLISH,
    PERMISSIONS.PRODUCT_REJECT,
  ],
  
  // 编辑员 - 只能管理分类和商品
  EDITOR: [
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.CATEGORY_CREATE,
    PERMISSIONS.CATEGORY_EDIT,
    PERMISSIONS.PRODUCT_VIEW,
  ],
  
  // 查看员 - 只能查看
  VIEWER: [
    PERMISSIONS.CATEGORY_VIEW,
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.USER_VIEW,
  ],
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

/**
 * 根据角色获取权限列表
 * @param {string} role - 角色名称
 * @returns {string[]}
 */
export function getPermissionsByRole(role) {
  return ROLE_PERMISSIONS[role] || []
}

