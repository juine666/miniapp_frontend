package com.stylemirror.miniapp_backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.UserDailyQuota;
import org.apache.ibatis.annotations.Mapper;

/**
 * 用户每日配额 Mapper
 */
@Mapper
public interface UserDailyQuotaMapper extends BaseMapper<UserDailyQuota> {
}
