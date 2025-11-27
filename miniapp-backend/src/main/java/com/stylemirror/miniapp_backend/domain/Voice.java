package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 语音表（语音评论/体验分享）
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("voices")
public class Voice {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /** 产品ID */
    private Long productId;
    
    /** 用户ID */
    private Long userId;
    
    /** 语音文件地址（OSS URL） */
    private String voiceUrl;
    
    /** 识别的中文文本 */
    private String originalText;
    
    /** 翻译的英文文本 */
    private String translatedText;
    
    /** 英文TTS音频地址（英文朗读） */
    private String ttsUrl;
    
    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    // 以下字段不映射到数据库，用于响应时展示额外信息
    
    /** 用户信息（响应时使用） */
    private transient User user;
}
