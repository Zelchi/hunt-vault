package test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	api "hunt-vault-api/internal"
)

func TestProxyForwardsSearchAndDetails(t *testing.T) {
	searchRequests := 0
	detailsRequests := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.Header.Get("Origin") != "" {
			t.Errorf("upstream Origin header = %q, want it omitted", request.Header.Get("Origin"))
		}

		switch request.URL.Path {
		case "/api/respawns/search":
			searchRequests++
			query := request.URL.Query()
			if query.Get("q") != "Fury" || query.Get("page_size") != "20" || query.Get("server") != "rubinot" || query.Get("world") != "Malveria" || query.Get("future_filter") != "night" {
				t.Errorf("upstream query = %v, want all proxy query parameters", query)
			}
			response.Header().Set("Content-Type", "application/json; charset=utf-8")
			_, _ = response.Write([]byte(`{"respawns":[],"total":0}`))
		case "/api/respawns/579defa1-3c6c-4d1c-b469-a1742c63d7b1":
			detailsRequests++
			response.Header().Set("Content-Type", "application/json")
			_, _ = response.Write([]byte(`{"id":"579defa1-3c6c-4d1c-b469-a1742c63d7b1","name":"Fury"}`))
		default:
			http.NotFound(response, request)
		}
	}))
	defer upstream.Close()

	app, err := api.New(context.Background(), api.Config{
		Address:      ":0",
		DatabasePath: filepath.Join(t.TempDir(), "hunt-vault.db"),
		SyncAPIKey:   []byte(testToken),
		ProxyAPIURL:  upstream.URL + "/api",
	})
	if err != nil {
		t.Fatalf("api.New() error = %v", err)
	}
	defer app.Close()

	searchRequest := httptest.NewRequest(http.MethodGet, "/api/proxy/respawns/search?q=Fury&page_size=20&server=rubinot&world=Malveria&future_filter=night", nil)
	searchRequest.Header.Set("Origin", "https://hunt.zelchi.com")
	searchResponse := httptest.NewRecorder()
	app.Handler.ServeHTTP(searchResponse, searchRequest)
	if searchResponse.Code != http.StatusOK {
		t.Fatalf("search status = %d, want %d: %s", searchResponse.Code, http.StatusOK, searchResponse.Body.String())
	}
	if got := searchResponse.Header().Get("Access-Control-Allow-Origin"); got != "https://hunt.zelchi.com" {
		t.Fatalf("search ACAO = %q, want request origin", got)
	}
	if got := searchResponse.Body.String(); got != `{"respawns":[],"total":0}` {
		t.Fatalf("search body = %q, want upstream body", got)
	}

	detailsRequest := httptest.NewRequest(http.MethodGet, "/api/proxy/respawns/579defa1-3c6c-4d1c-b469-a1742c63d7b1", nil)
	detailsResponse := httptest.NewRecorder()
	app.Handler.ServeHTTP(detailsResponse, detailsRequest)
	if detailsResponse.Code != http.StatusOK {
		t.Fatalf("details status = %d, want %d: %s", detailsResponse.Code, http.StatusOK, detailsResponse.Body.String())
	}
	if got := detailsResponse.Body.String(); got != `{"id":"579defa1-3c6c-4d1c-b469-a1742c63d7b1","name":"Fury"}` {
		t.Fatalf("details body = %q, want upstream body", got)
	}

	otherProxyRequest := httptest.NewRequest(http.MethodGet, "/api/proxy/other-service/resource?format=json", nil)
	otherProxyResponse := httptest.NewRecorder()
	app.Handler.ServeHTTP(otherProxyResponse, otherProxyRequest)
	if otherProxyResponse.Code != http.StatusNotFound {
		t.Fatalf("other proxy status = %d, want upstream status %d", otherProxyResponse.Code, http.StatusNotFound)
	}
	if searchRequests != 1 || detailsRequests != 1 {
		t.Fatalf("upstream requests = search:%d details:%d, want search:1 details:1", searchRequests, detailsRequests)
	}
}
