package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.StudentEnrollment;
import com.stylemirror.miniapp_backend.repository.StudentEnrollmentMapper;
import org.springframework.stereotype.Service;

/**
 * 学生登记 Service
 */
@Service
public class StudentEnrollmentService extends ServiceImpl<StudentEnrollmentMapper, StudentEnrollment> {

    /**
     * 分页查询学生登记信息
     */
    public Page<StudentEnrollment> pageEnrollments(Integer pageNum, Integer pageSize, String keyword, String grade, String motherBirthdaySort) {
        Page<StudentEnrollment> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<StudentEnrollment> wrapper = new LambdaQueryWrapper<>();
        
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(StudentEnrollment::getStudentName, keyword)
                    .or()
                    .like(StudentEnrollment::getStudentIdCard, keyword)
                    .or()
                    .like(StudentEnrollment::getContactPhone, keyword));
        }
        
        if (grade != null && !grade.isEmpty()) {
            wrapper.eq(StudentEnrollment::getGrade, grade);
        }
        
        // 按母亲身份证的出生年月日排序（第7-14位）
        // 例如：450321199212061028 中的 19921206 是出生年月日
        if (motherBirthdaySort != null && !motherBirthdaySort.isEmpty()) {
            if ("asc".equals(motherBirthdaySort)) {
                // 升序：出生年份较小（年龄较大）的在前，应询壳根据年份整整提取
                wrapper.last("ORDER BY SUBSTR(mother_id_card, 7, 8) ASC");
            } else if ("desc".equals(motherBirthdaySort)) {
                // 降序：出生年份较大（年龄较小）的在前
                wrapper.last("ORDER BY SUBSTR(mother_id_card, 7, 8) DESC");
            }
        } else {
            wrapper.orderByDesc(StudentEnrollment::getCreatedAt);
        }
        
        return this.page(page, wrapper);
    }
    
    /**
     * 分页查询学生登记信息（重载）
     */
    public Page<StudentEnrollment> pageEnrollments(Integer pageNum, Integer pageSize, String keyword, String grade) {
        return pageEnrollments(pageNum, pageSize, keyword, grade, null);
    }

    /**
     * 根据班级查询学生
     */
    public Page<StudentEnrollment> getEnrollmentsByClass(String className, Integer pageNum, Integer pageSize) {
        Page<StudentEnrollment> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<StudentEnrollment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StudentEnrollment::getClassName, className)
                .orderByDesc(StudentEnrollment::getCreatedAt);
        return this.page(page, wrapper);
    }

    /**
     * 根据机构查询学生
     */
    public Page<StudentEnrollment> getEnrollmentsByInstitution(String institutionName, Integer pageNum, Integer pageSize) {
        Page<StudentEnrollment> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<StudentEnrollment> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StudentEnrollment::getInstitutionName, institutionName)
                .orderByDesc(StudentEnrollment::getCreatedAt);
        return this.page(page, wrapper);
    }
}
