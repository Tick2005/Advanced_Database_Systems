package com.hotel.integrations.email;

import com.hotel.exception.BusinessException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Component
public class EmailTemplateFactory {

    public String render(String templateName, Map<String, String> model) {
        String html = readTemplate(templateName);
        for (Map.Entry<String, String> entry : model.entrySet()) {
            String key = "${" + entry.getKey() + "}";
            html = html.replace(key, entry.getValue() == null ? "" : entry.getValue());
        }
        return html;
    }

    private String readTemplate(String templateName) {
        String resolvedName = templateName.endsWith(".html") ? templateName : templateName + ".html";
        ClassPathResource resource = new ClassPathResource("templates/" + resolvedName);
        if (!resource.exists()) {
            throw new BusinessException("Email template not found: " + resolvedName);
        }

        try {
            byte[] bytes = resource.getInputStream().readAllBytes();
            return new String(bytes, StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new BusinessException("Cannot load template: " + resolvedName);
        }
    }
}
