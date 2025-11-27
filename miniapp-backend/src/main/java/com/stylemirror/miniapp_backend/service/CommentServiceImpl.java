package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.stylemirror.miniapp_backend.domain.Comment;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.repository.CommentMapper;
import com.stylemirror.miniapp_backend.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 评论服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CommentServiceImpl extends ServiceImpl<CommentMapper, Comment> implements CommentService {
    
    private final CommentMapper commentMapper;
    private final UserMapper userMapper;
    private final CommentLikeService commentLikeService;
    
    @Override
    public Comment publishComment(Comment comment, Long userId) {
        comment.setUserId(userId);
        comment.setLikes(0);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        
        this.save(comment);
        
        // 获取用户信息
        User user = userMapper.selectById(userId);
        comment.setUser(user);
        
        return comment;
    }
    
    @Override
    public Page<Comment> getProductComments(Long productId, Integer pageNum, Integer pageSize, Long currentUserId) {
        Page<Comment> page = new Page<>(pageNum, pageSize);
        
        // 获取一级评论（按热度排序）
        Page<Comment> result = commentMapper.selectProductCommentsByHot(page, productId);
        
        // 为每个一级评论添加用户信息、二级回复和点赞状态
        result.getRecords().forEach(comment -> {
            // 获取用户信息
            User user = userMapper.selectById(comment.getUserId());
            comment.setUser(user);
            
            // 获取二级回复
            List<Comment> replies = getReplies(comment.getId(), currentUserId);
            comment.setReplies(replies);
            
            // 获取点赞状态
            if (currentUserId != null) {
                boolean isLiked = commentLikeService.isLiked(comment.getId(), currentUserId);
                comment.setIsLiked(isLiked);
            } else {
                comment.setIsLiked(false);
            }
        });
        
        return result;
    }
    
    @Override
    public List<Comment> getReplies(Long commentId, Long currentUserId) {
        List<Comment> replies = commentMapper.selectRepliesByParentId(commentId);
        
        replies.forEach(reply -> {
            // 获取用户信息
            User user = userMapper.selectById(reply.getUserId());
            reply.setUser(user);
            
            // 获取点赞状态
            if (currentUserId != null) {
                boolean isLiked = commentLikeService.isLiked(reply.getId(), currentUserId);
                reply.setIsLiked(isLiked);
            } else {
                reply.setIsLiked(false);
            }
        });
        
        return replies;
    }
    
    @Override
    public boolean updateComment(Long commentId, String content, Long userId) {
        Comment comment = this.getById(commentId);
        if (comment == null) {
            return false;
        }
        
        // 只有评论者本人才能编辑
        if (!comment.getUserId().equals(userId)) {
            return false;
        }
        
        comment.setContent(content);
        comment.setUpdatedAt(LocalDateTime.now());
        
        return this.updateById(comment);
    }
    
    @Override
    public boolean deleteComment(Long commentId, Long userId, Boolean isAdmin) {
        Comment comment = this.getById(commentId);
        if (comment == null) {
            return false;
        }
        
        // 只有评论者本人或管理员才能删除
        if (!comment.getUserId().equals(userId) && !isAdmin) {
            return false;
        }
        
        // 删除评论及其相关的点赞记录
        commentLikeService.deleteByCommentId(commentId);
        
        // 如果是一级评论，还需要删除所有二级回复
        if (comment.getParentId() == null) {
            QueryWrapper<Comment> wrapper = new QueryWrapper<>();
            wrapper.eq("parent_id", commentId);
            List<Comment> replies = this.list(wrapper);
            for (Comment reply : replies) {
                commentLikeService.deleteByCommentId(reply.getId());
            }
            this.remove(wrapper);
        }
        
        return this.removeById(commentId);
    }
    
    @Override
    public Comment getCommentDetail(Long commentId, Long currentUserId) {
        Comment comment = this.getById(commentId);
        if (comment == null) {
            return null;
        }
        
        // 获取用户信息
        User user = userMapper.selectById(comment.getUserId());
        comment.setUser(user);
        
        // 获取点赞状态
        if (currentUserId != null) {
            boolean isLiked = commentLikeService.isLiked(commentId, currentUserId);
            comment.setIsLiked(isLiked);
        } else {
            comment.setIsLiked(false);
        }
        
        // 如果是一级评论，获取二级回复
        if (comment.getParentId() == null) {
            List<Comment> replies = getReplies(commentId, currentUserId);
            comment.setReplies(replies);
        }
        
        return comment;
    }
}
