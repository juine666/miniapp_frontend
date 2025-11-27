package com.stylemirror.miniapp_backend.service;

/**
 * 文字转语音（TTS）服务接口
 */
public interface TTSService {
    /**
     * 合成语音
     * @param text 要转语音的文本
     * @param voice 声音类型（女声/男声）
     * @param language 语言（zh-CN/en-US）
     * @return 语音文件URL
     */
    String synthesizeVoice(String text, String voice, String language);
}
