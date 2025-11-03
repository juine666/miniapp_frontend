package com.stylemirror.miniapp_backend.service;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModerationService {
    private static final List<String> BANNED = List.of(
            "黄赌毒", "赌博", "毒品", "色情", "涉政"
    );

    public void assertCleanText(String text) {
        if (text == null || text.isBlank()) return;
        for (String w : BANNED) {
            if (text.contains(w)) {
                throw new IllegalArgumentException("内容包含违规信息");
            }
        }
    }
}


