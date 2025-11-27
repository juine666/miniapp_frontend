package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.stylemirror.miniapp_backend.domain.Comment;
import com.stylemirror.miniapp_backend.domain.User;

import java.util.List;

/**
 * 评论服务接口
 */
public interface CommentService extends IService<Comment> {
    
    /**
     * 发布评论（一级或二级）
     */
    Comment publishComment(Comment comment, Long userId);
    
    /**
     * 获取产品的一级评论（分页，按热度+时间排序）
     */
    Page<Comment> getProductComments(Long productId, Integer pageNum, Integer pageSize, Long currentUserId);
    
    /**
     * 获取一级评论的二级回复
     */
    List<Comment> getReplies(Long commentId, Long currentUserId);
    
    /**
     * 编辑评论（仅本人可编辑）
     */
    boolean updateComment(Long commentId, String content, Long userId);
    
    /**
     * 删除评论（仅本人或管理员可删除）
     */
    boolean deleteComment(Long commentId, Long userId, Boolean isAdmin);
    
    /**
     * 获取单个评论详情（包含用户信息和二级回复）
     */
    Comment getCommentDetail(Long commentId, Long currentUserId);
}
