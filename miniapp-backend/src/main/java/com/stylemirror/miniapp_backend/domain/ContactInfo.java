package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

@TableName("contact_info")
@Getter
@Setter
public class ContactInfo {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String phone;
    private String wechatId;
    private String email;
}


