package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const resendAPIURL = "https://api.resend.com/emails"

// Sender sends transactional emails via the Resend API.
type Sender struct {
	apiKey  string
	from    string
	client  *http.Client
}

// NewSender creates a new email sender.
func NewSender(apiKey, from string) *Sender {
	return &Sender{
		apiKey: apiKey,
		from:   from,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

type resendPayload struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Html    string   `json:"html"`
}

// SendOTP sends a 6-digit OTP verification email.
func (s *Sender) SendOTP(toEmail, otp string) error {
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111118;border:1px solid #1e1e2e;border-radius:16px;padding:40px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:32px;">☠</span>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:800;color:#ffffff;">
                Code<span style="color:#00f0ff;">Mortem</span>
              </h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:16px;">
              <h2 style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">
                Verify your email
              </h2>
              <p style="margin:8px 0 0;font-size:14px;color:#8b8fa8;">
                Enter this code in the CodeMortem registration page.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 0;">
              <div style="display:inline-block;background:#0a0a0f;border:2px solid #00f0ff;border-radius:12px;padding:20px 40px;">
                <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#00f0ff;font-family:monospace;">%s</span>
              </div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#8b8fa8;">
                This code expires in <strong style="color:#ffffff;">10 minutes</strong>.<br>
                If you didn't request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="border-top:1px solid #1e1e2e;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4a4a5a;">
                &copy; 2026 CodeMortem · Built for competitive programmers
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, otp)

	payload := resendPayload{
		From:    s.from,
		To:      []string{toEmail},
		Subject: fmt.Sprintf("%s is your CodeMortem verification code", otp),
		Html:    html,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal email payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, resendAPIURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: status %d", resp.StatusCode)
	}

	return nil
}

// SendWelcomePremium sends a welcome email to new Somaiya premium users.
func (s *Sender) SendWelcomePremium(toEmail, username string) error {
	html := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',sans-serif;">
  <table width="100%%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#111118;border:1px solid #1e1e2e;border-radius:16px;padding:40px;">
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;">
                &#127891; Welcome to Premium, %s!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:24px;">
              <p style="margin:0;font-size:14px;color:#8b8fa8;line-height:1.6;">
                As a <strong style="color:#ffffff;">K.J. Somaiya</strong> student, you've been automatically granted
                <strong style="color:#00f0ff;">3 months of CodeMortem Premium</strong> — completely free.
              </p>
              <ul style="margin:16px 0 0;padding-left:20px;font-size:14px;color:#8b8fa8;line-height:2;">
                <li>Practice Bank — 8+ bonus problems per module</li>
                <li>Full editorials with C++ &amp; Python solutions</li>
                <li>Post-module timed practice contests</li>
                <li>&#128081; Premium badge on the leaderboard</li>
              </ul>
            </td>
          </tr>
          <tr>
            <td align="center" style="border-top:1px solid #1e1e2e;padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4a4a5a;">
                &copy; 2026 CodeMortem
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, username)

	payload := resendPayload{
		From:    s.from,
		To:      []string{toEmail},
		Subject: "🎓 Your 3 months of CodeMortem Premium are active!",
		Html:    html,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("marshal email payload: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, resendAPIURL, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("resend API error: status %d", resp.StatusCode)
	}

	return nil
}
