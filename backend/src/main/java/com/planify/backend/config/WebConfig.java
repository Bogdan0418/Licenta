package com.planify.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Obținem calea absolută către folderul uploads
        String uploadPath = Paths.get("uploads").toAbsolutePath().toUri().toString();

        // ESTE CRITIC ca adresa să se termine cu "/" pentru ca Spring să știe că e un director
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath, "file:uploads/", "file:./uploads/");
    }
}