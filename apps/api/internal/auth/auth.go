package auth

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gabmetal/alpacard/api/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type contextKey string

const (
	UserContextKey contextKey = "authUser"
)

type AuthClaims struct {
	UserID uuid.UUID   `json:"userId"`
	Email  string      `json:"email"`
	Role   models.Role `json:"role"`
	jwt.RegisteredClaims
}

type StampQRClaims struct {
	Type       string    `json:"type"` // "stamp"
	CardID     uuid.UUID `json:"cardId"`
	UserID     uuid.UUID `json:"userId"`
	CampaignID uuid.UUID `json:"campaignId"`
	Nonce      int64     `json:"nonce"`
	jwt.RegisteredClaims
}

// HashPassword hashes a raw password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPassword verifies a raw password against a hash
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// GenerateAuthToken creates an access token for user login/sessions (valid 30 days)
func GenerateAuthToken(user *models.User, secret string) (string, error) {
	claims := AuthClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   user.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// GenerateStampQRToken generates an expiring token (5 min) embedded into a customer's loyalty card QR
func GenerateStampQRToken(card *models.Card, secret string) (string, string, error) {
	jti := uuid.New().String()
	now := time.Now()

	claims := StampQRClaims{
		Type:       "stamp",
		CardID:     card.ID,
		UserID:     card.UserID,
		CampaignID: card.CampaignID,
		Nonce:      now.UnixNano(),
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			ExpiresAt: jwt.NewNumericDate(now.Add(5 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(now),
			Subject:   card.ID.String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, err := token.SignedString([]byte(secret))
	return tokenStr, jti, err
}

// VerifyStampQRToken verifies the QR token and extracts claims
func VerifyStampQRToken(tokenString, secret string) (*StampQRClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &StampQRClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*StampQRClaims); ok && token.Valid {
		if claims.Type != "stamp" {
			return nil, errors.New("invalid token type")
		}
		return claims, nil
	}

	return nil, errors.New("invalid stamp token")
}

// VerifyAuthToken parses and validates a bearer token
func VerifyAuthToken(tokenString, secret string) (*AuthClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AuthClaims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*AuthClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid auth token")
}

// Middleware: RequireAuth enforces valid bearer token (or ?token= query param for SSE streams)
func RequireAuth(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenStr string
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
					http.Error(w, `{"error":"Invalid authorization header format"}`, http.StatusUnauthorized)
					return
				}
				tokenStr = parts[1]
			} else if qToken := r.URL.Query().Get("token"); qToken != "" {
				tokenStr = qToken
			} else {
				http.Error(w, `{"error":"Missing authorization header"}`, http.StatusUnauthorized)
				return
			}

			claims, err := VerifyAuthToken(tokenStr, secret)
			if err != nil {
				http.Error(w, `{"error":"Unauthorized or token expired"}`, http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserFromContext retrieves authenticated user claims
func GetUserFromContext(ctx context.Context) (*AuthClaims, bool) {
	claims, ok := ctx.Value(UserContextKey).(*AuthClaims)
	return claims, ok
}
