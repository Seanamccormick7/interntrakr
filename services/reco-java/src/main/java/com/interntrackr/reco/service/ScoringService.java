package com.interntrackr.reco.service;

import com.interntrackr.reco.dto.ScoreResponse;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScoringService {
    
    // Sample corpus for IDF calculation (in production, this would come from a database)
    private static final List<String> SAMPLE_CORPUS = Arrays.asList(
        "Java programming experience required for software development",
        "Python skills essential for data science and machine learning",
        "JavaScript knowledge needed for frontend web development",
        "SQL database management and query optimization",
        "React framework for building modern web applications",
        "Spring Boot microservices architecture and REST APIs",
        "Docker containerization and cloud deployment",
        "Git version control and collaborative development",
        "Agile methodology and project management",
        "Problem solving and analytical thinking skills"
    );

    public ScoreResponse enhancedScore(String text, Set<String> keywords) {
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return createEmptyResponse();
        }

        // Tokenize text and keywords
        Set<String> textTokens = tokenize(text);
        Set<String> keywordTokens = keywords.stream()
            .filter(Objects::nonNull)
            .map(this::normalize)
            .filter(token -> !token.isEmpty())
            .collect(Collectors.toSet());

        // Calculate traditional score
        double traditionalScore = calculateTraditionalScore(textTokens, keywordTokens);
        
        // Calculate TF-IDF score
        double tfidfScore = calculateTfIdfScore(text, keywordTokens);
        
        // Combine scores (weighted average)
        double combinedScore = (0.4 * traditionalScore) + (0.6 * tfidfScore);
        
        // Find missing keywords
        Set<String> missingKeywords = findMissingKeywords(textTokens, keywordTokens);
        
        // Determine urgency band
        ScoreResponse.UrgencyBand urgencyBand = determineUrgencyBand(combinedScore, missingKeywords.size(), keywordTokens.size());
        
        // Generate actionable tips
        List<String> actionableTips = generateActionableTips(missingKeywords, combinedScore, urgencyBand);
        
        return new ScoreResponse(
            Math.round(combinedScore * 100.0) / 100.0, // Round to 2 decimal places
            urgencyBand,
            missingKeywords,
            actionableTips,
            Math.round(tfidfScore * 100.0) / 100.0
        );
    }

    // Legacy method for backward compatibility
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

    private Set<String> tokenize(String text) {
        String normalized = normalize(text);
        String[] tokens = normalized.split("[^a-z0-9]+");
        return Arrays.stream(tokens)
            .filter(token -> !token.isEmpty())
            .collect(Collectors.toSet());
    }

    private String normalize(String text) {
        return text.toLowerCase(Locale.ROOT).trim();
    }

    private double calculateTraditionalScore(Set<String> textTokens, Set<String> keywordTokens) {
        if (keywordTokens.isEmpty()) return 0.0;
        
        long overlap = keywordTokens.stream()
            .mapToLong(keyword -> textTokens.contains(keyword) ? 1 : 0)
            .sum();
            
        return (double) overlap / keywordTokens.size();
    }

    private double calculateTfIdfScore(String text, Set<String> keywords) {
        if (keywords.isEmpty()) return 0.0;
        
        double totalTfIdf = 0.0;
        
        for (String keyword : keywords) {
            double tf = calculateTermFrequency(text, keyword);
            double idf = calculateInverseDocumentFrequency(keyword);
            totalTfIdf += tf * idf;
        }
        
        // Normalize by number of keywords
        return totalTfIdf / keywords.size();
    }

    private double calculateTermFrequency(String text, String term) {
        String normalizedText = normalize(text);
        String normalizedTerm = normalize(term);
        
        if (normalizedTerm.isEmpty()) return 0.0;
        
        int termCount = 0;
        int totalTerms = 0;
        
        String[] words = normalizedText.split("[^a-z0-9]+");
        for (String word : words) {
            if (!word.isEmpty()) {
                totalTerms++;
                if (word.equals(normalizedTerm)) {
                    termCount++;
                }
            }
        }
        
        return totalTerms > 0 ? (double) termCount / totalTerms : 0.0;
    }

    private double calculateInverseDocumentFrequency(String term) {
        String normalizedTerm = normalize(term);
        if (normalizedTerm.isEmpty()) return 0.0;
        
        int documentsContainingTerm = 0;
        
        for (String document : SAMPLE_CORPUS) {
            if (normalize(document).contains(normalizedTerm)) {
                documentsContainingTerm++;
            }
        }
        
        if (documentsContainingTerm == 0) return 0.0;
        
        return Math.log((double) SAMPLE_CORPUS.size() / documentsContainingTerm);
    }

    private Set<String> findMissingKeywords(Set<String> textTokens, Set<String> keywordTokens) {
        return keywordTokens.stream()
            .filter(keyword -> !textTokens.contains(keyword))
            .collect(Collectors.toSet());
    }

    private ScoreResponse.UrgencyBand determineUrgencyBand(double score, int missingCount, int totalKeywords) {
        double missingRatio = totalKeywords > 0 ? (double) missingCount / totalKeywords : 1.0;
        
        if (score >= 0.8 && missingRatio <= 0.2) {
            return ScoreResponse.UrgencyBand.LOW;
        } else if (score >= 0.6 && missingRatio <= 0.4) {
            return ScoreResponse.UrgencyBand.MEDIUM;
        } else if (score >= 0.4 && missingRatio <= 0.6) {
            return ScoreResponse.UrgencyBand.HIGH;
        } else {
            return ScoreResponse.UrgencyBand.CRITICAL;
        }
    }

    private List<String> generateActionableTips(Set<String> missingKeywords, double score, 
                                               ScoreResponse.UrgencyBand urgencyBand) {
        List<String> tips = new ArrayList<>();
        
        // General tips based on score
        if (score < 0.3) {
            tips.add("Consider adding more relevant keywords to improve matching");
            tips.add("Review and expand your keyword list based on industry standards");
        } else if (score < 0.6) {
            tips.add("Good start! Try to include more of the missing keywords");
            tips.add("Consider adding synonyms or related terms");
        } else {
            tips.add("Excellent keyword coverage! Consider fine-tuning for even better results");
        }
        
        // Specific tips for missing keywords
        if (!missingKeywords.isEmpty()) {
            tips.add("Missing important keywords: " + String.join(", ", missingKeywords));
            tips.add("Try to naturally incorporate these terms into your content");
        }
        
        // Urgency-specific tips
        switch (urgencyBand) {
            case CRITICAL:
                tips.add("Immediate action required: Significant keyword gaps detected");
                tips.add("Consider restructuring content to better align with requirements");
                break;
            case HIGH:
                tips.add("High priority: Several key terms are missing");
                tips.add("Focus on the most important missing keywords first");
                break;
            case MEDIUM:
                tips.add("Medium priority: Some improvements needed");
                tips.add("Gradually incorporate missing terms for better results");
                break;
            case LOW:
                tips.add("Low priority: Content is well-aligned with keywords");
                tips.add("Continue current approach with minor optimizations");
                break;
        }
        
        return tips;
    }

    private ScoreResponse createEmptyResponse() {
        return new ScoreResponse(
            0.0,
            ScoreResponse.UrgencyBand.CRITICAL,
            Collections.emptySet(),
            Arrays.asList("No text or keywords provided for scoring"),
            0.0
        );
    }
}


