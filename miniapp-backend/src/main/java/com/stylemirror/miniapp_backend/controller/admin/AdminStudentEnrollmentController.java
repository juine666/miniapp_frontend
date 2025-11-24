package com.stylemirror.miniapp_backend.controller.admin;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.domain.StudentEnrollment;
import com.stylemirror.miniapp_backend.service.StudentEnrollmentService;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 学生登记管理 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/admin/student-enrollment")
public class AdminStudentEnrollmentController {

    @Autowired
    private StudentEnrollmentService studentEnrollmentService;

    /**
     * 导入学生信息 Excel
     * 支持重复身份证号跳过处理
     */
    @PostMapping("/import")
    public ApiResponse<?> importEnrollments(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.error(400, "文件为空");
        }
        
        try {
            Workbook workbook = new XSSFWorkbook(file.getInputStream());
            Sheet sheet = workbook.getSheetAt(0);
            
            int imported = 0;
            int skipped = 0;
            StringBuilder errorMsg = new StringBuilder();
            
            // 从第四行开始读取数据（前三行是贫额和表头）
            // Excel文件结构：第1-2行是填写说明，第3行是表头，第4行开始是数据
            for (int i = 3; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                
                try {
                    // 读取数据
                    String institutionName = getCellValue(row, 0);
                    String grade = getCellValue(row, 1);
                    String className = getCellValue(row, 2);
                    String teacherName = getCellValue(row, 3);
                    String studentName = getCellValue(row, 4);
                    String studentIdCard = getCellValue(row, 5);
                    String birthDateStr = getCellValue(row, 6);
                    String gender = getCellValue(row, 7);
                    String contactPhone = getCellValue(row, 8);
                    String motherName = getCellValue(row, 9);
                    String motherIdCard = getCellValue(row, 10);
                    
                    // 验证必填字段
                    if (institutionName == null || institutionName.trim().isEmpty()) {
                        errorMsg.append("第").append(i + 1).append("行：缺少教育机构名称; ");
                        continue;
                    }
                    if (studentName == null || studentName.trim().isEmpty()) {
                        errorMsg.append("第").append(i + 1).append("行：缺少学生姓名; ");
                        continue;
                    }
                    if (studentIdCard == null || studentIdCard.trim().isEmpty()) {
                        errorMsg.append("第").append(i + 1).append("行：缺少身份证号码; ");
                        continue;
                    }
                    
                    // 检查身份证号是否已存在
                    if (studentIdCard != null && !studentIdCard.isEmpty()) {
                        boolean exists = studentEnrollmentService.lambdaQuery()
                                .eq(StudentEnrollment::getStudentIdCard, studentIdCard)
                                .exists();
                        if (exists) {
                            skipped++;
                            log.info("学生身份证号已存在，跳过：{}", studentIdCard);
                            continue;
                        }
                    }
                    
                    // 转换日期格式
                    LocalDate birthDate = null;
                    if (birthDateStr != null && !birthDateStr.trim().isEmpty()) {
                        birthDate = convertExcelDate(birthDateStr.trim());
                        // 验证日期的合理性
                        if (birthDate != null) {
                            LocalDate now = LocalDate.now();
                            // 检查日期是否在合理范围内（出生日期应该在过去，但不超过200年前）
                            if (birthDate.isAfter(now) || birthDate.isBefore(now.minusYears(200))) {
                                log.warn("第{}行：日期不合理，跳过：{}", i + 1, birthDateStr);
                                birthDate = null; // 置为null，允许插入但不带日期
                            }
                        }
                    }
                    
                    // 创建学生对象
                    StudentEnrollment enrollment = new StudentEnrollment();
                    enrollment.setInstitutionName(institutionName.trim());
                    enrollment.setGrade(grade != null ? grade.trim() : null);
                    enrollment.setClassName(className != null ? className.trim() : null);
                    enrollment.setTeacherName(teacherName != null ? teacherName.trim() : null);
                    enrollment.setStudentName(studentName.trim());
                    enrollment.setStudentIdCard(studentIdCard.trim());
                    enrollment.setBirthDate(birthDate);
                    enrollment.setGender(gender != null ? gender.trim() : null);
                    enrollment.setContactPhone(contactPhone != null ? contactPhone.trim() : null);
                    enrollment.setMotherName(motherName != null ? motherName.trim() : null);
                    enrollment.setMotherIdCard(motherIdCard != null ? motherIdCard.trim() : null);
                    
                    // 保存
                    studentEnrollmentService.save(enrollment);
                    imported++;
                } catch (Exception e) {
                    errorMsg.append("第").append(i + 1).append("行：").append(e.getMessage()).append("; ");
                    log.error("导入学生信息失败，行号: {}", i + 1, e);
                }
            }
            
            workbook.close();
            
            Map<String, Object> result = new HashMap<>();
            result.put("imported", imported);
            result.put("skipped", skipped);
            if (errorMsg.length() > 0) {
                result.put("errors", errorMsg.toString());
            }
            
            return ApiResponse.success(result);
        } catch (Exception e) {
            log.error("导入学生信息失败", e);
            return ApiResponse.error(500, "导入失败: " + e.getMessage());
        }
    }
    
    /**
     * 获取单元格值
     */
    private String getCellValue(Row row, int columnIndex) {
        try {
            if (row.getCell(columnIndex) == null) return null;
            
            switch (row.getCell(columnIndex).getCellType()) {
                case STRING:
                    return row.getCell(columnIndex).getStringCellValue();
                case NUMERIC:
                    return String.valueOf((long) row.getCell(columnIndex).getNumericCellValue());
                case BOOLEAN:
                    return String.valueOf(row.getCell(columnIndex).getBooleanCellValue());
                default:
                    return null;
            }
        } catch (Exception e) {
            log.warn("读取单元格值失败，行: {}, 列: {}", row.getRowNum(), columnIndex, e);
            return null;
        }
    }
    
    /**
     * 转换 Excel 日期格式
     * 支持：Excel 序列号、yyyy-MM-dd、yyyy/MM/dd、yyyy.MM.dd 等格式
     */
    private LocalDate convertExcelDate(String dateStr) {
        try {
            if (dateStr == null || dateStr.trim().isEmpty()) {
                return null;
            }
            
            dateStr = dateStr.trim();
            
            // 慈准大的日期范围（例如 57179 表示日期太大）
            if (dateStr.matches("\\d+")) {
                try {
                    long excelSerialNum = Long.parseLong(dateStr);
                    // 只俱任合理范围的 Excel 日期（1-70000之间）
                    if (excelSerialNum > 70000 || excelSerialNum < 1) {
                        log.warn("日期序列号超过合理范围：{}", excelSerialNum);
                        return null;
                    }
                    
                    // Excel 日期从 1900-01-01 开始
                    LocalDate baseDate = LocalDate.of(1900, 1, 1);
                    return baseDate.plusDays(excelSerialNum - 2);
                } catch (Exception e) {
                    log.warn("日期序列号转换失败：{}", dateStr, e);
                    return null;
                }
            }
            
            // 处理带位数字的日期（带消魔零）：2019-5-1 -> 2019-05-01
            if (dateStr.matches("\\d{4}[-/\\.]\\d{1,2}[-/\\.]\\d{1,2}")) {
                String[] parts = null;
                String separator = null;
                
                if (dateStr.contains("-")) {
                    parts = dateStr.split("-");
                    separator = "-";
                } else if (dateStr.contains("/")) {
                    parts = dateStr.split("/");
                    separator = "/";
                } else if (dateStr.contains(".")) {
                    parts = dateStr.split("\\.");
                    separator = ".";
                }
                
                if (parts != null && parts.length == 3) {
                    try {
                        int year = Integer.parseInt(parts[0]);
                        int month = Integer.parseInt(parts[1]);
                        int day = Integer.parseInt(parts[2]);
                        
                        return LocalDate.of(year, month, day);
                    } catch (Exception e) {
                        log.warn("日期解析失败：{}", dateStr, e);
                        return null;
                    }
                }
            }
            
            // 处理标准格式：yyyyMMdd
            if (dateStr.matches("\\d{8}")) {
                try {
                    int year = Integer.parseInt(dateStr.substring(0, 4));
                    int month = Integer.parseInt(dateStr.substring(4, 6));
                    int day = Integer.parseInt(dateStr.substring(6, 8));
                    return LocalDate.of(year, month, day);
                } catch (Exception e) {
                    log.warn("日期解析失败：{}", dateStr, e);
                    return null;
                }
            }
            
            // 最后，尝试使用 LocalDate.parse 的准标格式
            try {
                return LocalDate.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            } catch (Exception e) {
                log.warn("日期解析失败：{}", dateStr, e);
                return null;
            }
        } catch (Exception e) {
            log.error("日期转换异常：{}", dateStr, e);
            return null;
        }
    }
    @GetMapping("/page")
    public ApiResponse<Page<StudentEnrollment>> pageEnrollments(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String grade,
            @RequestParam(required = false) String motherBirthdaySort) {
        
        Page<StudentEnrollment> result = studentEnrollmentService.pageEnrollments(pageNum, pageSize, keyword, grade, motherBirthdaySort);
        return ApiResponse.success(result);
    }

    /**
     * 获取单个学生信息
     */
    @GetMapping("/{id}")
    public ApiResponse<StudentEnrollment> getEnrollment(@PathVariable Long id) {
        StudentEnrollment enrollment = studentEnrollmentService.getById(id);
        if (enrollment == null) {
            return ApiResponse.error(404, "学生信息不存在");
        }
        return ApiResponse.success(enrollment);
    }

    /**
     * 创建学生信息
     */
    @PostMapping("")
    public ApiResponse<StudentEnrollment> createEnrollment(@RequestBody StudentEnrollment enrollment) {
        try {
            studentEnrollmentService.save(enrollment);
            return ApiResponse.success(enrollment);
        } catch (Exception e) {
            log.error("创建学生信息失败", e);
            return ApiResponse.error(500, "创建学生信息失败: " + e.getMessage());
        }
    }

    /**
     * 更新学生信息
     */
    @PutMapping("/{id}")
    public ApiResponse<StudentEnrollment> updateEnrollment(
            @PathVariable Long id,
            @RequestBody StudentEnrollment enrollment) {
        try {
            enrollment.setId(id);
            studentEnrollmentService.updateById(enrollment);
            return ApiResponse.success(enrollment);
        } catch (Exception e) {
            log.error("更新学生信息失败", e);
            return ApiResponse.error(500, "更新学生信息失败: " + e.getMessage());
        }
    }

    /**
     * 删除学生信息
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteEnrollment(@PathVariable Long id) {
        try {
            boolean success = studentEnrollmentService.removeById(id);
            if (success) {
                return ApiResponse.success(null);
            } else {
                return ApiResponse.error(404, "学生信息不存在");
            }
        } catch (Exception e) {
            log.error("删除学生信息失败", e);
            return ApiResponse.error(500, "删除学生信息失败: " + e.getMessage());
        }
    }

    /**
     * 批量删除学生信息
     */
    @PostMapping("/batch-delete")
    public ApiResponse<Void> batchDeleteEnrollments(@RequestBody List<Long> ids) {
        try {
            studentEnrollmentService.removeByIds(ids);
            return ApiResponse.success(null);
        } catch (Exception e) {
            log.error("批量删除学生信息失败", e);
            return ApiResponse.error(500, "批量删除学生信息失败: " + e.getMessage());
        }
    }

    /**
     * 导出学生信息 Excel
     */
    @PostMapping("/export")
    public void exportEnrollments(
            @RequestBody ExportRequest request,
            HttpServletResponse response) throws IOException {
        
        try {
            // 获取要导出的数据
            Page<StudentEnrollment> page = studentEnrollmentService.pageEnrollments(1, 10000, null, null, null);
            List<StudentEnrollment> data = page.getRecords();

            // 创建 Excel
            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("学生登记表");

            // 创建表头
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "教育机构名称", "所属年级", "班级名称", "班主任",
                "儿童姓名", "儿童身份证号码", "儿童出生年月日", "性别",
                "联系电话", "母亲姓名", "母亲身份证号码"
            };
            
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            // 填充数据
            int rowNum = 1;
            for (StudentEnrollment dto : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(dto.getInstitutionName() != null ? dto.getInstitutionName() : "");
                row.createCell(1).setCellValue(dto.getGrade() != null ? dto.getGrade() : "");
                row.createCell(2).setCellValue(dto.getClassName() != null ? dto.getClassName() : "");
                row.createCell(3).setCellValue(dto.getTeacherName() != null ? dto.getTeacherName() : "");
                row.createCell(4).setCellValue(dto.getStudentName() != null ? dto.getStudentName() : "");
                row.createCell(5).setCellValue(dto.getStudentIdCard() != null ? dto.getStudentIdCard() : "");
                row.createCell(6).setCellValue(dto.getBirthDate() != null ? dto.getBirthDate().toString() : "");
                row.createCell(7).setCellValue(dto.getGender() != null ? dto.getGender() : "");
                row.createCell(8).setCellValue(dto.getContactPhone() != null ? dto.getContactPhone() : "");
                row.createCell(9).setCellValue(dto.getMotherName() != null ? dto.getMotherName() : "");
                row.createCell(10).setCellValue(dto.getMotherIdCard() != null ? dto.getMotherIdCard() : "");
            }

            // 设置列宽
            for (int i = 0; i < headers.length; i++) {
                sheet.setColumnWidth(i, 20 * 256);
            }

            // 下载
            String filename = URLEncoder.encode("学生登记表.xlsx", StandardCharsets.UTF_8);
            response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            
            workbook.write(response.getOutputStream());
            workbook.close();
        } catch (Exception e) {
            log.error("导出学生信息失败", e);
            response.setStatus(500);
        }
    }

    /**
     * 导出请求对象
     */
    @lombok.Data
    public static class ExportRequest {
        private List<String> columns;
    }
}
