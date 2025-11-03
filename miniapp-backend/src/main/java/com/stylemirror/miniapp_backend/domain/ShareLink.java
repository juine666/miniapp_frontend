package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@TableName("share_links")
@Getter
@Setter
public class ShareLink {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String code;
    private Long productId;
    private Instant createdAt = Instant.now();
}


