package handlers

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
)

func TestUploadFile(t *testing.T) {
	_, env, owner, _ := setupTestDB(t)

	tempDir := t.TempDir()
	os.Setenv("UPLOAD_DIR", tempDir)
	defer os.Unsetenv("UPLOAD_DIR")

	// Create a dummy multipart form with a small PNG image
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	part, err := writer.CreateFormFile("file", "test-logo.png")
	if err != nil {
		t.Fatalf("Failed to create form file: %v", err)
	}

	// 1x1 transparent PNG byte signature
	pngData := []byte{
		0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
		0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
		0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
		0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
		0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
		0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
		0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
		0x42, 0x60, 0x82,
	}

	if _, err := part.Write(pngData); err != nil {
		t.Fatalf("Failed to write png data: %v", err)
	}
	writer.Close()

	req := httptest.NewRequest("POST", "/api/v1/upload", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req = withAuth(req, owner)

	rr := httptest.NewRecorder()
	env.UploadFile(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("Expected status 200 OK, got %d: %s", rr.Code, rr.Body.String())
	}

	var res map[string]interface{}
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}

	url, ok := res["url"].(string)
	if !ok || url == "" {
		t.Fatalf("Expected non-empty url in response: %+v", res)
	}

	filename, ok := res["filename"].(string)
	if !ok || filename == "" {
		t.Fatalf("Expected non-empty filename in response: %+v", res)
	}

	savedFile := filepath.Join(tempDir, filename)
	if _, err := os.Stat(savedFile); os.IsNotExist(err) {
		t.Fatalf("Expected saved file on disk at %s", savedFile)
	}
}
