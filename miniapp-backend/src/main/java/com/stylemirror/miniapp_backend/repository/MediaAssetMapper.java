package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.MediaAsset;
import org.apache.ibatis.annotations.Mapper;

/**
 * 媒体资源Mapper接口
 */
@Mapper
public interface MediaAssetMapper extends BaseMapper<MediaAsset> {}

