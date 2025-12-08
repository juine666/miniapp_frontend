-- 添加评论管理权限
INSERT INTO permissions (code, name, permission_group, description) VALUES
('comment:manage', '管理评论', '评论管理', '允许管理评论'),
('comment:delete', '删除评论', '评论管理', '允许删除评论')
ON DUPLICATE KEY UPDATE code = code;

-- 为管理员和超级管理员角色分配评论管理权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
    r.id as role_id,
    p.id as permission_id
FROM roles r, permissions p
WHERE r.code IN ('ADMIN', 'SUPER_ADMIN') 
  AND p.code IN ('comment:manage', 'comment:delete')
ON DUPLICATE KEY UPDATE role_id = role_id;