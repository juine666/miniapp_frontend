package com.stylemirror.miniapp_backend.entity;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 角色实体类
 */
@Data
public class Role {
    
    /**
     * 角色ID
     */
    private Long id;
    
    /**
     * 角色代码，如 ADMIN, EDITOR
     */
    private String code;
    
    /**
     * 角色名称，如 管理员, 编辑员
     */
    private String name;
    
    /**
     * 角色描述
     */
    private String description;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
    
    /**
     * 角色拥有的权限列表（用于关联查询）
     */
    private List<Permission> permissions;
}
