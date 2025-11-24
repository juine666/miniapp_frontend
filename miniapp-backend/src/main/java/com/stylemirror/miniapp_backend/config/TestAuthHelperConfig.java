package com.stylemirror.miniapp_backend.config;

import com.stylemirror.miniapp_backend.common.TestAuthHelper;
import com.stylemirror.miniapp_backend.service.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * TestAuthHelper Bean 配置
 */
@Configuration
public class TestAuthHelperConfig {
    
    @Bean
    public TestAuthHelper testAuthHelper(TestConfig testConfig, UserService userService) {
        return new TestAuthHelper(testConfig, userService);
    }
}
