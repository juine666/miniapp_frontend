package com.stylemirror.miniapp_backend.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.ApiResponse;
import com.stylemirror.miniapp_backend.common.TestAuthHelper;
import com.stylemirror.miniapp_backend.domain.Comment;
import com.stylemirror.miniapp_backend.service.CommentService;
import com.stylemirror.miniapp_backend.service.CommentLikeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 评论 Controller
 */
@Slf4j
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    
    private final CommentService commentService;
    private final CommentLikeService commentLikeService;
    private final TestAuthHelper testAuthHelper;
    
    /**
     * 发布评论
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Comment>> publishComment(
            @RequestBody Comment comment,
            Authentication auth) {
        Long userId = testAuthHelper.getUserId(auth);
        
        Comment result = commentService.publishComment(comment, userId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 获取产品的评论列表（分页，一级评论按热度排序）
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<Page<Comment>>> getProductComments(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            Authentication auth) {
        
        Long currentUserId = null;
        if (auth != null) {
            try {
                currentUserId = testAuthHelper.getUserId(auth);
            } catch (Exception e) {
                log.debug("未认证用户");
            }
        }
        
        Page<Comment> result = commentService.getProductComments(productId, pageNum, pageSize, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 获取评论的二级回复
     */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<ApiResponse<List<Comment>>> getReplies(
            @PathVariable Long commentId,
            Authentication auth) {
        
        Long currentUserId = null;
        if (auth != null) {
            try {
                currentUserId = testAuthHelper.getUserId(auth);
            } catch (Exception e) {
                log.debug("未认证用户");
            }
        }
        
        List<Comment> replies = commentService.getReplies(commentId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(replies));
    }
    
    /**
     * 获取评论详情
     */
    @GetMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Comment>> getCommentDetail(
            @PathVariable Long commentId,
            Authentication auth) {
        
        Long currentUserId = null;
        if (auth != null) {
            try {
                currentUserId = testAuthHelper.getUserId(auth);
            } catch (Exception e) {
                log.debug("未认证用户");
            }
        }
        
        Comment comment = commentService.getCommentDetail(commentId, currentUserId);
        if (comment == null) {
            return ResponseEntity.ok(ApiResponse.error(404, "评论不存在"));
        }
        return ResponseEntity.ok(ApiResponse.success(comment));
    }
    
    /**
     * 编辑评论
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> updateComment(
            @PathVariable Long commentId,
            @RequestBody java.util.Map<String, String> body,
            Authentication auth) {
        
        Long userId = testAuthHelper.getUserId(auth);
        String content = body.get("content");
        
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error(400, "评论内容不能为空"));
        }
        
        boolean success = commentService.updateComment(commentId, content, userId);
        if (!success) {
            return ResponseEntity.ok(ApiResponse.error(403, "编辑失败，只有评论者本人可以编辑"));
        }
        
        return ResponseEntity.ok(ApiResponse.success());
    }
    
    /**
     * 删除评论
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            Authentication auth) {
        
        Long userId = testAuthHelper.getUserId(auth);
        // TODO: 从认证信息中获取用户是否为管理员
        Boolean isAdmin = false;
        
        boolean success = commentService.deleteComment(commentId, userId, isAdmin);
        if (!success) {
            return ResponseEntity.ok(ApiResponse.error(403, "删除失败，只有评论者本人可以删除"));
        }
        
        return ResponseEntity.ok(ApiResponse.success());
    }
    
    /**
     * 点赞或取消点赞
     */
    @PostMapping("/{commentId}/like")
    public ResponseEntity<ApiResponse<Void>> toggleLike(
            @PathVariable Long commentId,
            Authentication auth) {
        
        Long userId = testAuthHelper.getUserId(auth);
        
        commentLikeService.toggleLike(commentId, userId);
        return ResponseEntity.ok(ApiResponse.success());
    }
    
    // ========== 后台管理接口 ==========
    
    /**
     * 后台：获取所有评论（包含未审核）- 管理员专用
     */
    @GetMapping("/admin/list")
    public ResponseEntity<ApiResponse<Page<Comment>>> getAllComments(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "20") Integer pageSize,
            Authentication auth) {
        
        // 验证是否为管理员（这里简化处理，实际应该检查权限）
        Long userId = testAuthHelper.getUserId(auth);
        // TODO: 检查是否为管理员
        
        Page<Comment> result = commentService.getAllComments(pageNum, pageSize);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
    
    /**
     * 后台：删除评论 - 管理员专用
     */
    @DeleteMapping("/admin/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteCommentByAdmin(
            @PathVariable Long commentId,
            @RequestBody(required = false) java.util.Map<String, String> body,
            Authentication auth) {
        
        Long adminId = testAuthHelper.getUserId(auth);
        String reason = body != null ? body.get("reason") : "内容违规";
        
        boolean success = commentService.deleteCommentByAdmin(commentId, adminId, reason);
        if (!success) {
            return ResponseEntity.ok(ApiResponse.error(404, "评论不存在"));
        }
        
        return ResponseEntity.ok(ApiResponse.success());
    }
    
    /**
     * 后台：审核评论（标记为已审核或未通过）- 管理员专用
     */
    @PostMapping("/admin/{commentId}/review")
    public ResponseEntity<ApiResponse<Void>> reviewComment(
            @PathVariable Long commentId,
            @RequestBody java.util.Map<String, Object> body,
            Authentication auth) {
        
        Long adminId = testAuthHelper.getUserId(auth);
        String status = (String) body.get("status");  // APPROVED, REJECTED
        String reason = (String) body.getOrDefault("reason", "");
        
        if (!status.matches("(APPROVED|REJECTED)")) {
            return ResponseEntity.ok(ApiResponse.error(400, "状态值非法"));
        }
        
        boolean success = commentService.reviewComment(commentId, status, reason, adminId);
        if (!success) {
            return ResponseEntity.ok(ApiResponse.error(404, "评论不存在"));
        }
        
        return ResponseEntity.ok(ApiResponse.success());
    }
}