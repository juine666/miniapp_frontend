package com.stylemirror.miniapp_backend.service;

import com.stylemirror.miniapp_backend.entity.Permission;
import com.stylemirror.miniapp_backend.entity.Role;
import com.stylemirror.miniapp_backend.mapper.PermissionMapper;
import com.stylemirror.miniapp_backend.mapper.RoleMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 权限管理服务
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {
    
    private final PermissionMapper permissionMapper;
    private final RoleMapper roleMapper;
    
    /**
     * 获取所有权限，按分组组织
     */
    public Map<String, List<Permission>> getAllPermissionsGrouped() {
        List<Permission> permissions = permissionMapper.findAll();
        return permissions.stream()
                .collect(Collectors.groupingBy(Permission::getPermissionGroup));
    }
    
    /**
     * 获取所有权限
     */
    public List<Permission> getAllPermissions() {
        return permissionMapper.findAll();
    }
    
    /**
     * 根据权限分组获取权限
     */
    public List<Permission> getPermissionsByGroup(String group) {
        return permissionMapper.findByGroup(group);
    }
    
    /**
     * 根据角色代码获取权限列表
     */
    public List<String> getPermissionCodesByRole(String roleCode) {
        Role role = roleMapper.findByCode(roleCode);
        if (role == null) {
            return Collections.emptyList();
        }
        
        List<Permission> permissions = permissionMapper.findByRoleId(role.getId());
        return permissions.stream()
                .map(Permission::getCode)
                .collect(Collectors.toList());
    }
    
    /**
     * 根据用户ID获取权限列表
     */
    public List<String> getPermissionCodesByUserId(Long userId) {
        List<Role> roles = roleMapper.findByUserId(userId);
        if (roles.isEmpty()) {
            return Collections.emptyList();
        }
        
        Set<String> permissionCodes = new HashSet<>();
        for (Role role : roles) {
            List<Permission> permissions = permissionMapper.findByRoleId(role.getId());
            permissions.forEach(p -> permissionCodes.add(p.getCode()));
        }
        
        return new ArrayList<>(permissionCodes);
    }
    
    /**
     * 获取所有角色
     */
    public List<Role> getAllRoles() {
        return roleMapper.findAll();
    }
    
    /**
     * 获取角色及其权限
     */
    public List<Role> getRolesWithPermissions() {
        List<Role> roles = roleMapper.findAll();
        for (Role role : roles) {
            List<Permission> permissions = permissionMapper.findByRoleId(role.getId());
            role.setPermissions(permissions);
        }
        return roles;
    }
    
    /**
     * 根据角色代码获取角色信息
     */
    public Role getRoleByCode(String code) {
        Role role = roleMapper.findByCode(code);
        if (role != null) {
            List<Permission> permissions = permissionMapper.findByRoleId(role.getId());
            role.setPermissions(permissions);
        }
        return role;
    }
    
    /**
     * 创建角色
     */
    @Transactional
    public Role createRole(Role role) {
        roleMapper.insert(role);
        log.info("创建角色成功: {}", role.getCode());
        return role;
    }
    
    /**
     * 更新角色
     */
    @Transactional
    public void updateRole(Role role) {
        roleMapper.update(role);
        log.info("更新角色成功: {}", role.getCode());
    }
    
    /**
     * 删除角色
     */
    @Transactional
    public void deleteRole(Long roleId) {
        roleMapper.deleteById(roleId);
        log.info("删除角色成功: {}", roleId);
    }
    
    /**
     * 为角色分配权限
     */
    @Transactional
    public void assignPermissionsToRole(Long roleId, List<Long> permissionIds) {
        // 先清空原有权限
        roleMapper.clearPermissions(roleId);
        
        // 分配新权限
        for (Long permissionId : permissionIds) {
            roleMapper.assignPermission(roleId, permissionId);
        }
        
        log.info("为角色 {} 分配权限成功，权限数量: {}", roleId, permissionIds.size());
    }
    
    /**
     * 为用户分配角色
     */
    @Transactional
    public void assignRoleToUser(Long userId, Long roleId) {
        roleMapper.assignUserRole(userId, roleId);
        log.info("为用户 {} 分配角色 {} 成功", userId, roleId);
    }
    
    /**
     * 移除用户的角色
     */
    @Transactional
    public void removeRoleFromUser(Long userId, Long roleId) {
        roleMapper.removeUserRole(userId, roleId);
        log.info("移除用户 {} 的角色 {} 成功", userId, roleId);
    }
}
