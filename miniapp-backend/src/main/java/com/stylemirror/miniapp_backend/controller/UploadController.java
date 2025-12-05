package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@Slf4j
public class UploadController {

    @Value("${upload.path:./uploads}")
    private String uploadPath;

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> upload(MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.ok(ApiResponse.error(400, "文件不能为空"));
            }

            // 创建上传目录
            String datePath = LocalDate.now().toString();
            String uploadDir = uploadPath + File.separator + datePath;
            Path dirPath = Paths.get(uploadDir);
            Files.createDirectories(dirPath);

            // 生成文件名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
            String filename = UUID.randomUUID() + extension;

            // 保存文件
            Path filePath = dirPath.resolve(filename);
            file.transferTo(filePath.toFile());

            // 返回访问URL
            String fileUrl = "/api/upload/" + datePath + "/" + filename;
            log.info("文件已上传: {}", fileUrl);

            return ResponseEntity.ok(ApiResponse.success(Map.of("url", fileUrl)));
        } catch (IOException e) {
            log.error("文件上传失败", e);
            return ResponseEntity.ok(ApiResponse.error(500, "文件上传失败: " + e.getMessage()));
        }
    }

    /**
     * 提供访问已上传文件的GET接口
     */
    @GetMapping("/{date}/{filename}")
    public ResponseEntity<Resource> getFile(@PathVariable String date, @PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadPath, date, filename);
            File file = filePath.toFile();
            
            if (!file.exists()) {
                log.warn("文件不存在: {}", filePath);
                return ResponseEntity.notFound().build();
            }
            
            log.info("访问文件: {}", filePath);
            FileSystemResource resource = new FileSystemResource(file);
            return ResponseEntity.ok(resource);
        } catch (Exception e) {
            log.error("文件访问失败", e);
            return ResponseEntity.notFound().build();
        }
    }
}
