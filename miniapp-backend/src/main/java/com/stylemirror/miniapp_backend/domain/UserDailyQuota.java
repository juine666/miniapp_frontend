package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 用户每日配额
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("user_daily_quota")
public class UserDailyQuota {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private LocalDate quotaDate;
    
    private Integer usedChars;
    
    private Integer maxChars;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
