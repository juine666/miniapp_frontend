package com.stylemirror.miniapp_backend.repository;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.domain.Comment;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 评论 Mapper
 */
@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
    
    /**
     * 获取产品的一级评论（分页，按热度排序）
     */
    Page<Comment> selectProductCommentsByHot(@Param("page") Page<Comment> page, 
                                             @Param("productId") Long productId);
    
    /**
     * 获取一级评论的所有二级回复（按时间倒序）
     */
    List<Comment> selectRepliesByParentId(@Param("parentId") Long parentId);
    
    /**
     * 获取产品的所有评论（包含一级和二级）
     */
    List<Comment> selectAllCommentsByProductId(@Param("productId") Long productId);
}
