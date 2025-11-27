package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.stylemirror.miniapp_backend.domain.Voice;

/**
 * 语音服务接口
 */
public interface VoiceService extends IService<Voice> {
    
    /**
     * 上传语音
     */
    Voice uploadVoice(Voice voice, Long userId);
    
    /**
     * 获取产品的所有语音（分页）
     */
    Page<Voice> getProductVoices(Long productId, Integer pageNum, Integer pageSize);
    
    /**
     * 删除语音（仅本人或管理员可删除）
     */
    boolean deleteVoice(Long voiceId, Long userId, Boolean isAdmin);
}
