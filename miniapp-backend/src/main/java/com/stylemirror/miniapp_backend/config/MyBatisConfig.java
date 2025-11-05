package com.stylemirror.miniapp_backend.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

/**
 * MyBatis配置类
 * 确保MyBatis正确初始化
 */
@Configuration
@MapperScan("com.stylemirror.miniapp_backend.repository")
public class MyBatisConfig {
    // 配置通过@MapperScan注解完成
}

