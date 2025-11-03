package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.ShareLink;
import org.apache.ibatis.annotations.Mapper;

/**
 * 分享链接Mapper接口
 */
@Mapper
public interface ShareLinkMapper extends BaseMapper<ShareLink> {}

