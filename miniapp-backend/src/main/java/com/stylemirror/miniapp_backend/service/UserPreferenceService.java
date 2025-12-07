package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.UserPreference;
import com.stylemirror.miniapp_backend.mapper.UserPreferenceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserPreferenceService extends ServiceImpl<UserPreferenceMapper, UserPreference> {

    public List<UserPreference> listByUser(Long userId) {
        return list(new LambdaQueryWrapper<UserPreference>()
                .eq(UserPreference::getUserId, userId)
                .orderByDesc(UserPreference::getLastTriggeredAt));
    }

    public void recordPreference(Long userId, String key, String value, double confidence) {
        if (userId == null || key == null || value == null) {
            return;
        }

        LambdaQueryWrapper<UserPreference> wrapper = new LambdaQueryWrapper<UserPreference>()
                .eq(UserPreference::getUserId, userId)
                .eq(UserPreference::getPreferenceKey, key)
                .eq(UserPreference::getPreferenceValue, value);

        UserPreference existing = getOne(wrapper);
        if (existing != null) {
            existing.setConfidence(Math.min(1.0, Math.max(0.0, confidence)));
            existing.setLastTriggeredAt(LocalDateTime.now());
            updateById(existing);
            log.debug("更新用户偏好: userId={}, key={}, value={}", userId, key, value);
        } else {
            UserPreference preference = UserPreference.builder()
                    .userId(userId)
                    .preferenceKey(key)
                    .preferenceValue(value)
                    .confidence(Math.min(1.0, Math.max(0.0, confidence)))
                    .lastTriggeredAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            save(preference);
            log.debug("新增用户偏好: userId={}, key={}, value={}", userId, key, value);
        }
    }

    public String buildPreferenceSummary(Long userId) {
        List<UserPreference> preferences = listByUser(userId);
        if (preferences.isEmpty()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        builder.append("用户偏好：");
        for (int i = 0; i < preferences.size(); i++) {
            UserPreference pref = preferences.get(i);
            builder.append(i + 1).append(". ")
                    .append(pref.getPreferenceKey())
                    .append(": ")
                    .append(pref.getPreferenceValue());
            if (i < preferences.size() - 1) {
                builder.append("；");
            }
        }
        return builder.toString();
    }
}
