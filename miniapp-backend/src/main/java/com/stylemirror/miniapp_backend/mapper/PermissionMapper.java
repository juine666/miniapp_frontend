package com.stylemirror.miniapp_backend.mapper;

import com.stylemirror.miniapp_backend.entity.Permission;
import org.apache.ibatis.annotations.*;
import java.util.List;

/**
 * 权限Mapper
 */
@Mapper
public interface PermissionMapper {
    
    /**
     * 查询所有权限
     */
    @Select("SELECT * FROM permissions ORDER BY permission_group, code")
    List<Permission> findAll();
    
    /**
     * 根据权限分组查询权限
     */
    @Select("SELECT * FROM permissions WHERE permission_group = #{group} ORDER BY code")
    List<Permission> findByGroup(String group);
    
    /**
     * 根据权限代码查询权限
     */
    @Select("SELECT * FROM permissions WHERE code = #{code}")
    Permission findByCode(String code);
    
    /**
     * 根据角色ID查询权限列表
     */
    @Select("SELECT p.* FROM permissions p " +
            "INNER JOIN role_permissions rp ON p.id = rp.permission_id " +
            "WHERE rp.role_id = #{roleId} " +
            "ORDER BY p.permission_group, p.code")
    List<Permission> findByRoleId(Long roleId);
    
    /**
     * 创建权限
     */
    @Insert("INSERT INTO permissions (code, name, permission_group, description) " +
            "VALUES (#{code}, #{name}, #{permissionGroup}, #{description})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Permission permission);
    
    /**
     * 更新权限
     */
    @Update("UPDATE permissions SET name = #{name}, " +
            "permission_group = #{permissionGroup}, " +
            "description = #{description} " +
            "WHERE id = #{id}")
    int update(Permission permission);
    
    /**
     * 删除权限
     */
    @Delete("DELETE FROM permissions WHERE id = #{id}")
    int deleteById(Long id);
}
