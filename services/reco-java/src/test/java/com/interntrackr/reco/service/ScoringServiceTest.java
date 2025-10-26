package com.interntrackr.reco.service;

import com.interntrackr.reco.dto.ScoreResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class ScoringServiceTest {
    private ScoringService scoringService;

    @BeforeEach
    void setup() {
        scoringService = new ScoringService();
    }

    @Test
    void testEnhancedScoreWithPerfectMatch() {
        Set<String> keywords = Set.of("java", "spring", "boot");
        String text = "I have extensive experience with Java Spring Boot development";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response);
        assertTrue(response.getScore() > 0.5);
        assertEquals(ScoreResponse.UrgencyBand.LOW, response.getUrgencyBand());
        assertTrue(response.getMissingKeywords().isEmpty());
        assertFalse(response.getActionableTips().isEmpty());
    }

    @Test
    void testEnhancedScoreWithPartialMatch() {
        Set<String> keywords = Set.of("java", "python", "react", "docker");
        String text = "I know Java programming and some Python";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response);
        assertTrue(response.getScore() > 0.0 && response.getScore() < 1.0);
        assertFalse(response.getMissingKeywords().isEmpty());
        assertTrue(response.getMissingKeywords().contains("react"));
        assertTrue(response.getMissingKeywords().contains("docker"));
        assertEquals(2, response.getMissingKeywords().size());
    }

    @Test
    void testEnhancedScoreWithNoMatch() {
        Set<String> keywords = Set.of("python", "django", "flask");
        String text = "I have Java and C++ experience";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response);
        assertTrue(response.getScore() < 0.5);
        assertEquals(ScoreResponse.UrgencyBand.CRITICAL, response.getUrgencyBand());
        assertEquals(keywords, response.getMissingKeywords());
    }

    @Test
    void testEnhancedScoreWithEmptyText() {
        Set<String> keywords = Set.of("java", "spring");
        
        ScoreResponse response = scoringService.enhancedScore("", keywords);
        
        assertNotNull(response);
        assertEquals(0.0, response.getScore());
        assertEquals(ScoreResponse.UrgencyBand.CRITICAL, response.getUrgencyBand());
        assertTrue(response.getActionableTips().contains("No text or keywords provided for scoring"));
    }

    @Test
    void testEnhancedScoreWithNullInputs() {
        ScoreResponse response = scoringService.enhancedScore(null, null);
        
        assertNotNull(response);
        assertEquals(0.0, response.getScore());
        assertEquals(ScoreResponse.UrgencyBand.CRITICAL, response.getUrgencyBand());
    }

    @Test
    void testTfIdfScoreCalculation() {
        Set<String> keywords = Set.of("java");
        String text = "Java is a programming language. Java is object-oriented.";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response);
        assertTrue(response.getTfidfScore() > 0.0);
        assertNotEquals(response.getScore(), response.getTfidfScore());
    }

    @Test
    void testUrgencyBandClassification() {
        Set<String> keywords = Set.of("java", "spring");
        String highScoreText = "I have extensive Java Spring Boot microservices experience";
        ScoreResponse lowUrgencyResponse = scoringService.enhancedScore(highScoreText, keywords);
        
        String lowScoreText = "I know basic programming";
        ScoreResponse highUrgencyResponse = scoringService.enhancedScore(lowScoreText, keywords);
        
        assertTrue(lowUrgencyResponse.getUrgencyBand().ordinal() < highUrgencyResponse.getUrgencyBand().ordinal());
    }

    @Test
    void testActionableTipsGeneration() {
        Set<String> keywords = Set.of("java", "python", "react");
        String text = "I know Java";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response.getActionableTips());
        assertFalse(response.getActionableTips().isEmpty());
        assertTrue(response.getActionableTips().stream()
            .anyMatch(tip -> tip.contains("Missing important keywords")));
    }

    @Test
    void testMissingKeywordsIdentification() {
        Set<String> keywords = Set.of("java", "python", "react", "docker");
        String text = "I have Java and Python experience";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        Set<String> expectedMissing = Set.of("react", "docker");
        assertEquals(expectedMissing, response.getMissingKeywords());
    }

    @Test
    void returnsZeroWhenNoOverlap() {
        double s = scoringService.score("java spring boot", Set.of("python", "flask"));
        assertEquals(0.0, s);
    }

    @Test
    void returnsPartialOverlap() {
        double s = scoringService.score("java spring boot", Set.of("java", "flask"));
        assertEquals(0.5, s);
    }

    @Test
    void isCaseInsensitiveAndTokenizes() {
        double s = scoringService.score("Java, Spring-Boot!", Set.of("java", "spring", "boot"));
        assertEquals(1.0, s);
    }

    @Test
    void handlesEmptyInputs() {
        double s1 = scoringService.score("", Set.of("a"));
        double s2 = scoringService.score("text", Set.of());
        assertEquals(0.0, s1);
        assertEquals(0.0, s2);
    }

    @Test
    void testEnhancedScoreWithSpecialCharacters() {
        Set<String> keywords = Set.of("java", "spring-boot");
        String text = "I know Java & Spring-Boot! Also React.js and C#.";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response);
        assertTrue(response.getScore() > 0.0);
    }

    @Test
    void testEnhancedScoreWithCaseInsensitivity() {
        Set<String> keywords = Set.of("JAVA", "Spring");
        String text = "I know java and spring boot";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response);
        assertTrue(response.getScore() > 0.0);
        assertTrue(response.getMissingKeywords().isEmpty());
    }

    @Test
    void testEnhancedScoreWithWhitespaceAndPunctuation() {
        Set<String> keywords = Set.of("  java  ", "spring-boot", "");
        String text = "I have experience with Java, Spring Boot, and other technologies.";
        
        ScoreResponse response = scoringService.enhancedScore(text, keywords);
        
        assertNotNull(response);
        assertTrue(response.getScore() > 0.0);
        assertFalse(response.getMissingKeywords().contains(""));
    }

    @Test
    void testUrgencyBandLabelsAndDescriptions() {
        assertEquals("Low Priority", ScoreResponse.UrgencyBand.LOW.getLabel());
        assertEquals("Continue current approach", ScoreResponse.UrgencyBand.LOW.getDescription());
        
        assertEquals("Critical Priority", ScoreResponse.UrgencyBand.CRITICAL.getLabel());
        assertEquals("Urgent action required", ScoreResponse.UrgencyBand.CRITICAL.getDescription());
    }
}