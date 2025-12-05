package com.stylemirror.miniapp_backend.service;

/**
 * 内容过滤服务 - 屏蔽违禁词
 */
public interface ContentFilterService {
    
    /**
     * 检查内容是否包含违禁词
     * @param content 原始内容
     * @return true表示包含违禁词，false表示正常
     */
    boolean containsBannedWords(String content);
    
    /**
     * 过滤违禁词（用*替换）
     * @param content 原始内容
     * @return 过滤后的内容
     */
    String filterBannedWords(String content);
    
    /**
     * 获取所有违禁词列表
     */
    java.util.List<String> getBannedWordsList();
}
