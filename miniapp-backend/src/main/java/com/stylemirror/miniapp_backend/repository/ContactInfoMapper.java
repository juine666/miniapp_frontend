package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.ContactInfo;
import org.apache.ibatis.annotations.Mapper;

/**
 * 联系方式Mapper接口
 */
@Mapper
public interface ContactInfoMapper extends BaseMapper<ContactInfo> {}

