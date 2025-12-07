package com.stylemirror.miniapp_backend.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AudioFormatResolverTest {

    @Test
    void shouldResolveByExtension() {
        assertThat(AudioFormatResolver.resolve("sample.MP3", null)).isEqualTo("mp3");
        assertThat(AudioFormatResolver.resolve("voice.wav", null)).isEqualTo("wav");
    }

    @Test
    void shouldResolveByContentTypeWhenNoExtension() {
        assertThat(AudioFormatResolver.resolve("audio", "audio/x-m4a")).isEqualTo("m4a");
    }

    @Test
    void shouldFallbackToWav() {
        assertThat(AudioFormatResolver.resolve(null, null)).isEqualTo("wav");
        assertThat(AudioFormatResolver.resolve("file.unknown", "application/octet-stream")).isEqualTo("wav");
    }
}
