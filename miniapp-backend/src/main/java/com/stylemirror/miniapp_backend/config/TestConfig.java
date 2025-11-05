package com.stylemirror.miniapp_backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * 测试配置类
 * 用于测试阶段，提供默认测试用户ID
 */
@Configuration
public class TestConfig {
    
    /**
     * 测试模式：是否启用测试模式（允许无认证访问）
     * 可通过环境变量 TEST_MODE=true 启用
     */
    @Value("${test.mode:true}")
    private boolean testMode;
    
    /**
     * 测试用户ID（测试模式下使用）
     */
    @Value("${test.user.id:1}")
    private Long testUserId;
    
    public boolean isTestMode() {
        return testMode;
    }
    
    public Long getTestUserId() {
        return testUserId;
    }
}

