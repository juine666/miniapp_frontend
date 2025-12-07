package com.stylemirror.miniapp_backend.util;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class PreferenceExtractorTest {

    @Test
    void shouldExtractLikePreference() {
        List<PreferenceExtractor.Preference> preferences = PreferenceExtractor.extract("我喜欢明亮的色彩搭配");
        assertThat(preferences).hasSize(1);
        assertThat(preferences.get(0).key()).isEqualTo("喜好");
        assertThat(preferences.get(0).value()).contains("明亮");
    }

    @Test
    void shouldExtractMultiplePatterns() {
        String text = "我偏好复古风，同时我想要一件黑色西装";
        List<PreferenceExtractor.Preference> preferences = PreferenceExtractor.extract(text);
        assertThat(preferences)
                .extracting(PreferenceExtractor.Preference::key)
                .containsExactlyInAnyOrder("偏好", "需求");
    }

    @Test
    void shouldReturnEmptyWhenNoSignal() {
        List<PreferenceExtractor.Preference> preferences = PreferenceExtractor.extract("今天的天气不错");
        assertThat(preferences).isEmpty();
    }
}
