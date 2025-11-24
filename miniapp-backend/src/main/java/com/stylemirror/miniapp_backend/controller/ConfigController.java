package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.SystemConfig;
import com.stylemirror.miniapp_backend.mapper.SystemConfigMapper;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 公开配置接口
 * 供小程序获取 OSS 配置等公开信息
 */
@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
@Slf4j
public class ConfigController {
    
    private final SystemConfigMapper systemConfigMapper;
    
    /**
     * 获取 OSS 配置（小程序使用）
     * 返回公开的 OSS 配置信息，不包含敏感信息
     */
    @GetMapping("/oss")
    public ResponseEntity<ApiResponse<Map<String, String>>> getOssConfig() {
        try {
            List<SystemConfig> configs = systemConfigMapper.selectList(
                    new QueryWrapper<SystemConfig>()
                            .eq("group_name", "oss")
            );
            
            Map<String, String> ossConfig = new HashMap<>();
            
            for (SystemConfig config : configs) {
                // 不返回敏感信息
                if (config.getIsSensitive() != null && config.getIsSensitive()) {
                    continue;
                }
                ossConfig.put(config.getConfigKey(), config.getConfigValue());
            }
            
            log.info("小程序获取 OSS 配置");
            return ResponseEntity.ok(ApiResponse.success(ossConfig));
        } catch (Exception e) {
            log.error("获取 OSS 配置失败", e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error(500, "获取配置失败: " + e.getMessage()));
        }
    }
}
