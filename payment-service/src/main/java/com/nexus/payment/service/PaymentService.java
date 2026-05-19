package com.nexus.payment.service;

import com.nexus.payment.dto.PaymentDTO;
import com.nexus.payment.entity.Payment;
import com.nexus.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;

    public List<PaymentDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::toDTO).collect(Collectors.toList());
    }

    public PaymentDTO createPayment(PaymentDTO dto) {
        Payment payment = Payment.builder()
                .amount(dto.getAmount())
                .status(dto.getStatus() != null ? dto.getStatus() : "PENDING")
                .userId(dto.getUserId())
                .build();
        return toDTO(paymentRepository.save(payment));
    }

    private PaymentDTO toDTO(Payment p) {
        return PaymentDTO.builder()
                .id(p.getId())
                .amount(p.getAmount())
                .status(p.getStatus())
                .userId(p.getUserId())
                .createdAt(p.getCreatedAt() != null ? p.getCreatedAt().toString() : null)
                .build();
    }
}
