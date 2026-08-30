package test

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	api "hunt-vault-api/internal"
)

func TestApplicationServesClientAndPrefixedAPI(t *testing.T) {
	staticDir := t.TempDir()
	if err := os.WriteFile(filepath.Join(staticDir, "index.html"), []byte("<html>Hunt Vault</html>"), 0o644); err != nil {
		t.Fatalf("write index: %v", err)
	}
	assetsDir := filepath.Join(staticDir, "assets")
	if err := os.Mkdir(assetsDir, 0o755); err != nil {
		t.Fatalf("create assets directory: %v", err)
	}
	if err := os.WriteFile(filepath.Join(assetsDir, "app.js"), []byte("console.log('ok')"), 0o644); err != nil {
		t.Fatalf("write asset: %v", err)
	}

	app, err := api.New(context.Background(), api.Config{
		Address:      ":0",
		DatabasePath: filepath.Join(t.TempDir(), "hunt-vault.db"),
		StaticDir:    staticDir,
		SyncAPIKey:   []byte(testToken),
	})
	if err != nil {
		t.Fatalf("api.New() error = %v", err)
	}
	t.Cleanup(func() { _ = app.Close() })

	if response := request(app.Handler, http.MethodGet, "/api/health", nil, ""); response.Code != http.StatusOK {
		t.Fatalf("prefixed health status = %d, want %d", response.Code, http.StatusOK)
	}
	if response := request(app.Handler, http.MethodGet, "/api/v1/sync/pull?since=0", nil, ""); response.Code != http.StatusOK {
		t.Fatalf("prefixed pull status = %d, want %d", response.Code, http.StatusOK)
	}
	if response := request(app.Handler, http.MethodGet, "/", nil, ""); response.Code != http.StatusOK || response.Body.String() != "<html>Hunt Vault</html>" {
		t.Fatalf("client response = %d %q, want index", response.Code, response.Body.String())
	}
	if response := request(app.Handler, http.MethodGet, "/party/123", nil, ""); response.Code != http.StatusOK || response.Body.String() != "<html>Hunt Vault</html>" {
		t.Fatalf("SPA fallback response = %d %q, want index", response.Code, response.Body.String())
	}
	if response := request(app.Handler, http.MethodGet, "/assets/app.js", nil, ""); response.Code != http.StatusOK || response.Body.String() != "console.log('ok')" {
		t.Fatalf("asset response = %d %q, want asset", response.Code, response.Body.String())
	}
}
