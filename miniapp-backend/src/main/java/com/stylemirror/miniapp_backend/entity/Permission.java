package com.stylemirror.miniapp_backend.entity;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 权限实体类
 */
@Data
public class Permission {
    
    /**
     * 权限ID
     */
    private Long id;
    
    /**
     * 权限代码，如 order:view, product:create
     */
    private String code;
    
    /**
     * 权限名称，如 查看订单, 创建商品
     */
    private String name;
    
    /**
     * 权限分组，如 订单管理, 商品管理
     */
    private String permissionGroup;
    
    /**
     * 权限描述
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
}
