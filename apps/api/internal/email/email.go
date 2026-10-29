package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"strings"
	"time"

	"github.com/gabmetal/alpacard/api/internal/config"
)

type resendRequest struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Html    string   `json:"html"`
	Text    string   `json:"text"`
}

type resendResponse struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Message string `json:"message"`
}

// SendVerificationEmail dispatches an account confirmation email with a unique verification link.
func SendVerificationEmail(cfg *config.Config, recipientEmail, recipientName, token string, role ...string) error {
	baseURL := cfg.AppURL
	if len(role) > 0 && role[0] == "CONSUMER" && cfg.WalletURL != "" {
		baseURL = cfg.WalletURL
	} else if len(role) > 0 && (role[0] == "OWNER" || role[0] == "STAFF") {
		if strings.Contains(baseURL, "dev.alpacard.app") {
			baseURL = "https://dev-merchant.alpacard.app"
		} else if strings.Contains(baseURL, "alpacard.app") && !strings.Contains(baseURL, "merchant") {
			baseURL = "https://merchant.alpacard.app"
		}
	}
	verifyURL := fmt.Sprintf("%s/api/v1/auth/verify-email?token=%s", strings.TrimRight(baseURL, "/"), token)
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

	bodyHTML := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #292524; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7e5e4; padding: 36px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo-badge { display: inline-block; background-color: #f59e0b; color: #1c1917; font-weight: 900; font-size: 20px; padding: 10px 18px; border-radius: 14px; text-decoration: none; }
    h1 { font-size: 20px; font-weight: 800; color: #1c1917; margin-bottom: 12px; }
    p { font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #3d2b1f; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 30px; border-radius: 12px; }
    .divider { border-top: 1px solid #f5f5f4; margin: 28px 0; }
    .footer { font-size: 11px; color: #a8a29e; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-badge">🦙 Alpacard</div>
    </div>
    <h1>Verify Your Account / Confirma Tu Cuenta</h1>
    <p>Hello <strong>%s</strong>, welcome to Alpacard! Please confirm your email address by clicking the button below.</p>
    <div class="btn-container">
      <a href="%s" class="btn" target="_blank">Verify Email / Verificar Correo</a>
    </div>
    <p style="font-size: 12px; color: #78716c;">Link expires in 24 hours. If the button doesn't work, copy and paste this URL into your browser:<br/><a href="%s" style="color: #d97706; word-break: break-all;">%s</a></p>
    <div class="divider"></div>
    <p style="font-size: 13px;">¡Hola <strong>%s</strong>! Gracias por unirte a Alpacard. Haz clic arriba para confirmar tu dirección de correo electrónico.</p>
    <div class="footer">
      Alpacard • Open-Source Digital Loyalty Platform<br/>
      If you did not create this account, no further action is required.
    </div>
  </div>
</body>
</html>`, recipientName, verifyURL, verifyURL, verifyURL, recipientName)

	log.Printf("[EMAIL SERVICE] Verification email for %s <%s> ready. Link: %s", recipientName, recipientEmail, verifyURL)
	return sendMail(cfg, recipientEmail, subject, bodyHTML, bodyText)
}

// SendPasswordResetEmail dispatches a secure password recovery email with a 1-hour expiration link.
func SendPasswordResetEmail(cfg *config.Config, recipientEmail, recipientName, resetURL string) error {
	if recipientName == "" {
		recipientName = "Alpacard User"
	}

	subject := "Reset your Alpacard Password / Restablece tu contraseña Alpacard"

	bodyText := fmt.Sprintf(`Hello %s,

We received a request to reset your Alpacard password. You can set a new password by clicking the link below:

%s

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email.

---
Hola %s,

Recibimos una solicitud para restablecer tu contraseña en Alpacard. Puedes ingresar una nueva contraseña haciendo clic en el siguiente enlace:

%s

Este enlace vencerá en 1 hora.

Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje de forma segura.
`, recipientName, resetURL, recipientName, resetURL)

	bodyHTML := fmt.Sprintf(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #292524; }
    .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7e5e4; padding: 36px 28px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo-badge { display: inline-block; background-color: #f59e0b; color: #1c1917; font-weight: 900; font-size: 20px; padding: 10px 18px; border-radius: 14px; text-decoration: none; }
    h1 { font-size: 20px; font-weight: 800; color: #1c1917; margin-bottom: 12px; }
    p { font-size: 14px; line-height: 1.6; color: #57534e; margin-bottom: 20px; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #3d2b1f; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 13px 30px; border-radius: 12px; }
    .divider { border-top: 1px solid #f5f5f4; margin: 28px 0; }
    .footer { font-size: 11px; color: #a8a29e; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-badge">🦙 Alpacard</div>
    </div>
    <h1>Reset Your Password / Restablece Tu Contraseña</h1>
    <p>Hello <strong>%s</strong>, we received a request to reset your password. Click the button below to set a new password:</p>
    <div class="btn-container">
      <a href="%s" class="btn" target="_blank">Reset Password / Restablecer Contraseña</a>
    </div>
    <p style="font-size: 12px; color: #78716c;">Link expires in 1 hour. If the button doesn't work, copy and paste this URL into your browser:<br/><a href="%s" style="color: #d97706; word-break: break-all;">%s</a></p>
    <div class="divider"></div>
    <p style="font-size: 13px;">¡Hola <strong>%s</strong>! Recibimos una solicitud para restablecer tu contraseña. Haz clic arriba para cambiarla. Este enlace vence en 1 hora.</p>
    <div class="footer">
      Alpacard • Open-Source Digital Loyalty Platform<br/>
      If you did not request this change, you can safely ignore this email.
    </div>
  </div>
</body>
</html>`, recipientName, resetURL, resetURL, resetURL, recipientName)

	log.Printf("[EMAIL SERVICE] Password reset email for %s <%s> ready. Link: %s", recipientName, recipientEmail, resetURL)
	return sendMail(cfg, recipientEmail, subject, bodyHTML, bodyText)
}

func sendMail(cfg *config.Config, recipientEmail, subject, bodyHTML, bodyText string) error {
	// 1. Resend REST API
	if cfg.ResendAPIKey != "" {
		fromAddr := cfg.SMTPFrom
		if fromAddr == "" {
			fromAddr = "Alpacard <no-reply@alpacard.app>"
		}

		payload := resendRequest{
			From:    fromAddr,
			To:      []string{recipientEmail},
			Subject: subject,
			Html:    bodyHTML,
			Text:    bodyText,
		}

		jsonBody, err := json.Marshal(payload)
		if err != nil {
			log.Printf("[EMAIL SERVICE] Failed to marshal Resend payload: %v", err)
			return err
		}

		client := &http.Client{Timeout: 10 * time.Second}
		req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(jsonBody))
		if err != nil {
			log.Printf("[EMAIL SERVICE] Failed to create Resend request: %v", err)
			return err
		}

		req.Header.Set("Authorization", "Bearer "+cfg.ResendAPIKey)
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[EMAIL SERVICE] Error executing Resend HTTP call: %v", err)
			return err
		}
		defer resp.Body.Close()

		respBytes, _ := io.ReadAll(resp.Body)
		if resp.StatusCode >= 400 {
			var rErr resendResponse
			_ = json.Unmarshal(respBytes, &rErr)
			log.Printf("[EMAIL SERVICE] Resend delivery rejected (status %d): %s (%s)", resp.StatusCode, rErr.Message, rErr.Name)

			// Graceful fallback: If custom domain is pending verification, retry with onboarding@resend.dev
			if strings.Contains(rErr.Message, "not verified") && fromAddr != "Alpacard <onboarding@resend.dev>" {
				log.Printf("[EMAIL SERVICE] Domain not yet verified in Resend. Retrying with onboarding@resend.dev fallback...")
				payload.From = "Alpacard <onboarding@resend.dev>"
				retryBody, _ := json.Marshal(payload)
				retryReq, _ := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewBuffer(retryBody))
				retryReq.Header.Set("Authorization", "Bearer "+cfg.ResendAPIKey)
				retryReq.Header.Set("Content-Type", "application/json")
				retryResp, retryErr := client.Do(retryReq)
				if retryErr == nil {
					defer retryResp.Body.Close()
					if retryResp.StatusCode < 400 {
						var rSuccess resendResponse
						rRetryBytes, _ := io.ReadAll(retryResp.Body)
						_ = json.Unmarshal(rRetryBytes, &rSuccess)
						log.Printf("[EMAIL SERVICE] Email delivered via Resend fallback to %s (ID: %s)", recipientEmail, rSuccess.ID)
						return nil
					}
				}
			}

			return fmt.Errorf("resend error (%d): %s", resp.StatusCode, rErr.Message)
		}

		var rSuccess resendResponse
		_ = json.Unmarshal(respBytes, &rSuccess)
		log.Printf("[EMAIL SERVICE] Email successfully delivered via Resend API to %s (ID: %s)", recipientEmail, rSuccess.ID)
		return nil
	}

	// 2. SMTP Delivery Fallback
	if cfg.SMTPHost != "" {
		addr := fmt.Sprintf("%s:%s", cfg.SMTPHost, cfg.SMTPPort)
		var auth smtp.Auth
		if cfg.SMTPUser != "" && cfg.SMTPPassword != "" {
			auth = smtp.PlainAuth("", cfg.SMTPUser, cfg.SMTPPassword, cfg.SMTPHost)
		}

		msg := []byte(fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
			cfg.SMTPFrom, recipientEmail, subject, bodyHTML))

		err := smtp.SendMail(addr, auth, cfg.SMTPFrom, []string{recipientEmail}, msg)
		if err != nil {
			log.Printf("[EMAIL SERVICE] Warning: Failed to deliver email via SMTP to %s: %v", recipientEmail, err)
			return err
		}
		log.Printf("[EMAIL SERVICE] Email successfully delivered via SMTP to %s", recipientEmail)
		return nil
	}

	return nil
}
