package com.stylemirror.miniapp_backend.service;

import com.tencentcloudapi.asr.v20190614.AsrClient;
import com.tencentcloudapi.asr.v20190614.models.SentenceRecognitionRequest;
import com.tencentcloudapi.asr.v20190614.models.SentenceRecognitionResponse;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.common.profile.ClientProfile;
import com.tencentcloudapi.common.profile.HttpProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TencentSpeechRecognitionService implements SpeechRecognitionService {

    private final SystemConfigService systemConfigService;

    @Override
    public String transcribe(byte[] audioData, String format, String language) {
        if (audioData == null || audioData.length == 0) {
            return null;
        }

        String secretId = systemConfigService.getConfigValue("tencent.secretId");
        String secretKey = systemConfigService.getConfigValue("tencent.secretKey");
        String region = systemConfigService.getConfigValue("tencent.region");
        if (region == null || region.isEmpty()) {
            region = "ap-beijing";
        }
        if (secretId == null || secretId.isEmpty() || secretKey == null || secretKey.isEmpty()) {
            log.warn("腾讯云密钥未配置，无法进行语音识别");
            return null;
        }

        try {
            Credential cred = new Credential(secretId, secretKey);
            HttpProfile httpProfile = new HttpProfile();
            httpProfile.setEndpoint("asr.tencentcloudapi.com");
            ClientProfile clientProfile = new ClientProfile();
            clientProfile.setHttpProfile(httpProfile);
            AsrClient client = new AsrClient(cred, region, clientProfile);

            SentenceRecognitionRequest req = new SentenceRecognitionRequest();
            req.setProjectId(0L);
            req.setSubServiceType(2L);
            req.setEngSerViceType(mapLanguage(language));
            req.setSourceType(1L);
            req.setVoiceFormat(normalizeFormat(format));
            req.setDataLen((long) audioData.length);
            req.setData(Base64.getEncoder().encodeToString(audioData));
            req.setUsrAudioKey("ai-chat-" + UUID.randomUUID());

            SentenceRecognitionResponse resp = client.SentenceRecognition(req);
            if (resp != null && resp.getResult() != null) {
                return resp.getResult().trim();
            }
        } catch (TencentCloudSDKException e) {
            log.error("腾讯云语音识别错误: {}", e.getMessage());
        } catch (Exception e) {
            log.error("语音识别异常", e);
        }
        return null;
    }

    private String mapLanguage(String language) {
        if (language == null || language.isBlank()) {
            return "16k_zh";
        }
        String normalized = language.toLowerCase(Locale.ROOT);
        if (normalized.contains("en")) {
            return "16k_en";
        }
        if (normalized.contains("canton")) {
            return "16k_yue";
        }
        if (normalized.contains("sichuan")) {
            return "16k_ca";
        }
        return "16k_zh";
    }

    private String normalizeFormat(String format) {
        if (format == null || format.isBlank()) {
            return "wav";
        }
        String normalized = format.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "mp3", "wav", "silk", "ogg", "m4a", "flac", "aac", "amr" -> normalized;
            default -> "wav";
        };
    }
}
