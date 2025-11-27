package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.stylemirror.miniapp_backend.domain.CommentLike;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 评论点赞 Mapper
 */
@Mapper
public interface CommentLikeMapper extends BaseMapper<CommentLike> {
    
    /**
     * 检查用户是否已点赞该评论
     */
    boolean isLiked(@Param("commentId") Long commentId, @Param("userId") Long userId);
    
    /**
     * 获取评论的点赞数
     */
    Integer countLikes(@Param("commentId") Long commentId);
    
    /**
     * 获取点赞该评论的所有用户ID
     */
    List<Long> selectUserIdsByCommentId(@Param("commentId") Long commentId);
}
