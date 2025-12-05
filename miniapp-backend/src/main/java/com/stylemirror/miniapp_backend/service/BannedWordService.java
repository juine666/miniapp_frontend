package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.stylemirror.miniapp_backend.domain.BannedWord;

/**
 * 违禁词管理服务
 */
public interface BannedWordService extends IService<BannedWord> {
    
    /**
     * 获取所有违禁词（分页）
     */
    Page<BannedWord> getAllBannedWords(Integer pageNum, Integer pageSize, String category, Boolean isActive);
    
    /**
     * 添加违禁词
     */
    BannedWord addBannedWord(BannedWord bannedWord, Long adminId);
    
    /**
     * 修改违禁词
     */
    boolean updateBannedWord(BannedWord bannedWord, Long adminId);
    
    /**
     * 删除违禁词
     */
    boolean deleteBannedWord(Long id, Long adminId);
    
    /**
     * 启用/禁用违禁词
     */
    boolean toggleBannedWordStatus(Long id, Boolean isActive, Long adminId);
}
