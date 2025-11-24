package com.stylemirror.miniapp_backend.util;

import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.model.PutObjectRequest;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.stylemirror.miniapp_backend.domain.SystemConfig;
import com.stylemirror.miniapp_backend.mapper.SystemConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;

/**
 * OSS 文件上传工具类
 * 使用阿里云 OSS SDK 实现文件上传
 * 配置优先级：数据库 > 环境变量 > 默认值
 */
@Component
@Slf4j
public class OssUploadUtil {
    
    @Autowired(required = false)
    private SystemConfigMapper systemConfigMapper;
    
    @Value("${oss.endpoint:oss-cn-shenzhen.aliyuncs.com}")
    private String defaultEndpoint;
    
    @Value("${oss.accessKeyId:your_access_key_id}")
    private String defaultAccessKeyId;
    
    @Value("${oss.accessKeySecret:your_access_key_secret}")
    private String defaultAccessKeySecret;
    
    @Value("${oss.bucket:twoshop}")
    private String defaultBucket;
    
    @Value("${oss.publicBaseUrl:https://twoshop.oss-cn-shenzhen.aliyuncs.com}")
    private String defaultPublicBaseUrl;
    
    /**
     * 获取配置值，优先从数据库读取
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
     * 上传文件到 OSS
     * @param file 上传的文件
     * @return OSS 公网 URL
     */
    public String uploadFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return null;
        }
        
        // 从数据库或配置读取 OSS 凭证
        String endpoint = getConfig("oss.endpoint", defaultEndpoint);
        String accessKeyId = getConfig("oss.accessKeyId", defaultAccessKeyId);
        String accessKeySecret = getConfig("oss.accessKeySecret", defaultAccessKeySecret);
        String bucket = getConfig("oss.bucket", defaultBucket);
        String publicBaseUrl = getConfig("oss.publicBaseUrl", defaultPublicBaseUrl);
        
        // 生成文件名：时间戳_索引_随机数.jpg
        String filename = System.currentTimeMillis() + "_0_" + ((int)(Math.random() * 1000)) + ".jpg";
        
        // 生成路径：uploads/YYYY-MM-DD/filename
        String datePath = LocalDate.now().toString();
        String objectKey = "uploads/" + datePath + "/" + filename;
        
        OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);
        
        try {
            // 上传文件到 OSS
            InputStream inputStream = file.getInputStream();
            PutObjectRequest putObjectRequest = new PutObjectRequest(bucket, objectKey, inputStream);
            ossClient.putObject(putObjectRequest);
            
            log.info("文件已上传到 OSS: {}/{}", bucket, objectKey);
            
            // 返回 OSS 公网 URL
            String ossUrl = publicBaseUrl + "/" + objectKey;
            log.info("生成 OSS URL: {}", ossUrl);
            return ossUrl;
        } catch (Exception e) {
            log.error("文件上传到 OSS 失败: {}", objectKey, e);
            throw new IOException("OSS 上传失败: " + e.getMessage(), e);
        } finally {
            ossClient.shutdown();
        }
    }
}
