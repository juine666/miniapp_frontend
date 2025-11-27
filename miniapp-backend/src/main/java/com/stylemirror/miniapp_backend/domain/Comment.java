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
import java.util.List;

/**
 * 评论表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("comments")
public class Comment {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /** 产品ID */
    private Long productId;
    
    /** 用户ID */
    private Long userId;
    
    /** 父评论ID (NULL表示一级评论) */
    private Long parentId;
    
    /** 评论内容 */
    private String content;
    
    /** 表情类型 (如: 😀 😂 😍 等) */
    private String emotion;
    
    /** 点赞数 */
    private Integer likes;
    
    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
    
    /** 更新时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
    
    // 以下字段不映射到数据库，用于响应时展示额外信息
    
    /** 用户信息（响应时使用） */
    private transient User user;
    
    /** 二级回复列表（响应时使用） */
    private transient List<Comment> replies;
    
    /** 当前用户是否已点赞（响应时使用） */
    private transient Boolean isLiked;
}
