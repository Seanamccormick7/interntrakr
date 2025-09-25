package com.interntrackr.reco.controller;

import com.interntrackr.reco.dto.ScoreRequest;
import com.interntrackr.reco.dto.ScoreResponse;
import com.interntrackr.reco.service.ScoringService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/score", produces = MediaType.APPLICATION_JSON_VALUE)
public class ScoreController {
    private final ScoringService scoringService;

    public ScoreController(ScoringService scoringService) {
        this.scoringService = scoringService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ScoreResponse score(@Valid @RequestBody ScoreRequest request) {
        double s = scoringService.score(request.getText(), request.getKeywords());
        return new ScoreResponse(s);
    }
}


