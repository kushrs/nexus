package com.nexus.logconsumer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class LogConsumerServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(LogConsumerServiceApplication.class, args);
    }
}
