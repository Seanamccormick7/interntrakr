package com.interntrackr.reco.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

public class ScoreRequest {
    @NotBlank
    private String text;

    @NotEmpty
    private Set<String> keywords;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Set<String> getKeywords() {
        return keywords;
    }

    public void setKeywords(Set<String> keywords) {
        this.keywords = keywords;
    }
}


