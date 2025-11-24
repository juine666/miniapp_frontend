package com.stylemirror.miniapp_backend.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.stylemirror.miniapp_backend.common.FlexibleLocalDateDeserializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 学生登记表
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@TableName("student_enrollment")
public class StudentEnrollment {
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 教育机构名称
     */
    @TableField("institution_name")
    private String institutionName;

    /**
     * 所属年级
     */
    private String grade;

    /**
     * 班级名称
     */
    @TableField("class_name")
    private String className;

    /**
     * 班主任名称
     */
    @TableField("teacher_name")
    private String teacherName;

    /**
     * 儿童姓名
     */
    @TableField("student_name")
    private String studentName;

    /**
     * 儿童身份证号码
     */
    @TableField("student_id_card")
    private String studentIdCard;

    /**
     * 儿童出生年月日
     */
    @TableField("birth_date")
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @JsonFormat(pattern = "yyyy-MM-dd", timezone = "GMT+8")
    @JsonDeserialize(using = FlexibleLocalDateDeserializer.class)
    private LocalDate birthDate;

    /**
     * 性别
     */
    private String gender;

    /**
     * 联系电话
     */
    @TableField("contact_phone")
    private String contactPhone;

    /**
     * 母亲姓名
     */
    @TableField("mother_name")
    private String motherName;

    /**
     * 母亲身份证号码
     */
    @TableField("mother_id_card")
    private String motherIdCard;

    /**
     * 创建时间
     */
    @TableField("created_at")
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField("updated_at")
    private LocalDateTime updatedAt;

    /**
     * 创建人
     */
    @TableField("created_by")
    private String createdBy;

    /**
     * 更新人
     */
    @TableField("updated_by")
    private String updatedBy;
}
