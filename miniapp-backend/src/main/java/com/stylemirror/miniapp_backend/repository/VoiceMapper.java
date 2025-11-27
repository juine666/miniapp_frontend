package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.domain.Voice;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 语音 Mapper
 */
@Mapper
public interface VoiceMapper extends BaseMapper<Voice> {
    
    /**
     * 获取产品的所有语音（分页，按时间倒序）
     */
    Page<Voice> selectVoicesByProductId(@Param("page") Page<Voice> page, 
                                        @Param("productId") Long productId);
}
