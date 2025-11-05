package com.stylemirror.miniapp_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 缓存服务类
 * 提供通用的缓存操作方法
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CacheService {
    private final RedisTemplate<String, Object> redisTemplate;

    // 缓存前缀
    private static final String USER_PREFIX = "user:";
    private static final String PRODUCT_PREFIX = "product:";
    private static final String USER_OPENID_PREFIX = "user:openid:";

    // 默认过期时间（秒）
    private static final long DEFAULT_EXPIRE_TIME = 3600; // 1小时

    /**
     * 用户缓存Key
     */
    public String getUserKey(Long userId) {
        return USER_PREFIX + userId;
    }

    /**
     * 用户OpenID缓存Key
     */
    public String getUserOpenidKey(String openid) {
        return USER_OPENID_PREFIX + openid;
    }

    /**
     * 商品缓存Key
     */
    public String getProductKey(Long productId) {
        return PRODUCT_PREFIX + productId;
    }

    /**
     * 设置缓存
     */
    public void set(String key, Object value) {
        set(key, value, DEFAULT_EXPIRE_TIME);
    }

    /**
     * 设置缓存（带过期时间）
     */
    public void set(String key, Object value, long expireSeconds) {
        try {
            redisTemplate.opsForValue().set(key, value, expireSeconds, TimeUnit.SECONDS);
            log.debug("设置缓存: key={}, expire={}秒", key, expireSeconds);
        } catch (Exception e) {
            log.error("设置缓存失败: key={}", key, e);
        }
    }

    /**
     * 获取缓存
     */
    public <T> T get(String key, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                log.debug("缓存命中: key={}", key);
                return clazz.cast(value);
            }
            log.debug("缓存未命中: key={}", key);
            return null;
        } catch (Exception e) {
            log.error("获取缓存失败: key={}", key, e);
            return null;
        }
    }

    /**
     * 删除缓存
     */
    public void delete(String key) {
        try {
            redisTemplate.delete(key);
            log.debug("删除缓存: key={}", key);
        } catch (Exception e) {
            log.error("删除缓存失败: key={}", key, e);
        }
    }

    /**
     * 批量删除缓存（根据前缀）
     */
    public void deleteByPattern(String pattern) {
        try {
            redisTemplate.delete(redisTemplate.keys(pattern));
            log.debug("批量删除缓存: pattern={}", pattern);
        } catch (Exception e) {
            log.error("批量删除缓存失败: pattern={}", pattern, e);
        }
    }

    /**
     * 判断缓存是否存在
     */
    public boolean exists(String key) {
        try {
            Boolean result = redisTemplate.hasKey(key);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("检查缓存是否存在失败: key={}", key, e);
            return false;
        }
    }

    /**
     * 刷新缓存过期时间
     */
    public void refreshExpire(String key) {
        refreshExpire(key, DEFAULT_EXPIRE_TIME);
    }

    /**
     * 刷新缓存过期时间（指定时间）
     */
    public void refreshExpire(String key, long expireSeconds) {
        try {
            redisTemplate.expire(key, expireSeconds, TimeUnit.SECONDS);
            log.debug("刷新缓存过期时间: key={}, expire={}秒", key, expireSeconds);
        } catch (Exception e) {
            log.error("刷新缓存过期时间失败: key={}", key, e);
        }
    }
}

