package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.StudentEnrollment;
import org.apache.ibatis.annotations.Mapper;

/**
 * 学生登记 Mapper
 */
@Mapper
public interface StudentEnrollmentMapper extends BaseMapper<StudentEnrollment> {
}
