package com.healclaim.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@EnableAsync
public class Application {

	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
		System.out.println(new BCryptPasswordEncoder().encode("Demo@1234"));
	}

}
