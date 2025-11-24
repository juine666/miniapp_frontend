package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 系统配置表
 * 用于存储 OSS、邮件、短信等系统级配置
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("system_config")
public class SystemConfig {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /** 配置键（如：oss.endpoint、oss.accessKeyId） */
    private String configKey;
    
    /** 配置值 */
    private String configValue;
    
    /** 配置描述 */
    private String description;
    
    /** 配置分组（oss、email、sms 等） */
    private String groupName;
    
    /** 是否敏感信息（如密钥、密码等，显示时需隐藏） */
    private Boolean isSensitive;
    
    /** 创建时间 */
    private LocalDateTime createdAt;
    
    /** 更新时间 */
    private LocalDateTime updatedAt;
}
