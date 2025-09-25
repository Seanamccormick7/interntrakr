package com.interntrackr.reco.dto;

public class ScoreResponse {
    private double score;

    public ScoreResponse() {}

    public ScoreResponse(double score) {
        this.score = score;
    }

    public double getScore() {
        return score;   
    }

    public void setScore(double score) {
        this.score = score;
    }
}


