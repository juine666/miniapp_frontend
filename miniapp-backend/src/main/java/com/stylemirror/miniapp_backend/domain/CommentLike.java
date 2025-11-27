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
 * 评论点赞表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("comment_likes")
public class CommentLike {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /** 评论ID */
    private Long commentId;
    
    /** 用户ID */
    private Long userId;
    
    /** 创建时间 */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
