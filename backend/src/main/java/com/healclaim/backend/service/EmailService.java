package com.healclaim.backend.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationEmail(String toEmail, String fullName, String token) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Verify your HealClaim account");
            helper.setText(buildVerificationEmail(fullName, token), true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async
    public void sendClaimStatusEmail(String toEmail, String patientName,
                                     String claimId, String status, String note) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Your HealClaim claim has been " + status.toLowerCase());
            helper.setText(buildStatusEmail(patientName, claimId, status, note), true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send status email: {}", e.getMessage());
        }
    }

    @Async
    public void sendDecisionRequiredEmail(String toEmail, String patientName, String hospitalName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("Action required — Review your claim from " + hospitalName);
            helper.setText(buildDecisionEmail(patientName, hospitalName), true);
            mailSender.send(message);
        } catch (Exception e) {
            log.error("Failed to send decision email: {}", e.getMessage());
        }
    }

    private String buildVerificationEmail(String name, String token) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#0F6E56;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="color:white;margin:0;font-size:24px">HealClaim</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px">
                <h2 style="color:#111827">Hello, %s!</h2>
                <p style="color:#6b7280">Please verify your email address to activate your account.</p>
                <a href="http://localhost:3000/verify?token=%s"
                   style="display:inline-block;background:#0F6E56;color:white;padding:12px 24px;
                          border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                  Verify Email
                </a>
                <p style="color:#9ca3af;font-size:12px">This link expires in 24 hours.</p>
              </div>
            </div>
            """.formatted(name, token);
    }

    private String buildStatusEmail(String name, String claimId, String status, String note) {
        String color = status.equals("APPROVED") ? "#3B6D11" : "#A32D2D";
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#0F6E56;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="color:white;margin:0">HealClaim</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px">
                <h2 style="color:#111827">Hello, %s</h2>
                <p>Your claim <strong>#%s</strong> has been
                   <span style="color:%s;font-weight:600">%s</span>.</p>
                %s
                <a href="http://localhost:3000/patient/claims/%s"
                   style="display:inline-block;background:#0F6E56;color:white;padding:12px 24px;
                          border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                  View claim
                </a>
              </div>
            </div>
            """.formatted(
                name, claimId, color, status,
                note != null ? "<p style='color:#6b7280'>Note: " + note + "</p>" : "",
                claimId
        );
    }

    private String buildDecisionEmail(String name, String hospitalName) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#0F6E56;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="color:white;margin:0">HealClaim</h1>
              </div>
              <div style="background:#f9fafb;padding:32px;border-radius:0 0 8px 8px">
                <h2>Hello, %s</h2>
                <p style="color:#6b7280">
                  %s has submitted your claim bundle. Please review and choose
                  how you would like to proceed — pay cash or use your insurance.
                </p>
                <a href="http://localhost:3000/patient/dashboard"
                   style="display:inline-block;background:#0F6E56;color:white;padding:12px 24px;
                          border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
                  Review claim
                </a>
              </div>
            </div>
            """.formatted(name, hospitalName);
    }
}