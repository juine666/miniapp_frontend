package com.stylemirror.miniapp_backend.service;

/**
 * TTS服务接口
 */
public interface TTSService {
    /**
     * 文字转语音
     * @param text 文本内容
     * @param voice 语音类型 (male/female)
     * @param language 语言 (zh-CN/en-US)
     * @return 音频Base64编码或URL
     */
    String synthesizeVoice(String text, String voice, String language);
}
