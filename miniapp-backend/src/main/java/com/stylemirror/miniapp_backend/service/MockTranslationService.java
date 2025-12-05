package com.stylemirror.miniapp_backend.service;

import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.tmt.v20180321.TmtClient;
import com.tencentcloudapi.tmt.v20180321.models.TextTranslateRequest;
import com.tencentcloudapi.tmt.v20180321.models.TextTranslateResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 翻译服务 - 腾讯云实现
 */
@Slf4j
@Service
public class MockTranslationService implements TranslationService {

    private final SystemConfigService systemConfigService;

    public MockTranslationService(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @Override
    public String translateToEnglish(String text) {
        try {
            if (text == null || text.trim().isEmpty()) {
                return text;
            }

            // 从数据库读取腾讯云配置
            String secretId = systemConfigService.getConfigValue("tencent.secretId");
            String secretKey = systemConfigService.getConfigValue("tencent.secretKey");
            String region = systemConfigService.getConfigValue("tencent.region");

            if (region == null || region.isEmpty()) {
                region = "ap-beijing";
            }

            // 如果没有配置密钥，返回Mock数据
            if (secretId == null || secretId.isEmpty() || secretKey == null || secretKey.isEmpty()) {
                log.warn("腾讯云密钥未配置，返回原文");
                return text;
            }

            log.info("调用腾讯云翻译 API: {}", text);

            // 使用官方SDK调用腾讯云翻译
            Credential cred = new Credential(secretId, secretKey);
            HttpProfile httpProfile = new HttpProfile();
            httpProfile.setEndpoint("tmt.tencentcloudapi.com");
            ClientProfile clientProfile = new ClientProfile();
            clientProfile.setHttpProfile(httpProfile);
            TmtClient client = new TmtClient(cred, region, clientProfile);

            // 构建请求
            TextTranslateRequest req = new TextTranslateRequest();
            req.setSourceText(text);
            req.setSource("zh");
            req.setTarget("en");
            req.setProjectId(0L);

            // 调用API
            TextTranslateResponse resp = client.TextTranslate(req);
            
            String translatedText = resp.getTargetText();
            log.info("翻译成功: {} -> {}", text, translatedText);
            return translatedText;

        } catch (TencentCloudSDKException e) {
            log.error("腾讯云翻译 API 错误: {}", e.getMessage());
            // API调用失败时返回原文
            return text;
        } catch (Exception e) {
            log.error("翻译异常: {}", e.getMessage(), e);
            return text;
        }
    }
// ... 删除不需要的辅助方法
}
