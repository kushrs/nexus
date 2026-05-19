package com.nexus.notification.service;

import com.nexus.notification.dto.NotificationDTO;
import com.nexus.notification.entity.Notification;
import com.nexus.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<NotificationDTO> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public NotificationDTO createNotification(NotificationDTO dto) {
        Notification notification = Notification.builder()
                .message(dto.getMessage())
                .type(dto.getType())
                .userId(dto.getUserId())
                .build();
        return toDTO(notificationRepository.save(notification));
    }

    private NotificationDTO toDTO(Notification n) {
        return NotificationDTO.builder()
                .id(n.getId())
                .message(n.getMessage())
                .type(n.getType())
                .userId(n.getUserId())
                .createdAt(n.getCreatedAt() != null ? n.getCreatedAt().toString() : null)
                .build();
    }
}
