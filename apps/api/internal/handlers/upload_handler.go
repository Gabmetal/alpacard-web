package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gabmetal/alpacard/api/internal/auth"
	"github.com/google/uuid"
)

const maxUploadSize = 10 * 1024 * 1024 // 10 MB

func (env *Env) UploadFile(w http.ResponseWriter, r *http.Request) {
	_, ok := auth.GetUserFromContext(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// Limit request body
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	if err := r.ParseMultipartForm(maxUploadSize); err != nil {
		respondError(w, http.StatusBadRequest, "File size exceeds 5MB limit")
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Missing 'file' form field")
		return
	}
	defer file.Close()

	// Detect MIME type from the first 512 bytes
	buff := make([]byte, 512)
	n, err := file.Read(buff)
	if err != nil && err != io.EOF {
		respondError(w, http.StatusInternalServerError, "Failed to inspect file")
		return
	}

	contentType := http.DetectContentType(buff[:n])
	// Rewind file
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to process file")
		return
	}

	// Determine file extension
	var ext string
	switch {
	case strings.HasPrefix(contentType, "image/jpeg"):
		ext = ".jpg"
	case strings.HasPrefix(contentType, "image/png"):
		ext = ".png"
	case strings.HasPrefix(contentType, "image/webp"):
		ext = ".webp"
	case strings.HasPrefix(contentType, "image/gif"):
		ext = ".gif"
	case strings.Contains(contentType, "xml") || strings.HasSuffix(strings.ToLower(header.Filename), ".svg"):
		ext = ".svg"
	case strings.HasPrefix(contentType, "application/pdf") || strings.HasSuffix(strings.ToLower(header.Filename), ".pdf"):
		ext = ".pdf"
	default:
		respondError(w, http.StatusBadRequest, "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF, SVG, PDF")
		return
	}

	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to prepare storage directory")
		return
	}

	filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	targetPath := filepath.Join(uploadDir, filename)

	dst, err := os.Create(targetPath)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to save file on disk")
		return
	}
	defer dst.Close()

	written, err := io.Copy(dst, file)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Failed to write file")
		return
	}

	publicURL := fmt.Sprintf("/api/uploads/%s", filename)

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"url":      publicURL,
		"filename": filename,
		"size":     written,
	})
}
