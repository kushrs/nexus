package com.nexus.notification.dto;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private UUID id;
    private String message;
    private String type;
    private UUID userId;
    private String createdAt;
}
