package com.azizulportfolio.portfolio.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class PortfolioController {

    private static final Set<String> CASE_STUDIES = Set.of(
            "taskflow", "assignment-writer-hire", "real-madrid-management", "ice-pentest-lab"
    );
    private static final long RATE_WINDOW_MS = 60L * 60L * 1000L;
    private static final int RATE_LIMIT = 5;

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final Map<String, Deque<Long>> contactAttempts = new ConcurrentHashMap<>();

    @Value("${portfolio.contact.enabled:false}")
    private boolean contactEnabled;

    @Value("${portfolio.contact.recipient:mdomor01815@gmail.com}")
    private String contactRecipient;

    public PortfolioController(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/projects/{slug}")
    public String caseStudy(@PathVariable String slug) {
        return CASE_STUDIES.contains(slug) ? "forward:/projects/index.html" : "redirect:/#projects";
    }

    @GetMapping("/health")
    @ResponseBody
    public Map<String, Object> health() {
        return Map.of("status", "ok", "time", Instant.now().toString());
    }

    @PostMapping("/api/contact")
    @ResponseBody
    public ResponseEntity<ContactResponse> contact(
            @Valid @RequestBody ContactMessage message,
            HttpServletRequest request
    ) {
        if (message.honey() != null && !message.honey().isBlank()) {
            return ResponseEntity.ok(new ContactResponse("Message received.", true));
        }
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (!contactEnabled || mailSender == null) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ContactResponse("Server email is not configured; use the hosted form fallback.", false));
        }
        if (!allowContact(clientAddress(request))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ContactResponse("Too many messages were sent from this address. Try again later.", false));
        }

        SimpleMailMessage email = new SimpleMailMessage();
        email.setTo(contactRecipient);
        email.setReplyTo(message.email());
        email.setSubject("Portfolio message: " + message.subject());
        email.setText("Name: " + message.name() + "\nEmail: " + message.email() + "\n\n" + message.message());
        try {
            mailSender.send(email);
            return ResponseEntity.ok(new ContactResponse("Message sent successfully. Thank you—I will reply by email.", true));
        } catch (MailException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ContactResponse("Email delivery is temporarily unavailable; use the hosted form fallback.", false));
        }
    }

    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank()
                ? request.getRemoteAddr()
                : forwarded.split(",")[0].trim();
    }

    private boolean allowContact(String address) {
        long now = System.currentTimeMillis();
        Deque<Long> attempts = contactAttempts.computeIfAbsent(address, ignored -> new ArrayDeque<>());
        synchronized (attempts) {
            while (!attempts.isEmpty() && now - attempts.peekFirst() > RATE_WINDOW_MS) attempts.removeFirst();
            if (attempts.size() >= RATE_LIMIT) return false;
            attempts.addLast(now);
            return true;
        }
    }

    public record ContactMessage(
            @NotBlank @Size(max = 80) String name,
            @NotBlank @Email @Size(max = 120) String email,
            @NotBlank @Size(max = 120) String subject,
            @NotBlank @Size(max = 2000) String message,
            @Size(max = 120) String honey
    ) {}

    public record ContactResponse(String message, boolean delivered) {}
}
