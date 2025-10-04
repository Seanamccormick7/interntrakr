package com.interntrackr.reco.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interntrackr.reco.dto.ScoreRequest;
import com.interntrackr.reco.dto.ScoreResponse;
import com.interntrackr.reco.service.ScoringService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ScoreController.class)
class ScoreControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ScoringService scoringService;

    @Autowired
    private ObjectMapper objectMapper;

    private ScoreRequest validRequest;
    private ScoreResponse mockResponse;

    @BeforeEach
    void setUp() {
        validRequest = new ScoreRequest();
        validRequest.setText("I have Java and Spring Boot experience");
        validRequest.setKeywords(Set.of("java", "spring", "boot"));

        mockResponse = new ScoreResponse(
            0.85,
            ScoreResponse.UrgencyBand.LOW,
            Set.of(),
            java.util.Arrays.asList("Excellent keyword coverage!"),
            0.82
        );
    }

    @Test
    void testScoreEndpointWithValidRequest() throws Exception {
        when(scoringService.enhancedScore(any(String.class), anySet())).thenReturn(mockResponse);

        mockMvc.perform(post("/score")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.score").value(0.85))
                .andExpect(jsonPath("$.urgencyBand").value("LOW"))
                .andExpect(jsonPath("$.missingKeywords").isEmpty())
                .andExpect(jsonPath("$.actionableTips").isArray())
                .andExpect(jsonPath("$.tfidfScore").value(0.82));
    }

    @Test
    void testScoreEndpointWithInvalidRequest() throws Exception {
        ScoreRequest invalidRequest = new ScoreRequest();
        invalidRequest.setText("");
        invalidRequest.setKeywords(Set.of());

        mockMvc.perform(post("/score")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testLegacyScoreEndpoint() throws Exception {
        ScoreResponse legacyResponse = new ScoreResponse(
            0.5,
            ScoreResponse.UrgencyBand.MEDIUM,
            Set.of(),
            java.util.Arrays.asList("Legacy scoring - consider using enhanced endpoint"),
            0.5
        );

        when(scoringService.score(any(String.class), anySet())).thenReturn(0.5);

        mockMvc.perform(post("/score/legacy")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.score").value(0.5))
                .andExpect(jsonPath("$.urgencyBand").value("MEDIUM"));
    }

    @Test
    void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/score/health"))
                .andExpect(status().isOk())
                .andExpect(content().string("Scoring service is running"));
    }

    @Test
    void testScoreEndpointWithMissingKeywords() throws Exception {
        ScoreResponse responseWithMissing = new ScoreResponse(
            0.3,
            ScoreResponse.UrgencyBand.HIGH,
            Set.of("python", "react"),
            java.util.Arrays.asList("Missing important keywords: python, react"),
            0.25
        );

        when(scoringService.enhancedScore(any(String.class), anySet())).thenReturn(responseWithMissing);

        mockMvc.perform(post("/score")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(0.3))
                .andExpect(jsonPath("$.urgencyBand").value("HIGH"))
                .andExpect(jsonPath("$.missingKeywords").isArray())
                .andExpect(jsonPath("$.missingKeywords.length()").value(2))
                .andExpect(jsonPath("$.missingKeywords[0]").value("python"))
                .andExpect(jsonPath("$.missingKeywords[1]").value("react"));
    }

    @Test
    void testScoreEndpointWithCriticalUrgency() throws Exception {
        ScoreResponse criticalResponse = new ScoreResponse(
            0.1,
            ScoreResponse.UrgencyBand.CRITICAL,
            Set.of("java", "spring", "boot", "docker"),
            java.util.Arrays.asList("Immediate action required: Significant keyword gaps detected"),
            0.08
        );

        when(scoringService.enhancedScore(any(String.class), anySet())).thenReturn(criticalResponse);

        mockMvc.perform(post("/score")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(0.1))
                .andExpect(jsonPath("$.urgencyBand").value("CRITICAL"))
                .andExpect(jsonPath("$.missingKeywords.length()").value(4));
    }
}
