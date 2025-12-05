package com.stylemirror.miniapp_backend.service.impl;

import com.stylemirror.miniapp_backend.repository.BannedWordMapper;
import com.stylemirror.miniapp_backend.service.ContentFilterService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 内容过滤服务实现 - 从数据库加载违禁词
 */
@Slf4j
@Service
public class ContentFilterServiceImpl implements ContentFilterService {
    
    private final BannedWordMapper bannedWordMapper;
    
    // 缓存违禁词列表
    private List<String> cachedBannedWords = new ArrayList<>();
    
    // 最后刷新时间
    private long lastRefreshTime = 0;
    
    // 刷新间隔（5分钟）
    private static final long REFRESH_INTERVAL = 5 * 60 * 1000;
    
    public ContentFilterServiceImpl(BannedWordMapper bannedWordMapper) {
        this.bannedWordMapper = bannedWordMapper;
        // 初始化加载
        refreshBannedWords();
    }
    
    /**
     * 从数据库刷新违禁词列表
     */
    private synchronized void refreshBannedWords() {
        long now = System.currentTimeMillis();
        if (now - lastRefreshTime > REFRESH_INTERVAL) {
            try {
                cachedBannedWords = bannedWordMapper.selectActiveBannedWords();
                lastRefreshTime = now;
                log.info("违禁词列表已刷新，共 {} 个词", cachedBannedWords.size());
            } catch (Exception e) {
                log.error("刷新违禁词列表失败", e);
            }
        }
    }
    
    @Override
    public boolean containsBannedWords(String content) {
        if (content == null || content.isEmpty()) {
            return false;
        }
        
        refreshBannedWords();
        
        for (String word : cachedBannedWords) {
            if (content.contains(word)) {
                log.warn("检测到违禁词: {}", word);
                return true;
            }
        }
        return false;
    }
    
    @Override
    public String filterBannedWords(String content) {
        if (content == null || content.isEmpty()) {
            return content;
        }
        
        refreshBannedWords();
        
        String filtered = content;
        for (String word : cachedBannedWords) {
            // 用*号替换（长度与原词相同）
            String replacement = "*".repeat(word.length());
            filtered = filtered.replace(word, replacement);
        }
        
        return filtered;
    }
    
    @Override
    public List<String> getBannedWordsList() {
        refreshBannedWords();
        return new ArrayList<>(cachedBannedWords);
    }
}
