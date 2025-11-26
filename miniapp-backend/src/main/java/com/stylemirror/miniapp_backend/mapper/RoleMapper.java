package com.stylemirror.miniapp_backend.mapper;

import com.stylemirror.miniapp_backend.entity.Role;
import org.apache.ibatis.annotations.*;
import java.util.List;

/**
 * 角色Mapper
 */
@Mapper
public interface RoleMapper {
    
    /**
     * 查询所有角色
     */
    @Select("SELECT * FROM roles ORDER BY code")
    List<Role> findAll();
    
    /**
     * 根据角色代码查询角色
     */
    @Select("SELECT * FROM roles WHERE code = #{code}")
    Role findByCode(String code);
    
    /**
     * 根据ID查询角色
     */
    @Select("SELECT * FROM roles WHERE id = #{id}")
    Role findById(Long id);
    
    /**
     * 根据用户ID查询角色列表
     */
    @Select("SELECT r.* FROM roles r " +
            "INNER JOIN user_roles ur ON r.id = ur.role_id " +
            "WHERE ur.user_id = #{userId}")
    List<Role> findByUserId(Long userId);
    
    /**
     * 创建角色
     */
    @Insert("INSERT INTO roles (code, name, description) " +
            "VALUES (#{code}, #{name}, #{description})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Role role);
    
    /**
     * 更新角色
     */
    @Update("UPDATE roles SET name = #{name}, description = #{description} " +
            "WHERE id = #{id}")
    int update(Role role);
    
    /**
     * 删除角色
     */
    @Delete("DELETE FROM roles WHERE id = #{id}")
    int deleteById(Long id);
    
    /**
     * 为角色分配权限
     */
    @Insert("INSERT INTO role_permissions (role_id, permission_id) " +
            "VALUES (#{roleId}, #{permissionId}) " +
            "ON DUPLICATE KEY UPDATE role_id = role_id")
    int assignPermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
    
    /**
     * 移除角色的权限
     */
    @Delete("DELETE FROM role_permissions WHERE role_id = #{roleId} AND permission_id = #{permissionId}")
    int removePermission(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
    
    /**
     * 清空角色的所有权限
     */
    @Delete("DELETE FROM role_permissions WHERE role_id = #{roleId}")
    int clearPermissions(Long roleId);
    
    /**
     * 为用户分配角色
     */
    @Insert("INSERT INTO user_roles (user_id, role_id) " +
            "VALUES (#{userId}, #{roleId}) " +
            "ON DUPLICATE KEY UPDATE user_id = user_id")
    int assignUserRole(@Param("userId") Long userId, @Param("roleId") Long roleId);
    
    /**
     * 移除用户的角色
     */
    @Delete("DELETE FROM user_roles WHERE user_id = #{userId} AND role_id = #{roleId}")
    int removeUserRole(@Param("userId") Long userId, @Param("roleId") Long roleId);
}
