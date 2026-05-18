package com.hotel.modules.debug;

import java.io.BufferedReader;
import java.io.IOException;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hotel.common.response.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

@Profile({"dev","test"})
@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @PostMapping("/echo")
    public ApiResponse<String> echo(HttpServletRequest request) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
        }
        return ApiResponse.ok("raw body", sb.toString());
    }
}
