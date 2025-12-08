-- 创建权限表
CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '权限ID',
  code VARCHAR(100) NOT NULL UNIQUE COMMENT '权限编码',
  name VARCHAR(100) NOT NULL COMMENT '权限名称',
  permission_group VARCHAR(50) NOT NULL COMMENT '权限分组',
  description TEXT COMMENT '权限描述',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限表';

-- 创建角色表
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '角色ID',
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
  name VARCHAR(100) NOT NULL COMMENT '角色名称',
  description TEXT COMMENT '角色描述',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 创建用户角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  role_id BIGINT NOT NULL COMMENT '角色ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_user_role (user_id, role_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 创建角色权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '关联ID',
  role_id BIGINT NOT NULL COMMENT '角色ID',
  permission_id BIGINT NOT NULL COMMENT '权限ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  UNIQUE KEY uk_role_permission (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限关联表';

-- 插入默认权限数据
INSERT INTO permissions (code, name, permission_group, description) VALUES
-- 分类管理
('category:view', '查看分类', '分类管理', '允许查看商品分类列表'),
('category:create', '创建分类', '分类管理', '允许创建新的商品分类'),
('category:edit', '编辑分类', '分类管理', '允许编辑商品分类信息'),
('category:delete', '删除分类', '分类管理', '允许删除商品分类'),

-- 商品管理
('product:view', '查看商品', '商品管理', '允许查看商品列表'),
('product:create', '创建商品', '商品管理', '允许创建新商品'),
('product:edit', '编辑商品', '商品管理', '允许编辑商品信息'),
('product:audit', '审核商品', '商品管理', '允许审核商品'),
('product:publish', '发布商品', '商品管理', '允许发布商品上架'),
('product:reject', '驳回商品', '商品管理', '允许驳回商品审核'),
('product:offline', '下线商品', '商品管理', '允许将商品下线'),

-- 用户管理
('user:view', '查看用户', '用户管理', '允许查看用户列表'),
('user:ban', '封禁用户', '用户管理', '允许封禁用户'),
('user:unban', '解封用户', '用户管理', '允许解封用户'),

-- 评论管理
('comment:manage', '管理评论', '评论管理', '允许管理评论'),
('comment:delete', '删除评论', '评论管理', '允许删除评论'),

-- 系统管理
('system:config', '系统配置', '系统管理', '允许修改系统配置'),
('system:theme', '主题设置', '系统管理', '允许修改系统主题'),
('excel:import', 'Excel导入', '系统管理', '允许导入Excel数据'),

-- 学生登记
('student_enrollment:view', '查看登记', '学生登记', '允许查看学生登记信息'),
('student_enrollment:create', '创建登记', '学生登记', '允许创建学生登记'),
('student_enrollment:edit', '编辑登记', '学生登记', '允许编辑学生登记信息'),
('student_enrollment:delete', '删除登记', '学生登记', '允许删除学生登记'),
('student_enrollment:export', '导出登记', '学生登记', '允许导出学生登记数据'),

-- 权限管理
('permission:manage', '权限管理', '权限管理', '允许管理系统权限'),
('role:create', '创建角色', '权限管理', '允许创建新角色'),
('role:edit', '编辑角色', '权限管理', '允许编辑角色信息'),
('role:delete', '删除角色', '权限管理', '允许删除角色'),

-- 订单管理
('order:view', '查看订单', '订单管理', '允许查看订单列表'),
('order:create', '创建订单', '订单管理', '允许创建订单'),
('order:edit', '编辑订单', '订单管理', '允许编辑订单信息'),
('order:delete', '删除订单', '订单管理', '允许删除订单'),
('order:export', '导出订单', '订单管理', '允许导出订单数据');

-- 插入默认角色
INSERT INTO roles (code, name, description) VALUES
('SUPER_ADMIN', '超级管理员', '拥有所有权限'),
('ADMIN', '管理员', '拥有大部分管理权限'),
('AUDITOR', '审核员', '负责商品审核'),
('EDITOR', '编辑员', '负责分类和商品管理'),
('VIEWER', '查看员', '只能查看数据');

-- 为超级管理员分配所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE code = 'SUPER_ADMIN'),
    id
FROM permissions;

-- 为管理员分配权限（除超级管理员专有权限外的所有权限）
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE code = 'ADMIN'),
    id
FROM permissions;

-- 为审核员分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE code = 'AUDITOR'),
    id
FROM permissions
WHERE code IN ('product:view', 'product:audit', 'product:publish', 'product:reject');

-- 为编辑员分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE code = 'EDITOR'),
    id
FROM permissions
WHERE code IN ('category:view', 'category:create', 'category:edit', 'product:view');

-- 为查看员分配权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    (SELECT id FROM roles WHERE code = 'VIEWER'),
    id
FROM permissions
WHERE code IN ('category:view', 'product:view', 'user:view');

-- 为现有admin用户分配管理员角色（假设admin用户ID为1）
INSERT INTO user_roles (user_id, role_id)
SELECT 1, id FROM roles WHERE code = 'ADMIN'
ON DUPLICATE KEY UPDATE user_id = user_id;