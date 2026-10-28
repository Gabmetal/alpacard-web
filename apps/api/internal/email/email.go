package email

import (
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"github.com/gabmetal/alpacard/api/internal/config"
)

// SendVerificationEmail dispatches an account confirmation email with a unique verification link.
// If SMTP settings are configured in environment variables, it delivers via SMTP.
// Otherwise, it logs the verification dispatch for local and preview environments.
func SendVerificationEmail(cfg *config.Config, recipientEmail, recipientName, token string) error {
	verifyURL := fmt.Sprintf("%s/api/v1/auth/verify-email?token=%s", strings.TrimRight(cfg.AppURL, "/"), token)
	if recipientName == "" {
		recipientName = "Alpacard User"
	}

	subject := "Verify your Alpacard Account / Verifica tu cuenta Alpacard"
	bodyText := fmt.Sprintf(`Hello %s,

Welcome to Alpacard! Please verify your email address by clicking the link below:

%s

This link will expire in 24 hours.

If you did not sign up for an Alpacard account, please ignore this email.

---
Hola %s,

¡Bienvenido a Alpacard! Por favor confirma tu dirección de correo electrónico haciendo clic en el siguiente enlace:

%s

Este enlace vencerá en 24 horas.

Si no te registraste en Alpacard, puedes ignorar este mensaje.
`, recipientName, verifyURL, recipientName, verifyURL)

	log.Printf("[EMAIL SERVICE] Verification email for %s <%s> ready. Link: %s", recipientName, recipientEmail, verifyURL)

	if cfg.SMTPHost != "" {
		addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)
		var auth smtp.Auth
		if cfg.SMTPUser != "" && cfg.SMTPPassword != "" {
			auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPHost)
		}

		msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s",
			cfg.SMTPFrom, recipientEmail, subject, bodyText))

		err := smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{recipientEmail}, msg)
		if err != nil {
			log.Printf("[EMAIL SERVICE] Warning: Failed to deliver verification email via SMTP to %s: %v", recipientEmail, err)
			return err
		}
		log.Printf("[EMAIL SERVICE] Verification email successfully delivered via SMTP to %s", recipientEmail)
	}

	return nil
}
