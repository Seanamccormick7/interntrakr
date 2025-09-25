package com.interntrackr.reco.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
public class ScoringService {
    public double score(String text, Set<String> keywords) {
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return 0.0;
        }

        String normalized = text.toLowerCase(Locale.ROOT);
        String[] tokens = normalized.split("[^a-z0-9]+");
        Set<String> tokenSet = new HashSet<>(Arrays.asList(tokens));
        tokenSet.remove("");

        int overlap = 0;
        for (String kw : keywords) {
            if (kw == null) continue;
            String k = kw.toLowerCase(Locale.ROOT).trim();
            if (k.isEmpty()) continue;
            if (tokenSet.contains(k)) {
                overlap++;
            }
        }

        if (keywords.isEmpty()) return 0.0;
        return (double) overlap / (double) keywords.size();
    }
}


