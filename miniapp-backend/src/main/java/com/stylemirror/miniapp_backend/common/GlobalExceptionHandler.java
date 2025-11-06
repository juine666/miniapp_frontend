package com.stylemirror.miniapp_backend.common;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingPathVariableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.io.PrintWriter;
import java.io.StringWriter;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Validation error");
        log.warn("参数验证失败: {}", msg);
        log.debug("参数验证异常堆栈:", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error(400, msg));
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiResponse<Void>> handleBind(BindException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .orElse("Bind error");
        log.warn("绑定异常: {}", msg);
        log.debug("绑定异常堆栈:", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error(400, msg));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("非法参数异常: {}", ex.getMessage());
        log.debug("非法参数异常堆栈:", ex);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(400, ex.getMessage()));
    }

    @ExceptionHandler(MissingPathVariableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMissingPathVariable(MissingPathVariableException ex) {
        String msg = "缺少路径变量: " + ex.getVariableName();
        log.warn("路径变量缺失: {}", msg);
        log.debug("路径变量缺失异常堆栈:", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error(400, msg));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String msg = String.format("参数类型不匹配: %s，期望类型: %s，实际值: %s",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "未知",
                ex.getValue());
        log.warn("参数类型不匹配: {}", msg);
        log.debug("参数类型不匹配异常堆栈:", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error(400, msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleOther(Exception ex) {
        // 打印完整的堆栈信息
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        ex.printStackTrace(pw);
        String stackTrace = sw.toString();
        
        log.error("未处理的异常: {}", ex.getMessage(), ex);
        log.error("异常堆栈信息:\n{}", stackTrace);
        
        // 同时在控制台输出
        System.err.println("==========================================");
        System.err.println("服务器内部错误:");
        System.err.println("异常类型: " + ex.getClass().getName());
        System.err.println("异常消息: " + ex.getMessage());
        System.err.println("异常堆栈:");
        ex.printStackTrace();
        System.err.println("==========================================");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(500, ex.getMessage() != null ? ex.getMessage() : "服务器内部错误"));
    }
}


