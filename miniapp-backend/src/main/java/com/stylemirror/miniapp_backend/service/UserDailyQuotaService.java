package com.stylemirror.miniapp_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.concurrent.TimeUnit;

/**
 * 用户每日配额 Service
 * 使用 Redis 缓存实现，每天零点自动重置
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class UserDailyQuotaService {
    
    private static final int MAX_CHARS_PER_DAY = 1000;
    private static final String QUOTA_KEY_PREFIX = "user:quota:";
    
    private final RedisTemplate<String, Object> redisTemplate;

    /**
     * 获取用户的配额 Redis Key
     */
    private String getQuotaKey(Long userId) {
        LocalDate today = LocalDate.now();
        return QUOTA_KEY_PREFIX + userId + ":" + today;
    }

    /**
     * 获取到今天零点的剩余秒数（用于Redis过期时间）
     */
    private long getSecondsUntilMidnight() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime midnight = LocalDateTime.of(LocalDate.now().plusDays(1), LocalTime.MIDNIGHT);
        return java.time.temporal.ChronoUnit.SECONDS.between(now, midnight);
    }

    /**
     * 检查用户今天的配额是否足够
     * @return 剩余字数，如果不足则返回-1
     */
    public int checkQuota(Long userId, int charsNeeded) {
        String key = getQuotaKey(userId);
        
        // 从Redis读取已使用字数
        Object usedObj = redisTemplate.opsForValue().get(key);
        int usedChars = usedObj != null ? Integer.parseInt(usedObj.toString()) : 0;
        
        int remainingChars = MAX_CHARS_PER_DAY - usedChars;
        
        if (remainingChars < charsNeeded) {
            log.warn("用户 {} 配额不足: 需要 {} 字，剩余 {} 字", userId, charsNeeded, remainingChars);
            return -1; // 表示配额不足
        }
        
        return remainingChars;
    }

    /**
     * 扣除用户配额（原子操作）
     */
    public void useQuota(Long userId, int chars) {
        String key = getQuotaKey(userId);
        
        // 使用 INCRBY 原子增加已使用字数
        Long newUsedChars = redisTemplate.opsForValue().increment(key, chars);
        
        // 如果是第一次使用，设置过期时间（到今天零点）
        if (newUsedChars != null && newUsedChars.equals((long) chars)) {
            redisTemplate.expire(key, getSecondsUntilMidnight(), TimeUnit.SECONDS);
            log.info("创建用户 {} 的每日配额记录", userId);
        }
        
        if (newUsedChars != null) {
            log.info("用户 {} 扣除配额 {} 字，已使用 {}/{} 字", 
                    userId, chars, newUsedChars, MAX_CHARS_PER_DAY);
        }
    }

    /**
     * 获取用户今天的配额使用情况
     */
    public QuotaInfo getTodayQuota(Long userId) {
        String key = getQuotaKey(userId);
        
        Object usedObj = redisTemplate.opsForValue().get(key);
        int usedChars = usedObj != null ? Integer.parseInt(usedObj.toString()) : 0;
        int remainingChars = MAX_CHARS_PER_DAY - usedChars;
        
        return QuotaInfo.builder()
                .userId(userId)
                .usedChars(usedChars)
                .remainingChars(remainingChars)
                .maxChars(MAX_CHARS_PER_DAY)
                .quotaDate(LocalDate.now().toString())
                .build();
    }

    /**
     * 配额信息对象
     */
    @lombok.Data
    @lombok.Builder
    public static class QuotaInfo {
        private Long userId;
        private int usedChars;
        private int remainingChars;
        private int maxChars;
        private String quotaDate;
    }
}
