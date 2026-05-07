package com.hotel.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.hotel.common.constants.ApiPath;
import com.hotel.security.JwtFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    ApiPath.AUTH + "/**",
                    ApiPath.PUBLIC + "/**",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll()
                .requestMatchers(ApiPath.CUSTOMER + "/**").hasAnyRole("CUSTOMER", "MANAGER", "OWNER")
                .requestMatchers(ApiPath.STAFF + "/**").hasAnyRole("STAFF", "MANAGER", "OWNER")
                .requestMatchers(ApiPath.MANAGER + "/**").hasAnyRole("MANAGER", "OWNER")
                .requestMatchers(ApiPath.OWNER + "/**").hasRole("OWNER")
                .requestMatchers(ApiPath.INTERNAL + "/**").hasAnyRole("STAFF", "MANAGER", "OWNER")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}