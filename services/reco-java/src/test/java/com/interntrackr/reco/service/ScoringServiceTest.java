package com.interntrackr.reco.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class ScoringServiceTest {
    private ScoringService scoringService;

    @BeforeEach
    void setup() {
        scoringService = new ScoringService();
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
        assertEquals(2.0/3.0, s);
    }

    @Test
    void handlesEmptyInputs() {
        double s1 = scoringService.score("", Set.of("a"));
        double s2 = scoringService.score("text", Set.of());
        assertEquals(0.0, s1);
        assertEquals(0.0, s2);
    }
}


