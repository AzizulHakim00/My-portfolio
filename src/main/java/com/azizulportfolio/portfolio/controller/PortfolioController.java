package com.azizulportfolio.portfolio.controller;

import java.time.Instant;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
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
}
