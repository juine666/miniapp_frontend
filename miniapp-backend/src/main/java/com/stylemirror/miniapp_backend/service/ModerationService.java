package com.stylemirror.miniapp_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * 内容审核服务
 * 负责敏感词过滤和内容审核
 */
@Service
@Slf4j
public class ModerationService {
    // 敏感词列表（可根据需要扩展）
    private static final Set<String> SENSITIVE_WORDS = new HashSet<>(Arrays.asList(
            // 色情相关
            "色情", "黄色", "成人", "性爱", "做爱", "性交", "性服务", "约炮", "一夜情",
            // 赌博相关
            "赌博", "赌场", "博彩", "彩票", "投注", "下注", "赌钱", "赌球", "赌马",
            // 毒品相关
            "毒品", "吸毒", "大麻", "冰毒", "海洛因", "摇头丸", "K粉", "可卡因",
            // 政治敏感
            "涉政", "政治", "政府", "领导人", "国家机密",
            // 暴力相关
            "杀人", "暴力", "恐怖", "爆炸", "武器", "枪支", "炸弹",
            // 诈骗相关
            "诈骗", "骗钱", "假货", "假冒", "刷单", "刷信誉",
            // 其他违规
            "代孕", "代考", "作弊", "黑客", "病毒", "木马"
    ));

    // 特殊字符变体映射（用于绕过检测）
    private static final Map<String, String> VARIANT_MAP = new HashMap<>();
    
    static {
        // 初始化变体映射（如：色情 -> 色*情、色-情等）
        VARIANT_MAP.put("*", "");
        VARIANT_MAP.put("-", "");
        VARIANT_MAP.put("_", "");
        VARIANT_MAP.put(".", "");
        VARIANT_MAP.put(" ", "");
    }

    /**
     * 检查文本是否包含敏感词
     * @param text 待检查的文本
     * @return 如果包含敏感词，返回第一个匹配的敏感词；否则返回null
     */
    public String checkSensitiveWord(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        // 转换为小写并移除特殊字符（用于检测变体）
        String normalizedText = normalizeText(text);
        
        // 检查是否包含敏感词
        for (String word : SENSITIVE_WORDS) {
            if (normalizedText.contains(word.toLowerCase())) {
                log.warn("检测到敏感词: {} 在文本中: {}", word, text);
                return word;
            }
        }

        return null;
    }

    /**
     * 验证文本是否干净（不包含敏感词）
     * @param text 待验证的文本
     * @throws IllegalArgumentException 如果包含敏感词
     */
    public void assertCleanText(String text) {
        String sensitiveWord = checkSensitiveWord(text);
        if (sensitiveWord != null) {
            throw new IllegalArgumentException("消息包含敏感词，请修改后重试");
        }
    }

    /**
     * 过滤敏感词（用*替换）
     * @param text 原始文本
     * @return 过滤后的文本
     */
    public String filterSensitiveWords(String text) {
        if (text == null || text.isBlank()) {
            return text;
        }

        String result = text;
        String normalizedText = normalizeText(text);
        
        for (String word : SENSITIVE_WORDS) {
            if (normalizedText.contains(word.toLowerCase())) {
                // 使用正则表达式替换（不区分大小写）
                Pattern pattern = Pattern.compile(Pattern.quote(word), Pattern.CASE_INSENSITIVE);
                result = pattern.matcher(result).replaceAll("*".repeat(word.length()));
            }
        }

        return result;
    }

    /**
     * 标准化文本（移除特殊字符，转换为小写）
     * @param text 原始文本
     * @return 标准化后的文本
     */
    private String normalizeText(String text) {
        String normalized = text.toLowerCase();
        // 移除常见变体字符
        for (Map.Entry<String, String> entry : VARIANT_MAP.entrySet()) {
            normalized = normalized.replace(entry.getKey(), entry.getValue());
        }
        return normalized;
    }

    /**
     * 添加敏感词（动态扩展）
     * @param word 敏感词
     */
    public void addSensitiveWord(String word) {
        if (word != null && !word.isBlank()) {
            SENSITIVE_WORDS.add(word.toLowerCase().trim());
            log.info("添加敏感词: {}", word);
        }
    }

    /**
     * 移除敏感词
     * @param word 敏感词
     */
    public void removeSensitiveWord(String word) {
        if (word != null) {
            SENSITIVE_WORDS.remove(word.toLowerCase().trim());
            log.info("移除敏感词: {}", word);
        }
    }
}


