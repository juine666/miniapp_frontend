package com.stylemirror.miniapp_backend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.stylemirror.miniapp_backend.domain.ShareLink;
import com.stylemirror.miniapp_backend.repository.ShareLinkMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * 分享链接服务类
 * 负责分享链接的CRUD操作
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ShareLinkService {
    private final ShareLinkMapper shareLinkMapper;

    /**
     * 根据分享码查询分享链接
     */
    public Optional<ShareLink> findByCode(String code) {
        QueryWrapper<ShareLink> wrapper = new QueryWrapper<>();
        wrapper.eq("code", code);
        return Optional.ofNullable(shareLinkMapper.selectOne(wrapper));
    }

    /**
     * 保存分享链接（新增或更新）
     */
    @Transactional(rollbackFor = Exception.class)
    public ShareLink save(ShareLink shareLink) {
        if (shareLink.getId() == null) {
            shareLinkMapper.insert(shareLink);
            log.info("新增分享链接，ID: {}, 分享码: {}", shareLink.getId(), shareLink.getCode());
        } else {
            shareLinkMapper.updateById(shareLink);
            log.info("更新分享链接，ID: {}, 分享码: {}", shareLink.getId(), shareLink.getCode());
        }
        return shareLink;
    }
}

