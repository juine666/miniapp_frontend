package com.stylemirror.miniapp_backend.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

/**
 * Redis配置类
 */
@Configuration
public class RedisConfig {

    /**
     * 创建支持Java 8时间类型的ObjectMapper（专门用于Redis序列化）
     */
    @Bean(name = "redisObjectMapper")
    public ObjectMapper redisObjectMapper() {
        ObjectMapper objectMapper = new ObjectMapper();
        // 注册JavaTimeModule以支持Java 8时间类型（Instant, LocalDateTime等）
        objectMapper.registerModule(new JavaTimeModule());
        // 禁用将日期写为时间戳，使用ISO-8601格式
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        // 禁用失败时抛出异常，提高兼容性
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        return objectMapper;
    }

    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory connectionFactory) {
        // 直接创建ObjectMapper，避免Bean冲突
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Key使用String序列化器
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        
        // Value使用JSON序列化器（支持存储对象）
        // 使用配置好的ObjectMapper创建序列化器
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer(objectMapper);
        template.setValueSerializer(jsonSerializer);
        template.setHashValueSerializer(jsonSerializer);
        
        template.afterPropertiesSet();
        return template;
    }
}