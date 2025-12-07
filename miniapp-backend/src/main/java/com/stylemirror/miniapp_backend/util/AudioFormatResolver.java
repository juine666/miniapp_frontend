package com.stylemirror.miniapp_backend.util;

import java.util.Locale;
import java.util.Map;

public final class AudioFormatResolver {

    private static final Map<String, String> CONTENT_TYPE_MAP = Map.ofEntries(
            Map.entry("audio/wav", "wav"),
            Map.entry("audio/x-wav", "wav"),
            Map.entry("audio/mpeg", "mp3"),
            Map.entry("audio/mp3", "mp3"),
            Map.entry("audio/mp4", "m4a"),
            Map.entry("audio/x-m4a", "m4a"),
            Map.entry("audio/aac", "aac"),
            Map.entry("audio/amr", "amr"),
            Map.entry("audio/3gpp", "amr"),
            Map.entry("audio/ogg", "ogg")
    );

    private AudioFormatResolver() {
    }

    public static String resolve(String filename, String contentType) {
        String byExtension = resolveByExtension(filename);
        if (byExtension != null) {
            return byExtension;
        }
        String byContentType = resolveByContentType(contentType);
        return byContentType != null ? byContentType : "wav";
    }

    private static String resolveByExtension(String filename) {
        if (filename == null) {
            return null;
        }
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) {
            return null;
        }
        String ext = filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        return normalize(ext);
    }

    private static String resolveByContentType(String contentType) {
        if (contentType == null) {
            return null;
        }
        return CONTENT_TYPE_MAP.get(contentType.toLowerCase(Locale.ROOT));
    }

    private static String normalize(String ext) {
        return switch (ext) {
            case "mp3", "wav", "m4a", "aac", "amr", "ogg", "flac", "silk" -> ext;
            default -> null;
        };
    }
}
