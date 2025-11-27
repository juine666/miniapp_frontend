package com.stylemirror.miniapp_backend.service;

/**
 * 翻译服务接口
 */
public interface TranslationService {
    /**
     * 翻译文本（中文到英文）
     * @param text 要翻译的文本
     * @return 翻译结果
     */
    String translateToEnglish(String text);
}
