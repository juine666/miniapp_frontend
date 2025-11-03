package com.stylemirror.miniapp_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置
 * 确保 API 路径不会被当作静态资源处理
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 明确排除 API 路径，避免被当作静态资源处理
        // 静态资源只处理非 API 路径
        registry.addResourceHandler("/static/**", "/public/**", "/resources/**", "/META-INF/resources/**")
                .addResourceLocations("classpath:/static/", "classpath:/public/", "classpath:/resources/", "classpath:/META-INF/resources/");
    }
}

