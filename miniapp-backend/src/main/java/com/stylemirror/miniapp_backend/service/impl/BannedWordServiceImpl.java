package com.stylemirror.miniapp_backend.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.BannedWord;
import com.stylemirror.miniapp_backend.repository.BannedWordMapper;
import com.stylemirror.miniapp_backend.service.BannedWordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 违禁词管理服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BannedWordServiceImpl extends ServiceImpl<BannedWordMapper, BannedWord> implements BannedWordService {
    
    private final BannedWordMapper bannedWordMapper;
    
    @Override
    public Page<BannedWord> getAllBannedWords(Integer pageNum, Integer pageSize, String category, Boolean isActive) {
        Page<BannedWord> page = new Page<>(pageNum, pageSize);
        
        QueryWrapper<BannedWord> wrapper = new QueryWrapper<>();
        if (category != null && !category.isEmpty()) {
            wrapper.eq("category", category);
        }
        if (isActive != null) {
            wrapper.eq("is_active", isActive);
        }
        wrapper.orderByDesc("created_at");
        
        return this.page(page, wrapper);
    }
    
    @Override
    public BannedWord addBannedWord(BannedWord bannedWord, Long adminId) {
        bannedWord.setCreatedBy(adminId);
        bannedWord.setCreatedAt(LocalDateTime.now());
        bannedWord.setUpdatedBy(adminId);
        bannedWord.setUpdatedAt(LocalDateTime.now());
        
        // 检查是否已存在
        QueryWrapper<BannedWord> wrapper = new QueryWrapper<>();
        wrapper.eq("word", bannedWord.getWord());
        BannedWord existing = this.getOne(wrapper);
        if (existing != null) {
            log.warn("违禁词已存在: {}", bannedWord.getWord());
            return null;
        }
        
        this.save(bannedWord);
        log.info("管理员 {} 添加了违禁词: {}", adminId, bannedWord.getWord());
        return bannedWord;
    }
    
    @Override
    public boolean updateBannedWord(BannedWord bannedWord, Long adminId) {
        bannedWord.setUpdatedBy(adminId);
        bannedWord.setUpdatedAt(LocalDateTime.now());
        
        boolean success = this.updateById(bannedWord);
        if (success) {
            log.info("管理员 {} 修改了违禁词: {}", adminId, bannedWord.getWord());
        }
        return success;
    }
    
    @Override
    public boolean deleteBannedWord(Long id, Long adminId) {
        BannedWord bannedWord = this.getById(id);
        if (bannedWord == null) {
            return false;
        }
        
        boolean success = this.removeById(id);
        if (success) {
            log.info("管理员 {} 删除了违禁词: {}", adminId, bannedWord.getWord());
        }
        return success;
    }
    
    @Override
    public boolean toggleBannedWordStatus(Long id, Boolean isActive, Long adminId) {
        BannedWord bannedWord = this.getById(id);
        if (bannedWord == null) {
            return false;
        }
        
        bannedWord.setIsActive(isActive);
        bannedWord.setUpdatedBy(adminId);
        bannedWord.setUpdatedAt(LocalDateTime.now());
        
        boolean success = this.updateById(bannedWord);
        if (success) {
            log.info("管理员 {} {}了违禁词: {}", adminId, isActive ? "启用" : "禁用", bannedWord.getWord());
        }
        return success;
    }
}
