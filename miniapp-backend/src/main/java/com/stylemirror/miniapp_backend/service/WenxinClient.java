package com.stylemirror.miniapp_backend.service;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WenxinClient {

    private static final String TOKEN_URL = "https://aip.baidubce.com/oauth/2.0/token";
    private static final String CHAT_URL_TEMPLATE = "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions/%s";
    private static final String TOKEN_CACHE_KEY = "wenxin:access_token";
    private static final long TOKEN_BUFFER_SECONDS = 120;

    private final RestTemplate restTemplate;
    private final SystemConfigService systemConfigService;
    private final CacheService cacheService;

    public ChatCompletion chat(List<Message> messages) {
        if (messages == null || messages.isEmpty()) {
            throw new IllegalArgumentException("消息不能为空");
        }

        String model = Optional.ofNullable(systemConfigService.getConfigValue("wenxin.model"))
                .filter(s -> !s.isBlank())
                .orElse("ernie-lite-8k");

        String accessToken = getAccessToken();
        String url = UriComponentsBuilder
                .fromHttpUrl(String.format(CHAT_URL_TEMPLATE, model))
                .queryParam("access_token", accessToken)
                .toUriString();

        Map<String, Object> payload = new HashMap<>();
        payload.put("messages", messages.stream()
                .map(m -> Map.of("role", m.role(), "content", m.content()))
                .collect(Collectors.toList()));
        payload.put("stream", false);
        payload.put("temperature", 0.8);
        payload.put("disable_search", false);

        WenxinResponse response = restTemplate.postForObject(url, payload, WenxinResponse.class);
        if (response == null) {
            throw new IllegalStateException("文心一言返回为空");
        }
        if (response.errorCode != null && response.errorCode != 0) {
            log.error("文心一言调用失败: {} - {}", response.errorCode, response.errorMsg);
            throw new IllegalStateException("文心一言接口错误: " + response.errorMsg);
        }
        if (response.result == null || response.result.isBlank()) {
            throw new IllegalStateException("文心一言未返回结果");
        }

        Usage usage = response.usage;
        return new ChatCompletion(response.result.trim(),
                usage != null ? usage.promptTokens : null,
                usage != null ? usage.completionTokens : null,
                usage != null ? usage.totalTokens : null);
    }

    private String getAccessToken() {
        String cached = cacheService.get(TOKEN_CACHE_KEY, String.class);
        if (cached != null && !cached.isBlank()) {
            return cached;
        }
        synchronized (this) {
            cached = cacheService.get(TOKEN_CACHE_KEY, String.class);
            if (cached != null && !cached.isBlank()) {
                return cached;
            }
            String apiKey = Objects.requireNonNull(systemConfigService.getConfigValue("wenxin.apiKey"), "请配置 wenxin.apiKey");
            String secretKey = Objects.requireNonNull(systemConfigService.getConfigValue("wenxin.secretKey"), "请配置 wenxin.secretKey");

            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("grant_type", "client_credentials");
            form.add("client_id", apiKey);
            form.add("client_secret", secretKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(form, headers);

            TokenResponse response = restTemplate.postForObject(TOKEN_URL, entity, TokenResponse.class);
            if (response == null || response.accessToken == null) {
                throw new IllegalStateException("获取文心一言 token 失败");
            }
            long expiresIn = Math.max(60, response.expiresIn - TOKEN_BUFFER_SECONDS);
            cacheService.set(TOKEN_CACHE_KEY, response.accessToken, expiresIn);
            return response.accessToken;
        }
    }

    public record Message(String role, String content) {}

    public record ChatCompletion(String content, Integer promptTokens, Integer completionTokens, Integer totalTokens) {}

    private static class TokenResponse {
        @JsonAlias("access_token")
        private String accessToken;
        @JsonAlias("expires_in")
        private Long expiresIn = Duration.ofHours(2).getSeconds();
        @JsonAlias("error_description")
        private String errorDescription;
    }

    private static class WenxinResponse {
        private Integer errorCode;
        private String errorMsg;
        private String result;
        private Usage usage;
        @JsonAlias("error_code")
        public void setErrorCode(Integer errorCode) {
            this.errorCode = errorCode;
        }
        @JsonAlias("error_msg")
        public void setErrorMsg(String errorMsg) {
            this.errorMsg = errorMsg;
        }
    }

    private static class Usage {
        @JsonAlias("prompt_tokens")
        private Integer promptTokens;
        @JsonAlias("completion_tokens")
        private Integer completionTokens;
        @JsonAlias("total_tokens")
        private Integer totalTokens;
    }
}
