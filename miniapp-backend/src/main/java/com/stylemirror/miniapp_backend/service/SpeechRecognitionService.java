package com.stylemirror.miniapp_backend.service;

public interface SpeechRecognitionService {

    /**
     * 语音转文字
     * @param audioData 音频字节
     * @param format    音频格式（如 wav/mp3）
     * @param language  语言（如 zh-CN/en-US）
     * @return 转写结果，可能为空
     */
    String transcribe(byte[] audioData, String format, String language);
}
