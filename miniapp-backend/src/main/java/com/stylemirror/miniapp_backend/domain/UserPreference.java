package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("user_preference")
public class UserPreference {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String preferenceKey;
    private String preferenceValue;
    private Double confidence;
    private LocalDateTime lastTriggeredAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
