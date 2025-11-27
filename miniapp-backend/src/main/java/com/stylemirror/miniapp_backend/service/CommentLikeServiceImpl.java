package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.Comment;
import com.stylemirror.miniapp_backend.domain.CommentLike;
import com.stylemirror.miniapp_backend.repository.CommentLikeMapper;
import com.stylemirror.miniapp_backend.repository.CommentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 评论点赞服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentLikeServiceImpl extends ServiceImpl<CommentLikeMapper, CommentLike> implements CommentLikeService {
    
    private final CommentLikeMapper commentLikeMapper;
    private final CommentMapper commentMapper;
    
    @Override
    @Transactional
    public void toggleLike(Long commentId, Long userId) {
        QueryWrapper<CommentLike> wrapper = new QueryWrapper<>();
        wrapper.eq("comment_id", commentId).eq("user_id", userId);
        
        CommentLike existing = this.getOne(wrapper);
        
        if (existing != null) {
            // 已点赞，取消点赞
            this.removeById(existing.getId());
            
            // 更新评论的点赞数
            Comment comment = commentMapper.selectById(commentId);
            if (comment != null && comment.getLikes() > 0) {
                comment.setLikes(comment.getLikes() - 1);
                commentMapper.updateById(comment);
            }
        } else {
            // 未点赞，添加点赞
            CommentLike like = CommentLike.builder()
                    .commentId(commentId)
                    .userId(userId)
                    .createdAt(LocalDateTime.now())
                    .build();
            this.save(like);
            
            // 更新评论的点赞数
            Comment comment = commentMapper.selectById(commentId);
            if (comment != null) {
                comment.setLikes(comment.getLikes() + 1);
                commentMapper.updateById(comment);
            }
        }
    }
    
    @Override
    public boolean isLiked(Long commentId, Long userId) {
        QueryWrapper<CommentLike> wrapper = new QueryWrapper<>();
        wrapper.eq("comment_id", commentId).eq("user_id", userId);
        return this.count(wrapper) > 0;
    }
    
    @Override
    public void deleteByCommentId(Long commentId) {
        QueryWrapper<CommentLike> wrapper = new QueryWrapper<>();
        wrapper.eq("comment_id", commentId);
        this.remove(wrapper);
    }
}
