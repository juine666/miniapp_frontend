package com.stylemirror.miniapp_backend.common;

import com.stylemirror.miniapp_backend.config.TestConfig;
import com.stylemirror.miniapp_backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;

/**
 * 测试认证辅助类
 * 在测试模式下，当没有认证信息时返回测试用户ID
 */
@RequiredArgsConstructor
public class TestAuthHelper {
    private final TestConfig testConfig;
    private final UserService userService;
    
    /**
     * 获取用户ID（测试模式下支持无认证访问）
     */
    public Long getUserId(Authentication auth) {
        // 测试模式：如果auth为null，返回测试用户ID
        if (testConfig.isTestMode() && auth == null) {
            Long testUserId = testConfig.getTestUserId();
            log.warn("测试模式：未提供认证信息，使用测试用户ID: {}", testUserId);
            // 验证测试用户是否存在，如果不存在则创建
            return userService.findById(testUserId)
                    .map(u -> u.getId())
                    .orElseGet(() -> {
                        log.warn("测试用户ID {} 不存在，返回该ID（可能需要在数据库中创建该用户）", testUserId);
                        return testUserId;
                    });
        }
        
        // 正常模式：必须有认证信息
        if (auth == null) {
            throw new IllegalArgumentException("请先登录");
        }
        
        return userService.findByOpenid(auth.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));
    }
    
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TestAuthHelper.class);
}

