package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 管理员控制器
 * 处理管理员相关的API接口
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final SystemConfigService systemConfigService;

    /**
     * 获取指定分组的配置
     */
    @GetMapping("/config/{group}")
    public ApiResponse<Map<String, String>> getConfigByGroup(@PathVariable String group) {
        List<com.stylemirror.miniapp_backend.domain.SystemConfig> configs = 
            systemConfigService.getConfigByGroup(group);
        
        Map<String, String> result = new HashMap<>();
        for (com.stylemirror.miniapp_backend.domain.SystemConfig config : configs) {
            // 使用配置键的后缀作为返回的键名
            String key = config.getConfigKey().substring(config.getConfigKey().indexOf('.') + 1);
            result.put(key, config.getConfigValue());
        }
        
        return ApiResponse.success(result);
    }

    /**
     * 保存指定分组的配置
     */
    @PostMapping("/config/{group}")
    public ApiResponse<Void> saveConfigByGroup(@PathVariable String group, @RequestBody Map<String, String> configData) {
        for (Map.Entry<String, String> entry : configData.entrySet()) {
            String configKey = group + "." + entry.getKey();
            String configValue = entry.getValue();
            
            // 根据分组确定描述和敏感性
            String description = getConfigDescription(group, entry.getKey());
            boolean isSensitive = isSensitiveConfig(group, entry.getKey());
            
            systemConfigService.saveOrUpdateConfig(configKey, configValue, description, group, isSensitive);
        }
        
        return ApiResponse.success(null);
    }

    /**
     * 获取配置描述
     */
    private String getConfigDescription(String group, String key) {
        switch (group) {
            case "wechat":
                switch (key) {
                    case "appid": return "微信小程序 AppID（敏感信息）";
                    case "secret": return "微信小程序 Secret（敏感信息）";
                    default: return "微信配置项";
                }
            case "server":
                switch (key) {
                    case "url": return "后端服务器URL";
                    default: return "服务器配置项";
                }
            case "oss":
                switch (key) {
                    case "endpoint": return "OSS 服务地址";
                    case "bucket": return "OSS 存储桶名称";
                    case "accessKeyId": return "OSS 访问密钥ID（敏感信息）";
                    case "accessKeySecret": return "OSS 访问密钥Secret（敏感信息）";
                    case "publicBaseUrl": return "OSS 公网访问地址";
                    default: return "OSS 配置项";
                }
            default:
                return "系统配置项";
        }
    }

    /**
     * 判断是否为敏感配置
     */
    private boolean isSensitiveConfig(String group, String key) {
        switch (group) {
            case "wechat":
                return true; // 微信配置都是敏感的
            case "oss":
                return "accessKeyId".equals(key) || "accessKeySecret".equals(key); // OSS的密钥是敏感的
            default:
                return false;
        }
    }
}