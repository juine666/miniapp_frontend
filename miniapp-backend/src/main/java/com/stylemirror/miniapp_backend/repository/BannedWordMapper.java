package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.BannedWord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 违禁词 Mapper
 */
@Mapper
public interface BannedWordMapper extends BaseMapper<BannedWord> {
    
    /**
     * 获取所有启用的违禁词
     */
    @Select("SELECT word FROM banned_words WHERE is_active = 1")
    List<String> selectActiveBannedWords();
}
