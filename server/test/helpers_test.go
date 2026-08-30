package test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	api "hunt-vault-api/internal"
)

const testToken = "01234567890123456789012345678901"

type syncHunt struct {
	Fingerprint string          `json:"fingerprint,omitempty"`
	SessionData string          `json:"session_data,omitempty"`
	Members     []string        `json:"members,omitempty"`
	Payload     json.RawMessage `json:"payload,omitempty"`
	Deleted     bool            `json:"deleted,omitempty"`
}

type storedHunt struct {
	Fingerprint string          `json:"fingerprint"`
	Payload     json.RawMessage `json:"payload"`
	Version     int             `json:"version"`
	UpdatedAt   int64           `json:"updated_at"`
	Deleted     bool            `json:"deleted"`
}

type pushResponse struct {
	Accepted   []string `json:"accepted"`
	ServerTime int64    `json:"server_time"`
}

type pullResponse struct {
	Hunts   []storedHunt `json:"hunts"`
	Cursor  int64        `json:"cursor"`
	HasMore bool         `json:"has_more"`
}

func newTestApp(t *testing.T, databasePath string) *api.App {
	t.Helper()
	if databasePath == "" {
		databasePath = ":memory:"
	}
	app, err := api.New(context.Background(), api.Config{
		Address:      ":0",
		DatabasePath: databasePath,
		SyncAPIKey:   []byte(testToken),
	})
	if err != nil {
		t.Fatalf("api.New() error = %v", err)
	}
	t.Cleanup(func() { _ = app.Close() })
	return app
}

func request(handler http.Handler, method, path string, body []byte, token string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, bytes.NewReader(body))
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	return recorder
}

func encodeHunts(t *testing.T, hunts []syncHunt) []byte {
	t.Helper()
	body, err := json.Marshal(struct {
		Hunts []syncHunt `json:"hunts"`
	}{Hunts: hunts})
	if err != nil {
		t.Fatalf("encode push request: %v", err)
	}
	return body
}

func push(t *testing.T, handler http.Handler, hunts []syncHunt) pushResponse {
	t.Helper()
	response := request(handler, http.MethodPost, "/v1/sync/push", encodeHunts(t, hunts), testToken)
	if response.Code != http.StatusOK {
		t.Fatalf("push status = %d, want %d: %s", response.Code, http.StatusOK, response.Body.String())
	}
	var payload pushResponse
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode push response: %v", err)
	}
	return payload
}

func pull(t *testing.T, handler http.Handler, cursor int64) pullResponse {
	t.Helper()
	path := "/v1/sync/pull?since=" + strconv.FormatInt(cursor, 10)
	response := request(handler, http.MethodGet, path, nil, testToken)
	if response.Code != http.StatusOK {
		t.Fatalf("pull status = %d, want %d: %s", response.Code, http.StatusOK, response.Body.String())
	}
	var payload pullResponse
	if err := json.Unmarshal(response.Body.Bytes(), &payload); err != nil {
		t.Fatalf("decode pull response: %v", err)
	}
	return payload
}

func partyHunt(sessionData string, members ...string) syncHunt {
	return syncHunt{
		SessionData: sessionData,
		Members:     members,
		Payload:     json.RawMessage(`{"rawText":"party hunt"}`),
	}
}
