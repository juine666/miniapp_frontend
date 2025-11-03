package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * 消息实体类
 */
@TableName("message")
@Getter
@Setter
public class Message {
    @TableId(type = IdType.AUTO)
    private Long id;

    private Long fromUser;
    private Long toUser;
    private String content;
    private Integer readFlag = 0; // 0-未读，1-已读
    private Instant createdAt = Instant.now();
}

