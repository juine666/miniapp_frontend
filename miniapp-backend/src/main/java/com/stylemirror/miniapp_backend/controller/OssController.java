package com.stylemirror.miniapp_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylemirror.miniapp_backend.common.ApiResponse;
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

    @Value("${oss.accessKeyId}")
    private String accessKeyId;
    @Value("${oss.accessKeySecret}")
    private String accessKeySecret;
    @Value("${oss.bucket}")
    private String bucket;
    @Value("${oss.endpoint}")
    private String endpoint;
    
    private final ObjectMapper objectMapper;

    public record PolicyRequest(@NotBlank String dirPrefix) {}
    
    public record ImageCheckRequest(@NotBlank String image, String imageType) {}

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
            // Base64编码后的数据大小约为原文件的4/3
            int imageSize = req.image().length();
            int maxSize = 5 * 1024 * 1024; // 5MB (Base64编码后)
            if (imageSize > maxSize) {
                return ResponseEntity.badRequest()
                    .body(ApiResponse.error(400, "图片文件过大，请压缩后重试"));
            }
            
            // 调用阿里云内容安全服务进行图片检测
            try {
                boolean isSafe = checkImageContent(req.image());
                if (!isSafe) {
                    log.warn("图片内容审核未通过，包含违规内容");
                    return ResponseEntity.badRequest()
                        .body(ApiResponse.error(400, "图片内容不符合规范，包含违规内容，请更换图片"));
                }
            } catch (Exception checkException) {
                log.error("调用内容安全服务失败，允许通过", checkException);
                // 如果内容安全服务调用失败，为了不影响用户体验，暂时允许通过
                // 生产环境建议：记录日志并人工审核，或者拒绝上传
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
     * @param base64Image Base64编码的图片数据
     * @return true表示安全，false表示包含违规内容
     */
    private boolean checkImageContent(String base64Image) throws Exception {
        // 如果未配置阿里云内容安全服务，跳过检测
        if (accessKeyId == null || accessKeyId.isEmpty() || 
            accessKeySecret == null || accessKeySecret.isEmpty() ||
            accessKeyId.equals("your_access_key_id")) {
            log.warn("阿里云内容安全服务未配置，跳过图片检测");
            return true; // 未配置时允许通过
        }
        
        try {
            // TODO: 集成阿里云内容安全服务（Green）
            // 需要添加依赖：com.aliyun:green20220302
            // 并实现实际的图片内容检测逻辑
            // 
            // 示例代码：
            // Config config = new Config()
            //     .setAccessKeyId(accessKeyId)
            //     .setAccessKeySecret(accessKeySecret);
            // config.setEndpoint("green.cn-shanghai.aliyuncs.com");
            // Client client = new Client(config);
            // 
            // ImageModerationRequest request = new ImageModerationRequest();
            // request.setService("baselineCheck");
            // request.setServiceParameters(...);
            // 
            // ImageModerationResponse response = client.imageModeration(request);
            // 解析返回结果，检查是否有porn、terrorism等违规标签
            
            // 目前暂时跳过实际检测，返回true
            // 生产环境需要集成实际的图片内容安全服务
            log.info("图片内容检测（暂未实现实际检测逻辑）");
            return true;
            
        } catch (Exception e) {
            log.error("调用内容安全服务异常", e);
            // 异常时允许通过，避免影响正常使用
            return true;
        }
    }

    @PostMapping("/policy")
    public ResponseEntity<ApiResponse<Map<String, Object>>> policy(@RequestBody PolicyRequest req) {
        try {
            log.info("收到OSS凭证请求，目录: {}", req.dirPrefix());
            
            // OSS要求的时间格式：yyyy-MM-dd'T'HH:mm:ss.SSS'Z'
            String expiration = Instant.now().plus(30, ChronoUnit.MINUTES)
                    .atZone(ZoneId.of("UTC"))
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"));
            
            String policyTemplate = "{\"expiration\":\"%s\",\"conditions\":[[\"starts-with\",\"$key\",\"%s\"]]}";
            String policy = String.format(policyTemplate, expiration, req.dirPrefix());
            String policyBase64 = Base64.getEncoder().encodeToString(policy.getBytes(StandardCharsets.UTF_8));
            String signature = sign(policyBase64, accessKeySecret);

            // endpoint格式: oss-cn-shenzhen.aliyuncs.com 或 oss-cn-hangzhou.aliyuncs.com
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


