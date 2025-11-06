package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.stylemirror.miniapp_backend.common.PageResponse;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

/**
 * 用户服务类
 * 负责用户的CRUD操作，集成Redis缓存
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserMapper userMapper;
    private final CacheService cacheService;

    /**
     * 查询所有用户
     */
    public List<User> findAll() {
        return userMapper.selectList(null);
    }

    /**
     * 分页查询用户列表（管理端使用）
     * 
     * @param page 页码（从0开始）
     * @param size 每页大小
     * @param keyword 搜索关键词（昵称、OpenID）
     * @param banned 封禁状态筛选（null表示全部，true表示已封禁，false表示正常）
     * @return 分页响应
     */
    public PageResponse<User> findPage(int page, int size, String keyword, Boolean banned) {
        Page<User> pageObj = new Page<>(page, size);
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        
        // 关键词搜索：昵称或OpenID
        if (StringUtils.hasText(keyword)) {
            wrapper.and(w -> w.like("nickname", keyword)
                    .or()
                    .like("openid", keyword));
        }
        
        // 封禁状态筛选
        if (banned != null) {
            wrapper.eq("banned", banned);
        }
        
        // 按创建时间倒序
        wrapper.orderByDesc("created_at");
        
        Page<User> result = userMapper.selectPage(pageObj, wrapper);
        return PageResponse.of(result.getRecords(), (int) result.getCurrent(), (int) result.getSize(), result.getTotal());
    }

    /**
     * 根据ID查询用户（带缓存）
     */
    public Optional<User> findById(Long id) {
        if (id == null) {
            return Optional.empty();
        }

        // 先从缓存获取
        String cacheKey = cacheService.getUserKey(id);
        User cachedUser = cacheService.get(cacheKey, User.class);
        if (cachedUser != null) {
            log.debug("从缓存获取用户: ID={}", id);
            return Optional.of(cachedUser);
        }

        // 缓存未命中，从数据库查询
        User user = userMapper.selectById(id);
        if (user != null) {
            // 写入缓存
            cacheService.set(cacheKey, user);
            log.debug("从数据库获取用户并写入缓存: ID={}", id);
        }
        return Optional.ofNullable(user);
    }

    /**
     * 根据OpenID查询用户（带缓存）
     */
    public Optional<User> findByOpenid(String openid) {
        if (openid == null || openid.isEmpty()) {
            return Optional.empty();
        }

        // 先从缓存获取（通过OpenID的缓存key）
        String openidCacheKey = cacheService.getUserOpenidKey(openid);
        User cachedUser = cacheService.get(openidCacheKey, User.class);
        if (cachedUser != null) {
            log.debug("从缓存获取用户: OpenID={}", openid);
            return Optional.of(cachedUser);
        }

        // 缓存未命中，从数据库查询
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("openid", openid);
        User user = userMapper.selectOne(wrapper);
        
        if (user != null) {
            // 写入两个缓存：ID和OpenID
            String idCacheKey = cacheService.getUserKey(user.getId());
            cacheService.set(idCacheKey, user);
            cacheService.set(openidCacheKey, user);
            log.debug("从数据库获取用户并写入缓存: OpenID={}, ID={}", openid, user.getId());
        }
        return Optional.ofNullable(user);
    }

    /**
     * 封禁/解封用户
     * 
     * @param id 用户ID
     * @param banned 是否封禁
     * @return 更新后的用户
     */
    @Transactional(rollbackFor = Exception.class)
    public User updateBanStatus(Long id, boolean banned) {
        User user = findById(id)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在，ID: " + id));
        user.setBanned(banned);
        return save(user);
    }

    /**
     * 保存用户（新增或更新，同步更新缓存）
     */
    @Transactional(rollbackFor = Exception.class)
    public User save(User user) {
        boolean isNew = user.getId() == null;
        
        if (isNew) {
            userMapper.insert(user);
            log.info("新增用户，ID: {}, OpenID: {}", user.getId(), user.getOpenid());
        } else {
            userMapper.updateById(user);
            log.info("更新用户，ID: {}, OpenID: {}", user.getId(), user.getOpenid());
            
            // 删除旧缓存
            String cacheKey = cacheService.getUserKey(user.getId());
            cacheService.delete(cacheKey);
            if (user.getOpenid() != null) {
                String openidCacheKey = cacheService.getUserOpenidKey(user.getOpenid());
                cacheService.delete(openidCacheKey);
            }
        }
        
        // 写入新缓存
        if (user.getId() != null) {
            String idCacheKey = cacheService.getUserKey(user.getId());
            cacheService.set(idCacheKey, user);
            
            if (user.getOpenid() != null) {
                String openidCacheKey = cacheService.getUserOpenidKey(user.getOpenid());
                cacheService.set(openidCacheKey, user);
            }
            log.debug("更新用户缓存: ID={}, OpenID={}", user.getId(), user.getOpenid());
        }
        
        return user;
    }

    /**
     * 删除用户缓存
     */
    public void evictUserCache(Long userId) {
        if (userId != null) {
            String cacheKey = cacheService.getUserKey(userId);
            cacheService.delete(cacheKey);
            log.debug("删除用户缓存: ID={}", userId);
        }
    }

    /**
     * 删除用户OpenID缓存
     */
    public void evictUserCacheByOpenid(String openid) {
        if (openid != null && !openid.isEmpty()) {
            String cacheKey = cacheService.getUserOpenidKey(openid);
            cacheService.delete(cacheKey);
            log.debug("删除用户OpenID缓存: OpenID={}", openid);
        }
    }
}

