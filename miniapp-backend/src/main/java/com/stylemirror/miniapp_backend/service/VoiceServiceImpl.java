package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.domain.Voice;
import com.stylemirror.miniapp_backend.repository.VoiceMapper;
import com.stylemirror.miniapp_backend.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 语音服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VoiceServiceImpl extends ServiceImpl<VoiceMapper, Voice> implements VoiceService {
    
    private final VoiceMapper voiceMapper;
    private final UserMapper userMapper;
    private final AliyunVoiceService aliyunVoiceService;
    
    @Override
    public Voice uploadVoice(Voice voice, Long userId) {
        voice.setUserId(userId);
        voice.setCreatedAt(LocalDateTime.now());
        
        // 调用阿里云语音处理服务
        // 1. 语音识别 (ASR)
        // 2. 中英翻译
        // 3. 英文TTS合成
        
        if (voice.getVoiceUrl() != null && !voice.getVoiceUrl().isEmpty()) {
            try {
                AliyunVoiceService.VoiceProcessResult result = aliyunVoiceService.processVoice(voice.getVoiceUrl());
                if (result.isSuccess()) {
                    voice.setOriginalText(result.getOriginalText());
                    voice.setTranslatedText(result.getTranslatedText());
                    voice.setTtsUrl(result.getTtsUrl());
                    log.info("语音处理成功 - 原文: {}, 翻译: {}", result.getOriginalText(), result.getTranslatedText());
                } else {
                    log.warn("语音处理失败: {}", result.getErrorMessage());
                    // 处理失败也不阻止存储，但不设置第2、㉣3个字段
                }
            } catch (Exception e) {
                log.error("语音处理业务异常: ", e);
                // 错误不阻止存储
            }
        }
        
        this.save(voice);
        
        // 获取用户信息
        User user = userMapper.selectById(userId);
        voice.setUser(user);
        
        return voice;
    }
    
    @Override
    public Page<Voice> getProductVoices(Long productId, Integer pageNum, Integer pageSize) {
        Page<Voice> page = new Page<>(pageNum, pageSize);
        
        // 获取语音列表（按时间倒序）
        Page<Voice> result = voiceMapper.selectVoicesByProductId(page, productId);
        
        // 为每个语音添加用户信息
        result.getRecords().forEach(voice -> {
            User user = userMapper.selectById(voice.getUserId());
            voice.setUser(user);
        });
        
        return result;
    }
    
    @Override
    public boolean deleteVoice(Long voiceId, Long userId, Boolean isAdmin) {
        Voice voice = this.getById(voiceId);
        if (voice == null) {
            return false;
        }
        
        // 只有发布者本人或管理员才能删除
        if (!voice.getUserId().equals(userId) && !isAdmin) {
            return false;
        }
        
        return this.removeById(voiceId);
    }
}
