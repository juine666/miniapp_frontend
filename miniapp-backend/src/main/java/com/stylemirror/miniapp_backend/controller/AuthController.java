package com.stylemirror.miniapp_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.service.SystemConfigService;
import com.stylemirror.miniapp_backend.service.UserService;
import com.stylemirror.miniapp_backend.security.JwtUtil;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 微信授权控制器
 * 处理微信小程序登录流程
 */
@RestController
@RequestMapping("/api/auth/wechat")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final SystemConfigService systemConfigService;

    // 从配置文件读取默认值
    @Value("${wechat.appid:}")
    private String appidProperty;
    
    @Value("${wechat.secret:}")
    private String secretProperty;
    
    @Value("${server.url:}")
    private String serverUrlProperty;

    /**
     * 微信登录
     * 1. 通过code换取openid和session_key
     * 2. 自动创建或更新用户信息（包含昵称和头像）
     * 3. 返回JWT token
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest req) {
        log.info("微信登录请求，code: {}", req.code());
        
        // 优先从数据库读取配置，没有则使用配置文件
        String appid = systemConfigService.getConfigValue("wechat.appid");
        String secret = systemConfigService.getConfigValue("wechat.secret");
        String serverUrl = systemConfigService.getConfigValue("server.url");
        
        // 如果数据库没有配置，使用配置文件的值
        if ((appid == null || appid.isEmpty()) && appidProperty != null && !appidProperty.isEmpty()) {
            appid = appidProperty;
        }
        if ((secret == null || secret.isEmpty()) && secretProperty != null && !secretProperty.isEmpty()) {
            secret = secretProperty;
        }
        if ((serverUrl == null || serverUrl.isEmpty()) && serverUrlProperty != null && !serverUrlProperty.isEmpty()) {
            serverUrl = serverUrlProperty;
        }
        
        // 检查配置
        if (appid == null || appid.isEmpty() || secret == null || secret.isEmpty()) {
            log.error("微信AppID或Secret未配置");
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "服务器配置错误：微信AppID或Secret未配置"));
        }
        
        String openid = null;
        
        // 检测是否为微信开发者工具的模拟环境（code以mock开头或为特定测试值）
        if (req.code().startsWith("mock") || "test_code_for_devtools".equals(req.code())) {
            // 开发者工具测试模式：使用固定的测试openid
            log.info("检测到开发者工具测试环境，使用测试模式");
            openid = "mock_openid_" + System.currentTimeMillis();
        } else {
            // 1. 通过code换取openid（生产环境）
            String url = "https://api.weixin.qq.com/sns/jscode2session?appid=" + appid + 
                         "&secret=" + secret + "&js_code=" + req.code() + "&grant_type=authorization_code";
            
            Map<?,?> resp = null;
            try {
                // 使用ResponseEntity接收字符串，然后手动解析JSON，避免Content-Type问题
                HttpHeaders headers = new HttpHeaders();
                headers.add("Accept", "application/json, text/plain, */*");
                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
                
                String responseBody = responseEntity.getBody();
                log.debug("微信API响应: {}", responseBody);
                
                if (responseBody != null && !responseBody.trim().isEmpty()) {
                    // 手动解析JSON字符串
                    try {
                        resp = objectMapper.readValue(responseBody, Map.class);
                    } catch (Exception parseEx) {
                        log.error("解析JSON失败，响应内容: {}", responseBody, parseEx);
                        // JSON解析失败，可能是微信返回了错误信息
                        throw new RuntimeException("微信API返回格式错误: " + responseBody, parseEx);
                    }
                }
            } catch (RestClientException e) {
                log.error("调用微信API失败", e);
                // 网络错误时，如果是开发者工具code，使用测试模式
                if (req.code().length() < 20) {
                    log.warn("网络错误且检测到可能是开发者工具的code，使用测试模式");
                    openid = "mock_openid_" + System.currentTimeMillis();
                    // 直接跳过后续检查，使用测试openid
                    resp = null; // 标记已处理
                } else {
                    return ResponseEntity.badRequest().body(ApiResponse.error(400, "网络错误，请稍后重试"));
                }
            } catch (Exception e) {
                log.error("解析微信API响应失败", e);
                // 解析错误时，如果是开发者工具code，使用测试模式
                if (req.code().length() < 20) {
                    log.warn("解析错误且检测到可能是开发者工具的code，使用测试模式");
                    openid = "mock_openid_" + System.currentTimeMillis();
                    // 直接跳过后续检查，使用测试openid
                    resp = null; // 标记已处理
                } else {
                    return ResponseEntity.badRequest().body(ApiResponse.error(400, "微信登录失败，请检查code是否有效: " + e.getMessage()));
                }
            }
            
            // 如果openid还未设置（说明没有进入异常处理的测试模式分支），检查响应
            if (openid == null) {
                if (resp == null || resp.get("openid") == null) {
                    log.error("微信登录失败，响应: {}", resp);
                    String errmsg = resp != null ? String.valueOf(resp.get("errmsg")) : "未知错误";
                    String errcode = resp != null ? String.valueOf(resp.get("errcode")) : "";
                    
                    // 如果是开发者工具的code，也允许通过（可能是网络问题导致的）
                    if (req.code().length() < 20) {
                        log.warn("检测到可能是开发者工具的code，使用测试模式");
                        openid = "mock_openid_" + System.currentTimeMillis();
                    } else {
                        return ResponseEntity.badRequest().body(ApiResponse.error(400, "微信登录失败: " + errmsg + (errcode != null && !errcode.equals("null") ? " (错误码:" + errcode + ")" : "")));
                    }
                } else {
                    openid = resp.get("openid").toString();
                }
            }
        }
        
        log.info("微信登录成功，OpenID: {}", openid);
        
        // 2. 查询或创建用户
        User user = userService.findByOpenid(openid).orElse(new User());
        user.setOpenid(openid);
        
        // 3. 如果传入了昵称和头像，则更新（首次登录或更新）
        if (req.nickname() != null && !req.nickname().trim().isEmpty()) {
            user.setNickname(req.nickname());
        }
        if (req.avatarUrl() != null && !req.avatarUrl().trim().isEmpty()) {
            user.setAvatarUrl(req.avatarUrl());
        }
        
        // 4. 如果是新用户且没有昵称，设置默认昵称
        if (user.getId() == null && (user.getNickname() == null || user.getNickname().trim().isEmpty())) {
            user.setNickname("微信用户" + openid.substring(openid.length() - 6));
        }
        
        // 5. 保存用户
        user = userService.save(user);
        log.info("用户信息已保存，ID: {}, 昵称: {}", user.getId(), user.getNickname());
        
        // 6. 生成JWT token
        Map<String, Object> claims = new HashMap<>();
        claims.put("openid", openid);
        claims.put("userId", user.getId());
        String token = jwtUtil.generateToken(openid, claims);
        
        // 7. 返回结果
        Map<String, Object> result = new HashMap<>();
        result.put("token", token);
        result.put("openid", openid);
        result.put("userId", user.getId());
        result.put("nickname", user.getNickname());
        result.put("avatarUrl", user.getAvatarUrl());
        // 添加服务器URL到返回结果中
        if (serverUrl != null && !serverUrl.isEmpty()) {
            result.put("serverUrl", serverUrl);
        }
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    public record LoginRequest(@NotBlank String code, String nickname, String avatarUrl) {}
}