package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.IService;
import com.stylemirror.miniapp_backend.domain.CommentLike;

/**
 * 评论点赞服务接口
 */
public interface CommentLikeService extends IService<CommentLike> {
    
    /**
     * 点赞或取消点赞
     */
    void toggleLike(Long commentId, Long userId);
    
    /**
     * 检查用户是否已点赞
     */
    boolean isLiked(Long commentId, Long userId);
    
    /**
     * 删除评论的所有点赞记录
     */
    void deleteByCommentId(Long commentId);
}
