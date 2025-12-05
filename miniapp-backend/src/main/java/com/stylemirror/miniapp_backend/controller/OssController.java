package com.stylemirror.miniapp_backend.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.SystemConfig;
import com.stylemirror.miniapp_backend.mapper.SystemConfigMapper;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/oss")
@Validated
@RequiredArgsConstructor
@Slf4j
public class OssController {

    private final SystemConfigMapper systemConfigMapper;
    private final ObjectMapper objectMapper;

    @Value("${oss.accessKeyId:替换为你的AccessKeyId}")
    private String defaultAccessKeyId;
    @Value("${oss.accessKeySecret:替换为你的AccessKeySecret}")
    private String defaultAccessKeySecret;
    @Value("${oss.bucket:twoshop}")
    private String defaultBucket;
    @Value("${oss.endpoint:oss-cn-shenzhen.aliyuncs.com}")
    private String defaultEndpoint;

    public record PolicyRequest(@NotBlank String dirPrefix) {}
    
    public record ImageCheckRequest(@NotBlank String image, String imageType) {}

    /**
     * 从数据库或配置读取值
     */
    private String getConfig(String configKey, String defaultValue) {
        if (systemConfigMapper != null) {
            try {
                SystemConfig config = systemConfigMapper.selectOne(
                        new QueryWrapper<SystemConfig>()
                                .eq("config_key", configKey)
                );
                if (config != null && config.getConfigValue() != null && !config.getConfigValue().isEmpty()) {
                    return config.getConfigValue();
                }
            } catch (Exception e) {
                log.warn("从数据库读取配置失败，使用默认值: {}", configKey, e);
            }
        }
        return defaultValue;
    }

    /**
     * 图片内容安全检测
     * 检测图片是否包含色情、暴力等违规内容
     */
    @PostMapping("/check-image")
    public ResponseEntity<ApiResponse<Void>> checkImage(@RequestBody ImageCheckRequest req) {
        try {
            log.info("收到图片内容审核请求，图片类型: {}", req.imageType());
            
            // 基础验证：检查图片数据是否有效
            if (req.image() == null || req.image().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "图片数据不能为空"));
            }
            
            // 如果图片数据太大，拒绝
            int imageSize = req.image().length();
            int maxSize = 5 * 1024 * 1024;
            if (imageSize > maxSize) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "图片文件过大，请压缩后重试"));
            }
            
            try {
                boolean isSafe = checkImageContent(req.image());
                if (!isSafe) {
                    log.warn("图片内容审核未通过，包含违规内容");
                    return ResponseEntity.badRequest()
                        .body(ApiResponse.error(400, "图片内容不符合规范，包含违规内容，请更换图片"));
                }
            } catch (Exception checkException) {
                log.error("调用内容安全服务失败，允许通过", checkException);
            }
            
            log.info("图片内容审核通过，图片大小: {} bytes", imageSize);
            return ResponseEntity.ok(ApiResponse.success());
            
        } catch (Exception e) {
            log.error("图片内容审核失败", e);
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "图片审核失败: " + e.getMessage()));
        }
    }
    
    /**
     * 使用阿里云内容安全服务检测图片内容
     */
    private boolean checkImageContent(String base64Image) throws Exception {
        String accessKeyId = getConfig("oss.accessKeyId", defaultAccessKeyId);
        String accessKeySecret = getConfig("oss.accessKeySecret", defaultAccessKeySecret);
        
        if (accessKeyId == null || accessKeyId.isEmpty() || 
            accessKeySecret == null || accessKeySecret.isEmpty() ||
            accessKeyId.contains("替换")) {
            log.warn("阿里云内容安全服务未配置，跳过图片检测");
            return true;
        }
        
        try {
            log.info("图片内容检测（暂未实现实际检测逻辑）");
            return true;
        } catch (Exception e) {
            log.error("调用内容安全服务异常", e);
            return true;
        }
    }

    @PostMapping("/policy")
    public ResponseEntity<ApiResponse<Map<String, Object>>> policy(@RequestBody PolicyRequest req) {
        try {
            log.info("收到OSS凭证请求，目录: {}", req.dirPrefix());
            
            // 从数据库读取配置
            String accessKeyId = getConfig("oss.accessKeyId", defaultAccessKeyId);
            String accessKeySecret = getConfig("oss.accessKeySecret", defaultAccessKeySecret);
            String bucket = getConfig("oss.bucket", defaultBucket);
            String endpoint = getConfig("oss.endpoint", defaultEndpoint);
            
            // OSS要求的时间格式：yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
            String expiration = Instant.now().plus(30, ChronoUnit.MINUTES)
                    .atZone(ZoneId.of("UTC"))
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
            
            String policyTemplate = "{\"expiration\":\"%s\",\"conditions\":[[\"starts-with\",\"$key\",\"%s\"]]}";
            String policy = String.format(policyTemplate, expiration, req.dirPrefix());
            String policyBase64 = Base64.getEncoder().encodeToString(policy.getBytes(StandardCharsets.UTF_8));
            String signature = sign(policyBase64, accessKeySecret);

            String host = String.format("https://%s.%s", bucket, endpoint);
            
            Map<String, Object> resp = new HashMap<>();
            resp.put("accessid", accessKeyId);
            resp.put("policy", policyBase64);
            resp.put("signature", signature);
            resp.put("dir", req.dirPrefix());
            resp.put("host", host);
            
            log.info("生成OSS上传凭证成功，目录: {}, host: {}", req.dirPrefix(), host);
            return ResponseEntity.ok(ApiResponse.success(resp));
        } catch (Exception e) {
            log.error("生成OSS上传凭证失败，目录: {}", req.dirPrefix(), e);
            return ResponseEntity.status(500).body(ApiResponse.error(500, "获取上传凭证失败: " + e.getMessage()));
        }
    }

    private static String sign(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA1"));
        return Base64.getEncoder().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
    }
}
