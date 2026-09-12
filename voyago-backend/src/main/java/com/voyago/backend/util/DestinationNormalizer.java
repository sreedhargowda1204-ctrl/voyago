package com.voyago.backend.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Utility for normalizing user destination input for robust catalog matching.
 */
public final class DestinationNormalizer {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern MULTI_SPACE = Pattern.compile("\\s+");
    private static final Pattern NON_ALPHANUMERIC_SPACE = Pattern.compile("[^a-z0-9\\s]");

    private DestinationNormalizer() {
        // utility class
    }

    /**
     * Standard normalization for catalog indexing and searching.
     * Trims, removes accents, strips qualifiers like ", Karnataka" or ", India",
     * lowercases, and collapses whitespace.
     */
    public static String normalize(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        // 1. Strip country/state qualifiers if present (e.g. "Sakleshpur, Karnataka, India" -> "Sakleshpur")
        String cleaned = input.trim();
        int commaIdx = cleaned.indexOf(',');
        if (commaIdx > 0) {
            cleaned = cleaned.substring(0, commaIdx).trim();
        }

        // 2. Normalize unicode accents/diacritics
        String decomposed = Normalizer.normalize(cleaned, Normalizer.Form.NFD);
        String withoutDiacritics = DIACRITICS.matcher(decomposed).replaceAll("");

        // 3. Lowercase
        String lower = withoutDiacritics.toLowerCase(Locale.ROOT);

        // 4. Replace hyphens and underscores with space
        lower = lower.replace('-', ' ').replace('_', ' ');

        // 5. Remove any remaining non-alphanumeric except space
        String alphaNum = NON_ALPHANUMERIC_SPACE.matcher(lower).replaceAll("");

        // 6. Collapse multi-spaces
        return MULTI_SPACE.matcher(alphaNum).replaceAll(" ").trim();
    }

    /**
     * Generates a simplified phonetic/stemmed variant for resilient matching
     * (e.g., "sakleshpura" and "sakleshpur" and "sakaleshpura" both map to "sakleshpur").
     */
    public static String stem(String normalized) {
        if (normalized == null || normalized.isBlank()) {
            return "";
        }

        String s = normalized;

        // Common Karnataka English transliteration standardizations:
        // "oo" -> "u" (e.g., "bengalooru" -> "bengaluru")
        s = s.replace("oo", "u");
        // "ee" -> "i" (e.g., "halebeedu" -> "halebidu")
        s = s.replace("ee", "i");

        // Standardize "pura" -> "pur", "nagara" -> "nagar"
        if (s.endsWith("pura")) {
            s = s.substring(0, s.length() - 1); // "pur"
        } else if (s.endsWith("nagara")) {
            s = s.substring(0, s.length() - 1); // "nagar"
        } else if (s.endsWith("giri") || s.endsWith("betta")) {
            // retain
        }

        // Handle internal syllable variants like "sakalesh" -> "saklesh"
        s = s.replace("sakalesh", "saklesh");

        return s;
    }
}
