package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.stylemirror.miniapp_backend.domain.ContactInfo;
import com.stylemirror.miniapp_backend.repository.ContactInfoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 联系方式服务类
 * 负责联系方式的CRUD操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ContactInfoService {
    private final ContactInfoMapper contactInfoMapper;

    /**
     * 根据用户ID查询联系方式
     */
    public Optional<ContactInfo> findByUserId(Long userId) {
        QueryWrapper<ContactInfo> wrapper = new QueryWrapper<>();
        wrapper.eq("user_id", userId);
        return Optional.ofNullable(contactInfoMapper.selectOne(wrapper));
    }

    /**
     * 保存联系方式（新增或更新）
     */
    @Transactional(rollbackFor = Exception.class)
    public ContactInfo save(ContactInfo contactInfo) {
        if (contactInfo.getId() == null) {
            contactInfoMapper.insert(contactInfo);
            log.info("新增联系方式，ID: {}, 用户ID: {}", contactInfo.getId(), contactInfo.getUserId());
        } else {
            contactInfoMapper.updateById(contactInfo);
            log.info("更新联系方式，ID: {}, 用户ID: {}", contactInfo.getId(), contactInfo.getUserId());
        }
        return contactInfo;
    }
}

