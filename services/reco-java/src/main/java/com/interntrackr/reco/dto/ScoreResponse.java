package com.interntrackr.reco.dto;

import java.util.List;
import java.util.Set;

public class ScoreResponse {
    private double score;
    private UrgencyBand urgencyBand;
    private Set<String> missingKeywords;
    private List<String> actionableTips;
    private double tfidfScore;

    public ScoreResponse() {}

    public ScoreResponse(double score, UrgencyBand urgencyBand, Set<String> missingKeywords, 
                        List<String> actionableTips, double tfidfScore) {
        this.score = score;
        this.urgencyBand = urgencyBand;
        this.missingKeywords = missingKeywords;
        this.actionableTips = actionableTips;
        this.tfidfScore = tfidfScore;
    }

    // Getters and Setters
    public double getScore() {
        return score;   
    }

    public void setScore(double score) {
        this.score = score;
    }

    public UrgencyBand getUrgencyBand() {
        return urgencyBand;
    }

    public void setUrgencyBand(UrgencyBand urgencyBand) {
        this.urgencyBand = urgencyBand;
    }

    public Set<String> getMissingKeywords() {
        return missingKeywords;
    }

    public void setMissingKeywords(Set<String> missingKeywords) {
        this.missingKeywords = missingKeywords;
    }

    public List<String> getActionableTips() {
        return actionableTips;
    }

    public void setActionableTips(List<String> actionableTips) {
        this.actionableTips = actionableTips;
    }

    public double getTfidfScore() {
        return tfidfScore;
    }

    public void setTfidfScore(double tfidfScore) {
        this.tfidfScore = tfidfScore;
    }

    // Urgency Band Enum
    public enum UrgencyBand {
        LOW("Low Priority", "Continue current approach"),
        MEDIUM("Medium Priority", "Consider improvements"),
        HIGH("High Priority", "Immediate attention needed"),
        CRITICAL("Critical Priority", "Urgent action required");

        private final String label;
        private final String description;

        UrgencyBand(String label, String description) {
            this.label = label;
            this.description = description;
        }

        public String getLabel() {
            return label;
        }

        public String getDescription() {
            return description;
        }
    }
}


