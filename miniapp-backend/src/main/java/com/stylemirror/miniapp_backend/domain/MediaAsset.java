package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@TableName("media_assets")
@Getter
@Setter
public class MediaAsset {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String url;
    private String type; // image/video
    private Long sizeBytes;
    private Long ownerId;
    private Instant createdAt = Instant.now();
}


