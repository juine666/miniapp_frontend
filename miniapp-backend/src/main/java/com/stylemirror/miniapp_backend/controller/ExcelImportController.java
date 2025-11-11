package com.stylemirror.miniapp_backend.controller;

import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.service.ExcelOrderProcessorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Excel 订单导入 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/excel")
@RequiredArgsConstructor
@Tag(name = "Excel导入", description = "Excel 文件导入相关接口")
public class ExcelImportController {

    private final ExcelOrderProcessorService excelOrderProcessorService;

    /**
     * 导入订单数据 Excel
     *
     * @param file Excel 文件
     * @return 导入结果
     */
    @PostMapping("/import-orders")
    @Operation(summary = "导入订单数据", description = "上传 Excel 文件导入订单数据，支持大文件高性能处理")
    public ApiResponse<?> importOrders(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ApiResponse.error(400, "文件为空");
        }

        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls"))) {
            return ApiResponse.error(400, "仅支持 .xlsx 或 .xls 格式的文件");
        }

        try {
            log.info("开始导入订单数据，文件: {}, 大小: {} bytes", fileName, file.getSize());

            ExcelOrderProcessorService.ExcelImportResult result = excelOrderProcessorService.processOrderExcel(file.getInputStream());

            if (result.getError() != null) {
                return ApiResponse.error(500, result.getError());
            }

            return ApiResponse.success(result);

        } catch (IOException e) {
            log.error("文件读取失败", e);
            return ApiResponse.error(500, "文件读取失败: " + e.getMessage());
        } catch (Exception e) {
            log.error("订单导入异常", e);
            return ApiResponse.error(500, "订单导入异常: " + e.getMessage());
        }
    }
}
