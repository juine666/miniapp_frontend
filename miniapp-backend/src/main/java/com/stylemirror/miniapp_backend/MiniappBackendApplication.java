package com.stylemirror.miniapp_backend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;

@SpringBootApplication(exclude = {FlywayAutoConfiguration.class})
@MapperScan("com.stylemirror.miniapp_backend.repository")
public class MiniappBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(MiniappBackendApplication.class, args);
	}

}
