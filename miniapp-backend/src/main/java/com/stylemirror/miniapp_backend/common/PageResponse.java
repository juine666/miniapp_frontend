package com.stylemirror.miniapp_backend.common;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 分页响应DTO
 * 用于统一返回分页数据
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    /**
     * 数据列表
     */
    private List<T> content;
    
    /**
     * 当前页码（从0开始）
     */
    private int page;
    
    /**
     * 每页大小
     */
    private int size;
    
    /**
     * 总记录数
     */
    private long total;
    
    /**
     * 总页数
     */
    private int totalPages;
    
    /**
     * 是否有下一页
     */
    private boolean hasNext;
    
    /**
     * 是否有上一页
     */
    private boolean hasPrevious;
    
    /**
     * 创建分页响应
     */
    public static <T> PageResponse<T> of(List<T> content, int page, int size, long total) {
        PageResponse<T> response = new PageResponse<>();
        response.setContent(content);
        response.setPage(page);
        response.setSize(size);
        response.setTotal(total);
        response.setTotalPages((int) Math.ceil((double) total / size));
        response.setHasNext(page < response.getTotalPages() - 1);
        response.setHasPrevious(page > 0);
        return response;
    }
}

