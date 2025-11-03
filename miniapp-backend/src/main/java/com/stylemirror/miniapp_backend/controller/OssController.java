package com.stylemirror.miniapp_backend.controller;

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

    public record PolicyRequest(@NotBlank String dirPrefix) {}

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


