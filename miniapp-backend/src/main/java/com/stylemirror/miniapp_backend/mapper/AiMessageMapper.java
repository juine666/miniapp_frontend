package com.stylemirror.miniapp_backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.AiMessage;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface AiMessageMapper extends BaseMapper<AiMessage> {
}
