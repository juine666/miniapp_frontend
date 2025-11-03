package com.stylemirror.miniapp_backend.controller.admin;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.security.JwtUtil;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/auth")
@Validated
public class AdminAuthController {

    private final JwtUtil jwtUtil;
    @Value("${admin.defaultUsername}")
    private String defaultUsername;
    @Value("${admin.defaultPassword}")
    private String defaultPassword;

    public AdminAuthController(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {}

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@RequestBody LoginRequest req) {
        if (!req.username().equals(defaultUsername) || !req.password().equals(defaultPassword)) {
            return ResponseEntity.status(401).body(ApiResponse.error(401, "用户名或密码错误"));
        }
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", "ADMIN");
        String subject = "admin:" + req.username();
        String token = jwtUtil.generateToken(subject, claims);
        return ResponseEntity.ok(ApiResponse.success(Map.of("token", token)));
    }
}



