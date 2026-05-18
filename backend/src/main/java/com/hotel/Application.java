package com.hotel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.retry.annotation.EnableRetry;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableRetry
@EnableAsync
public class Application {

	public static void main(String[] args) {
		// Đặt JVM timezone = Asia/Ho_Chi_Minh trước khi Spring khởi động.
		// Đảm bảo LocalDateTime.now(), LocalDate.now() và Hibernate đều dùng UTC+7.
		// Phải set trước SpringApplication.run() để Hibernate dùng đúng timezone ngay từ đầu.
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
		SpringApplication.run(Application.class, args);
	}
}

