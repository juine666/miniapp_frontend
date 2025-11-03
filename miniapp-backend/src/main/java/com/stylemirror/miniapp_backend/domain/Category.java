package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Getter;
import lombok.Setter;

@TableName("categories")
@Getter
@Setter
public class Category {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String description;
}


