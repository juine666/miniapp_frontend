package com.stylemirror.miniapp_backend.common;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.regex.Pattern;

/**
 * 灵活的 LocalDate 反序列化器
 * 支持多种日期格式：yyyy-MM-dd, yyyy-M-d, yyyy/MM/dd, yyyy/M/d, yyyyMMdd 等
 */
public class FlexibleLocalDateDeserializer extends JsonDeserializer<LocalDate> {

    private static final DateTimeFormatter FORMATTER_STANDARD = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateStr = p.getValueAsString();
        
        if (dateStr == null || dateStr.isEmpty()) {
            return null;
        }
        
        dateStr = dateStr.trim();
        
        try {
            // 标准格式直接解析
            if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return LocalDate.parse(dateStr, FORMATTER_STANDARD);
            }
            
            // 处理 2019-5-1 这种缺少前导零的格式
            if (dateStr.matches("\\d{4}-\\d{1,2}-\\d{1,2}")) {
                String[] parts = dateStr.split("-");
                String year = parts[0];
                String month = String.format("%02d", Integer.parseInt(parts[1]));
                String day = String.format("%02d", Integer.parseInt(parts[2]));
                String normalized = String.format("%s-%s-%s", year, month, day);
                return LocalDate.parse(normalized, FORMATTER_STANDARD);
            }
            
            // 处理 2019/5/1 这种格式
            if (dateStr.matches("\\d{4}/\\d{1,2}/\\d{1,2}")) {
                String[] parts = dateStr.split("/");
                String year = parts[0];
                String month = String.format("%02d", Integer.parseInt(parts[1]));
                String day = String.format("%02d", Integer.parseInt(parts[2]));
                String normalized = String.format("%s-%s-%s", year, month, day);
                return LocalDate.parse(normalized, FORMATTER_STANDARD);
            }
            
            // 处理 20190501 这种格式
            if (dateStr.matches("\\d{8}")) {
                String year = dateStr.substring(0, 4);
                String month = dateStr.substring(4, 6);
                String day = dateStr.substring(6, 8);
                String normalized = String.format("%s-%s-%s", year, month, day);
                return LocalDate.parse(normalized, FORMATTER_STANDARD);
            }
            
            // 处理 2019.5.1 这种格式
            if (dateStr.matches("\\d{4}\\.\\d{1,2}\\.\\d{1,2}")) {
                String[] parts = dateStr.split("\\.");
                String year = parts[0];
                String month = String.format("%02d", Integer.parseInt(parts[1]));
                String day = String.format("%02d", Integer.parseInt(parts[2]));
                String normalized = String.format("%s-%s-%s", year, month, day);
                return LocalDate.parse(normalized, FORMATTER_STANDARD);
            }
            
            // 尝试使用标准格式解析（作为最后的备选方案）
            return LocalDate.parse(dateStr, FORMATTER_STANDARD);
            
        } catch (Exception e) {
            throw new IOException("无法解析日期格式: " + dateStr, e);
        }
    }
}
