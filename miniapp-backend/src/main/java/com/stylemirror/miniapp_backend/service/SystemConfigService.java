package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.SystemConfig;
import com.stylemirror.miniapp_backend.mapper.SystemConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 系统配置 Service
 */
@Service
@Slf4j
public class SystemConfigService extends ServiceImpl<SystemConfigMapper, SystemConfig> {
    
    /**
     * 获取配置值
     */
    public String getConfigValue(String configKey) {
        SystemConfig config = getOne(new QueryWrapper<SystemConfig>()
                .eq("config_key", configKey));
        return config != null ? config.getConfigValue() : null;
    }
    
    /**
     * 获取指定分组的所有配置
     */
    public List<SystemConfig> getConfigByGroup(String groupName) {
        return list(new QueryWrapper<SystemConfig>()
                .eq("group_name", groupName)
                .orderByAsc("config_key"));
    }
    
    /**
     * 保存或更新配置
     */
    public void saveOrUpdateConfig(String configKey, String configValue, String description, 
                                   String groupName, Boolean isSensitive) {
        SystemConfig config = getOne(new QueryWrapper<SystemConfig>()
                .eq("config_key", configKey));
        
        if (config != null) {
            config.setConfigValue(configValue);
            config.setDescription(description);
            config.setGroupName(groupName);
            config.setIsSensitive(isSensitive);
            config.setUpdatedAt(LocalDateTime.now());
            updateById(config);
            log.info("更新系统配置: {}", configKey);
        } else {
            config = SystemConfig.builder()
                    .configKey(configKey)
                    .configValue(configValue)
                    .description(description)
                    .groupName(groupName)
                    .isSensitive(isSensitive)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            save(config);
            log.info("新增系统配置: {}", configKey);
        }
    }
}
