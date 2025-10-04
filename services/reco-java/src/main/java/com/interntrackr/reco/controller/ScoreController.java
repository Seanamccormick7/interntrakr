package com.interntrackr.reco.controller;

import com.interntrackr.reco.dto.ScoreRequest;
import com.interntrackr.reco.dto.ScoreResponse;
import com.interntrackr.reco.service.ScoringService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(path = "/score", produces = MediaType.APPLICATION_JSON_VALUE)
public class ScoreController {
    private final ScoringService scoringService;

    public ScoreController(ScoringService scoringService) {
        this.scoringService = scoringService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ScoreResponse score(@Valid @RequestBody ScoreRequest request) {
        return scoringService.enhancedScore(request.getText(), request.getKeywords());
    }

    // Legacy endpoint for backward compatibility
    @PostMapping(path = "/legacy", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ScoreResponse legacyScore(@Valid @RequestBody ScoreRequest request) {
        double score = scoringService.score(request.getText(), request.getKeywords());
        return new ScoreResponse(
            score,
            ScoreResponse.UrgencyBand.MEDIUM,
            java.util.Collections.emptySet(),
            java.util.Arrays.asList("Legacy scoring - consider using enhanced endpoint"),
            score
        );
    }

    // Health check endpoint
    @GetMapping("/health")
    public String health() {
        return "Scoring service is running";
    }
}


