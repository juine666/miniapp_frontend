package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    // Placeholder: in production, prefer OSS/COS direct upload with signed URL
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(MultipartFile file) {
        // TODO: store locally or to object storage and return URL
        return ResponseEntity.ok(ApiResponse.success(Map.of("url", "/placeholder/path/" + file.getOriginalFilename())));
    }
}


