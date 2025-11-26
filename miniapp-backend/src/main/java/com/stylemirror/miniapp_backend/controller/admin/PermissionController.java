package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.entity.Permission;
import com.stylemirror.miniapp_backend.entity.Role;
import com.stylemirror.miniapp_backend.service.PermissionService;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 权限管理控制器
 */
@RestController
@RequestMapping("/api/admin/permissions")
@RequiredArgsConstructor
@Slf4j
public class PermissionController {
    
    private final PermissionService permissionService;
    
    /**
     * 获取所有权限（按分组）
     */
    @GetMapping("/grouped")
    public ResponseEntity<ApiResponse<Map<String, List<Permission>>>> getPermissionsGrouped() {
        try {
            Map<String, List<Permission>> permissions = permissionService.getAllPermissionsGrouped();
            return ResponseEntity.ok(ApiResponse.success(permissions));
        } catch (Exception e) {
            log.error("获取权限列表失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "获取权限列表失败"));
        }
    }
    
    /**
     * 获取所有权限
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Permission>>> getAllPermissions() {
        try {
            List<Permission> permissions = permissionService.getAllPermissions();
            return ResponseEntity.ok(ApiResponse.success(permissions));
        } catch (Exception e) {
            log.error("获取权限列表失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "获取权限列表失败"));
        }
    }
    
    /**
     * 获取所有角色及其权限
     */
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<Role>>> getRolesWithPermissions() {
        try {
            List<Role> roles = permissionService.getRolesWithPermissions();
            return ResponseEntity.ok(ApiResponse.success(roles));
        } catch (Exception e) {
            log.error("获取角色列表失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "获取角色列表失败"));
        }
    }
    
    /**
     * 获取权限配置（前端格式）
     * 返回格式:
     * {
     *   "PERMISSIONS": { "CATEGORY_VIEW": "category:view", ... },
     *   "ROLE_PERMISSIONS": { "ADMIN": ["category:view", ...], ... },
     *   "PERMISSION_GROUPS": [
     *     { "name": "分类管理", "permissions": [...] },
     *     ...
     *   ]
     * }
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPermissionConfig() {
        try {
            Map<String, Object> config = new HashMap<>();
            
            // 1. 获取所有权限，转换为前端格式的 PERMISSIONS 对象
            List<Permission> allPermissions = permissionService.getAllPermissions();
            Map<String, String> permissionsMap = new HashMap<>();
            for (Permission p : allPermissions) {
                // 将 code 转换为大写常量名，如 category:view -> CATEGORY_VIEW
                String constantName = p.getCode().toUpperCase().replace(":", "_");
                permissionsMap.put(constantName, p.getCode());
            }
            config.put("PERMISSIONS", permissionsMap);
            
            // 2. 获取所有角色及其权限代码
            List<Role> roles = permissionService.getRolesWithPermissions();
            Map<String, List<String>> rolePermissions = new HashMap<>();
            for (Role role : roles) {
                List<String> permissionCodes = role.getPermissions().stream()
                        .map(Permission::getCode)
                        .collect(Collectors.toList());
                rolePermissions.put(role.getCode(), permissionCodes);
            }
            config.put("ROLE_PERMISSIONS", rolePermissions);
            
            // 3. 获取权限分组信息
            Map<String, List<Permission>> groupedPermissions = permissionService.getAllPermissionsGrouped();
            List<Map<String, Object>> permissionGroups = groupedPermissions.entrySet().stream()
                    .map(entry -> {
                        Map<String, Object> group = new HashMap<>();
                        group.put("name", entry.getKey());
                        group.put("permissions", entry.getValue());
                        return group;
                    })
                    .collect(Collectors.toList());
            config.put("PERMISSION_GROUPS", permissionGroups);
            
            return ResponseEntity.ok(ApiResponse.success(config));
        } catch (Exception e) {
            log.error("获取权限配置失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "获取权限配置失败"));
        }
    }
    
    /**
     * 为角色分配权限
     */
    @PostMapping("/roles/{roleId}/permissions")
    public ResponseEntity<ApiResponse<Void>> assignPermissions(
            @PathVariable Long roleId,
            @RequestBody List<Long> permissionIds) {
        try {
            permissionService.assignPermissionsToRole(roleId, permissionIds);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("分配权限失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "分配权限失败"));
        }
    }
    
    /**
     * 创建角色
     */
    @PostMapping("/roles")
    public ResponseEntity<ApiResponse<Role>> createRole(@RequestBody Role role) {
        try {
            Role created = permissionService.createRole(role);
            return ResponseEntity.ok(ApiResponse.success(created));
        } catch (Exception e) {
            log.error("创建角色失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "创建角色失败"));
        }
    }
    
    /**
     * 更新角色
     */
    @PutMapping("/roles/{roleId}")
    public ResponseEntity<ApiResponse<Void>> updateRole(
            @PathVariable Long roleId,
            @RequestBody Role role) {
        try {
            role.setId(roleId);
            permissionService.updateRole(role);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("更新角色失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "更新角色失败"));
        }
    }
    
    /**
     * 删除角色
     */
    @DeleteMapping("/roles/{roleId}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long roleId) {
        try {
            permissionService.deleteRole(roleId);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("删除角色失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "删除角色失败"));
        }
    }
}
