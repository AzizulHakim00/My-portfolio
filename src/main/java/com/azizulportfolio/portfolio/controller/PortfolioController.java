package com.azizulportfolio.portfolio.controller;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class PortfolioController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/health")
    @ResponseBody
    public Map<String, Object> health() {
        return Map.of("status", "ok", "time", Instant.now().toString());
    }

    @PostMapping("/api/contact")
    @ResponseBody
    public ResponseEntity<ContactResponse> contact(@Valid @RequestBody ContactMessage message) {
        return ResponseEntity.ok(new ContactResponse(
                "Thank you, " + message.name() + ". Your email app will open so you can send the message directly.",
                "mdomor01815@gmail.com"
        ));
    }

    public record ContactMessage(
            @NotBlank @Size(max = 80) String name,
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Size(max = 120) String subject,
            @NotBlank @Size(max = 2000) String message
    ) {}

    public record ContactResponse(String message, String recipient) {}
}

