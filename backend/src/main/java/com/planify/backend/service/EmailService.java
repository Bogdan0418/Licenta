package com.planify.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // 'true' indică faptul că este HTML

            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Eroare la trimiterea email-ului HTML: " + e.getMessage());
        }
    }

    public String buildBookingTemplate(String userName, String locationName, String date, String time, String zoneName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container { font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
                    .header { background-color: #4f46e5; color: white; padding: 24px; text-align: center; }
                    .content { padding: 24px; color: #1e293b; line-height: 1.5; }
                    .details-box { background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px dashed #cbd5e1; }
                    .footer { text-align: center; padding: 16px; color: #64748b; font-size: 12px; background-color: #f1f5f9; }
                    .button { background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Planify</h1>
                        <p>Rezervare Confirmată!</p>
                    </div>
                    <div class='content'>
                        <p>Salut, <strong>%s</strong>!</p>
                        <p>Avem vești bune! Rezervarea ta a fost procesată cu succes. Te așteptăm cu drag!</p>
                        
                        <div class='details-box'>
                            <p>📍 <strong>Locație:</strong> %s</p>
                            <p>📅 <strong>Data:</strong> %s</p>
                            <p>⏰ <strong>Ora:</strong> %s</p>
                            <p>🧩 <strong>Zona:</strong> %s</p>
                        </div>
                        
                        <p>Dacă ai nevoie să modifici sau să anulezi rezervarea, te rugăm să accesezi dashboard-ul tău din aplicație.</p>
                    </div>
                    <div class='footer'>
                        Echipa Planify &copy; 2024 - Simplificăm planurile tale.
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName, locationName, date, time, zoneName);
    }
}