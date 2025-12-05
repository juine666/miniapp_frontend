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
 * 违禁词实体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@TableName("banned_words")
public class BannedWord {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 违禁词
     */
    private String word;
    
    /**
     * 分类：政治, 暴力, 色情, 广告, 其他
     */
    private String category;
    
    /**
     * 严重级别：LOW, MEDIUM, HIGH
     */
    private String severity;
    
    /**
     * 是否启用
     */
    private Boolean isActive;
    
    /**
     * 备注
     */
    private String remark;
    
    /**
     * 创建人ID
     */
    private Long createdBy;
    
    /**
     * 创建时间
     */
    private LocalDateTime createdAt;
    
    /**
     * 修改人ID
     */
    private Long updatedBy;
    
    /**
     * 修改时间
     */
    private LocalDateTime updatedAt;
}
