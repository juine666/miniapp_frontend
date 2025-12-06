package com.stylemirror.miniapp_backend.service;

import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import com.tencentcloudapi.tts.v20190823.TtsClient;
import com.tencentcloudapi.tts.v20190823.models.TextToVoiceRequest;
import com.tencentcloudapi.tts.v20190823.models.TextToVoiceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * TTS服务 - 腾讯云实现
 */
@Slf4j
@Service
public class MockTTSService implements TTSService {

    private final SystemConfigService systemConfigService;

    public MockTTSService(SystemConfigService systemConfigService) {
        this.systemConfigService = systemConfigService;
    }

    @Override
    public String synthesizeVoice(String text, String voice, String language) {
        try {
            if (text == null || text.isEmpty()) {
                return null;
            }
            
            // 检查去除首尾空白后是否为空
            if (text.trim().isEmpty()) {
                // 如果只有空白字符，返回空音频
                return null;
            }

            // 从数据库读取腾讯云配置
            String secretId = systemConfigService.getConfigValue("tencent.secretId");
            String secretKey = systemConfigService.getConfigValue("tencent.secretKey");
            String region = systemConfigService.getConfigValue("tencent.region");

            if (region == null || region.isEmpty()) {
                region = "ap-beijing";
            }

            if (secretId == null || secretId.isEmpty() || secretKey == null || secretKey.isEmpty()) {
                log.warn("腾讯云密钥未配置，TTS 合成失败");
                return null;
            }

            log.info("调用腾讯云 TTS API: text={}, voice={}", text, voice);

            // 使用官方SDK调用腾讯云TTS
            Credential cred = new Credential(secretId, secretKey);
            HttpProfile httpProfile = new HttpProfile();
            httpProfile.setEndpoint("tts.tencentcloudapi.com");
            ClientProfile clientProfile = new ClientProfile();
            clientProfile.setHttpProfile(httpProfile);
            TtsClient client = new TtsClient(cred, region, clientProfile);

            // 构建请求
            TextToVoiceRequest req = new TextToVoiceRequest();
            req.setText(text);
            req.setCodec("mp3");
            req.setSessionId("miniapp-" + UUID.randomUUID().toString());
            
            // 确定语音类型
            long voiceType = 1001L;  // 默认女声(中文)
            if ("male".equals(voice)) {
                voiceType = 1002L;  // 男声(中文)
            }
            
            // 根据语言选择语音模型
            if ("en-US".equals(language)) {
                voiceType = "male".equals(voice) ? 1051L : 1050L;  // 英文男女声
            } else if ("zh-CN".equals(language)) {
                voiceType = "male".equals(voice) ? 1002L : 1001L;  // 中文男女声
            }
            
            req.setVoiceType(voiceType);

            // 调用API
            TextToVoiceResponse resp = client.TextToVoice(req);
            
            String audio = resp.getAudio();
            if (audio != null && !audio.isEmpty()) {
                log.info("TTS 合成成功");
                return "data:audio/mp3;base64," + audio;
            } else {
                log.warn("TTS API 响应中没有 Audio 字段");
                return null;
            }

        } catch (TencentCloudSDKException e) {
            log.error("腾讯云 TTS API 错误: {}", e.getMessage());
            return null;
        } catch (Exception e) {
            log.error("TTS 异常: {}", e.getMessage(), e);
            return null;
        }
    }
}
