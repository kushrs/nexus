package com.nexus.payment.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private UUID id;
    private BigDecimal amount;
    private String status;
    private UUID userId;
    private String createdAt;
}
