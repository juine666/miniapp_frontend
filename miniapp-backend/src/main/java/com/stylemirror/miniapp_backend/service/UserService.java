package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.stylemirror.miniapp_backend.domain.User;
import com.stylemirror.miniapp_backend.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 用户服务类
 * 负责用户的CRUD操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserMapper userMapper;

    /**
     * 查询所有用户
     */
    public List<User> findAll() {
        return userMapper.selectList(null);
    }

    /**
     * 根据ID查询用户
     */
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(userMapper.selectById(id));
    }

    /**
     * 根据OpenID查询用户
     */
    public Optional<User> findByOpenid(String openid) {
        QueryWrapper<User> wrapper = new QueryWrapper<>();
        wrapper.eq("openid", openid);
        return Optional.ofNullable(userMapper.selectOne(wrapper));
    }

    /**
     * 保存用户（新增或更新）
     */
    @Transactional(rollbackFor = Exception.class)
    public User save(User user) {
        if (user.getId() == null) {
            userMapper.insert(user);
            log.info("新增用户，ID: {}, OpenID: {}", user.getId(), user.getOpenid());
        } else {
            userMapper.updateById(user);
            log.info("更新用户，ID: {}, OpenID: {}", user.getId(), user.getOpenid());
        }
        return user;
    }
}

