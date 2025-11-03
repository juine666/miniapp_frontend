package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * 收藏实体类
 */
@TableName("favorite")
@Getter
@Setter
public class Favorite {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;
    private Long productId;
    private Instant createdAt = Instant.now();
}

