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
     * 获取微信配置
     */
    @GetMapping("/config/wechat")
    public ApiResponse<Map<String, String>> getWechatConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("appid", systemConfigService.getConfigValue("wechat.appid"));
        config.put("secret", systemConfigService.getConfigValue("wechat.secret"));
        return ApiResponse.success(config);
    }

    /**
     * 保存微信配置
     */
    @PostMapping("/config/wechat")
    public ApiResponse<Void> saveWechatConfig(@RequestBody WechatConfigRequest request) {
        systemConfigService.saveOrUpdateConfig("wechat.appid", request.getAppid(), 
            "微信小程序 AppID（敏感信息）", "wechat", true);
        systemConfigService.saveOrUpdateConfig("wechat.secret", request.getSecret(), 
            "微信小程序 Secret（敏感信息）", "wechat", true);
        return ApiResponse.success(null);
    }

    /**
     * 获取服务器配置
     */
    @GetMapping("/config/server")
    public ApiResponse<Map<String, String>> getServerConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("url", systemConfigService.getConfigValue("server.url"));
        return ApiResponse.success(config);
    }

    /**
     * 保存服务器配置
     */
    @PostMapping("/config/server")
    public ApiResponse<Void> saveServerConfig(@RequestBody ServerConfigRequest request) {
        systemConfigService.saveOrUpdateConfig("server.url", request.getUrl(), 
            "后端服务器URL", "server", false);
        return ApiResponse.success(null);
    }

    /**
     * 获取OSS配置
     */
    @GetMapping("/config/oss")
    public ApiResponse<Map<String, String>> getOssConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("endpoint", systemConfigService.getConfigValue("oss.endpoint"));
        config.put("bucket", systemConfigService.getConfigValue("oss.bucket"));
        config.put("accessKeyId", systemConfigService.getConfigValue("oss.accessKeyId"));
        config.put("accessKeySecret", systemConfigService.getConfigValue("oss.accessKeySecret"));
        config.put("publicBaseUrl", systemConfigService.getConfigValue("oss.publicBaseUrl"));
        return ApiResponse.success(config);
    }

    /**
     * 保存OSS配置
     */
    @PostMapping("/config/oss")
    public ApiResponse<Void> saveOssConfig(@RequestBody OssConfigRequest request) {
        systemConfigService.saveOrUpdateConfig("oss.endpoint", request.getEndpoint(), 
            "OSS 服务地址", "oss", false);
        systemConfigService.saveOrUpdateConfig("oss.bucket", request.getBucket(), 
            "OSS 存储桶名称", "oss", false);
        systemConfigService.saveOrUpdateConfig("oss.accessKeyId", request.getAccessKeyId(), 
            "OSS 访问密钥ID（敏感信息）", "oss", true);
        systemConfigService.saveOrUpdateConfig("oss.accessKeySecret", request.getAccessKeySecret(), 
            "OSS 访问密钥Secret（敏感信息）", "oss", true);
        systemConfigService.saveOrUpdateConfig("oss.publicBaseUrl", request.getPublicBaseUrl(), 
            "OSS 公网访问地址", "oss", false);
        return ApiResponse.success(null);
    }

    /**
     * 微信配置请求体
     */
    public static class WechatConfigRequest {
        private String appid;
        private String secret;

        // Getters and Setters
        public String getAppid() {
            return appid;
        }

        public void setAppid(String appid) {
            this.appid = appid;
        }

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }
    }

    /**
     * 服务器配置请求体
     */
    public static class ServerConfigRequest {
        private String url;

        // Getters and Setters
        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }
    }

    /**
     * OSS配置请求体
     */
    public static class OssConfigRequest {
        private String endpoint;
        private String bucket;
        private String accessKeyId;
        private String accessKeySecret;
        private String publicBaseUrl;

        // Getters and Setters
        public String getEndpoint() {
            return endpoint;
        }

        public void setEndpoint(String endpoint) {
            this.endpoint = endpoint;
        }

        public String getBucket() {
            return bucket;
        }

        public void setBucket(String bucket) {
            this.bucket = bucket;
        }

        public String getAccessKeyId() {
            return accessKeyId;
        }

        public void setAccessKeyId(String accessKeyId) {
            this.accessKeyId = accessKeyId;
        }

        public String getAccessKeySecret() {
            return accessKeySecret;
        }

        public void setAccessKeySecret(String accessKeySecret) {
            this.accessKeySecret = accessKeySecret;
        }

        public String getPublicBaseUrl() {
            return publicBaseUrl;
        }

        public void setPublicBaseUrl(String publicBaseUrl) {
            this.publicBaseUrl = publicBaseUrl;
        }
    }
}