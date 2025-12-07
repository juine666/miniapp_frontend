package com.stylemirror.miniapp_backend.util;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class PreferenceExtractor {

    private static final Pattern LIKE_PATTERN = Pattern.compile("我(?:很|非常)?喜欢([^，。！？!?.]+)");
    private static final Pattern WANT_PATTERN = Pattern.compile("我想要([^，。！？!?.]+)");
    private static final Pattern PREFER_PATTERN = Pattern.compile("我偏好([^，。！？!?.]+)");

    private PreferenceExtractor() {}

    public static List<Preference> extract(String text) {
        List<Preference> preferences = new ArrayList<>();
        if (text == null || text.isBlank()) {
            return preferences;
        }
        addMatches(preferences, "喜好", LIKE_PATTERN.matcher(text), 0.75);
        addMatches(preferences, "需求", WANT_PATTERN.matcher(text), 0.65);
        addMatches(preferences, "偏好", PREFER_PATTERN.matcher(text), 0.7);
        return preferences;
    }

    private static void addMatches(List<Preference> preferences, String key, Matcher matcher, double confidence) {
        while (matcher.find()) {
            String value = matcher.group(1).trim();
            if (!value.isEmpty()) {
                preferences.add(new Preference(key, value, confidence));
            }
        }
    }

    public record Preference(String key, String value, double confidence) {}
}
