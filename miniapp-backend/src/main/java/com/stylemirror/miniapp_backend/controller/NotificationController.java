package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/notify")
public class NotificationController {

    // WeChat payment callback placeholder (JSAPI). Ensure to verify signature in production.
    @PostMapping("/wechat/pay")
    public ResponseEntity<ApiResponse<Void>> wechatPayNotify(@RequestBody Map<String, Object> payload) {
        // TODO: verify signature, update order status idempotently, log payload
        return ResponseEntity.ok(ApiResponse.success());
    }
}


