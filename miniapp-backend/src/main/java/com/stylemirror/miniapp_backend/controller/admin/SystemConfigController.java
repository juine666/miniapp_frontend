package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.SystemConfig;
import com.stylemirror.miniapp_backend.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 系统配置管理 Controller
 */
@RestController
@RequestMapping("/api/admin/system-config")
@RequiredArgsConstructor
@Slf4j
public class SystemConfigController {
    
    private final SystemConfigService systemConfigService;
    
    /**
     * 获取指定分组的配置
     */
    @GetMapping("/group/{groupName}")
    public ResponseEntity<ApiResponse<List<SystemConfig>>> getConfigByGroup(
            @PathVariable String groupName) {
        try {
            List<SystemConfig> configs = systemConfigService.getConfigByGroup(groupName);
            
            // 敏感信息不返回真实值
            configs.forEach(config -> {
                if (config.getIsSensitive() != null && config.getIsSensitive()) {
                    config.setConfigValue("***hidden***");
                }
            });
            
            return ResponseEntity.ok(ApiResponse.success(configs));
        } catch (Exception e) {
            log.error("获取系统配置失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "获取配置失败"));
        }
    }
    
    /**
     * 获取所有配置（按分组分类）
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<Map<String, List<SystemConfig>>>> getAllConfigs() {
        try {
            List<SystemConfig> allConfigs = systemConfigService.getAllConfigs();
            
            // 敏感信息不返回真实值
            allConfigs.forEach(config -> {
                if (config.getIsSensitive() != null && config.getIsSensitive()) {
                    config.setConfigValue("***hidden***");
                }
            });
            
            // 按分组分类
            Map<String, List<SystemConfig>> groupedConfigs = allConfigs.stream()
                    .collect(Collectors.groupingBy(SystemConfig::getGroupName));
            
            return ResponseEntity.ok(ApiResponse.success(groupedConfigs));
        } catch (Exception e) {
            log.error("获取所有系统配置失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "获取配置失败"));
        }
    }
    
    /**
     * 更新配置
     */
    @PutMapping
    public ResponseEntity<ApiResponse<Void>> updateConfig(
            @RequestBody SystemConfig config) {
        try {
            if (config.getConfigKey() == null || config.getConfigKey().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error(400, "配置键不能为空"));
            }
            
            systemConfigService.saveOrUpdateConfig(
                    config.getConfigKey(),
                    config.getConfigValue(),
                    config.getDescription(),
                    config.getGroupName(),
                    config.getIsSensitive()
            );
            
            log.info("系统配置已更新: {}", config.getConfigKey());
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (Exception e) {
            log.error("更新系统配置失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "更新配置失败: " + e.getMessage()));
        }
    }
}