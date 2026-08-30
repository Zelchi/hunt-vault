package test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
)

func TestAPIKeyAndPartyHuntRoutes(t *testing.T) {
	app := newTestApp(t, "")
	if response := request(app.Handler, http.MethodGet, "/health", nil, ""); response.Code != http.StatusOK {
		t.Fatalf("health status = %d, want %d", response.Code, http.StatusOK)
	}
	if response := request(app.Handler, http.MethodPost, "/v1/sync/push", []byte("{}"), testToken+"-incorreta"); response.Code != http.StatusUnauthorized {
		t.Fatalf("invalid key status = %d, want %d", response.Code, http.StatusUnauthorized)
	}

	hunt := partyHunt("From 2026-08-29, 19:00:00 to 2026-08-29, 20:00:00", "Alice", "Bob")
	hunt.Fingerprint = "ef58851b23c6047acfa108a40f1fdb0e0a9696ba2748057ef320fbc3c8a9a5e5"
	accepted := push(t, app.Handler, []syncHunt{hunt})
	page := pull(t, app.Handler, 0)
	if len(accepted.Accepted) != 1 || len(page.Hunts) != 1 || page.Hunts[0].Fingerprint != accepted.Accepted[0] {
		t.Fatalf("push=%+v pull=%+v, want one party hunt with the accepted fingerprint", accepted, page)
	}
}

func TestPullIsPublic(t *testing.T) {
	app := newTestApp(t, "")
	response := request(app.Handler, http.MethodGet, "/v1/sync/pull?since=0", nil, "")
	if response.Code != http.StatusOK {
		t.Fatalf("pull status = %d, want %d", response.Code, http.StatusOK)
	}
}

func TestBrowserPreflightAllowsLocalFrontend(t *testing.T) {
	app := newTestApp(t, "")
	req := httptest.NewRequest(http.MethodOptions, "/v1/sync/events", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Headers", "authorization")
	recorder := httptest.NewRecorder()
	app.Handler.ServeHTTP(recorder, req)

	if recorder.Code != http.StatusNoContent {
		t.Fatalf("preflight status = %d, want %d", recorder.Code, http.StatusNoContent)
	}
	if recorder.Header().Get("Access-Control-Allow-Origin") != "http://localhost:5173" {
		t.Fatalf("preflight allow origin = %q, want local frontend", recorder.Header().Get("Access-Control-Allow-Origin"))
	}
	if !strings.Contains(recorder.Header().Get("Access-Control-Allow-Headers"), "Authorization") {
		t.Fatalf("preflight headers = %q, want Authorization", recorder.Header().Get("Access-Control-Allow-Headers"))
	}
}

func TestRejectsInvalidPartyHuntAndMismatchedFingerprint(t *testing.T) {
	app := newTestApp(t, "")
	invalidParty := syncHunt{SessionData: "session", Payload: []byte(`{"rawText":"solo"}`)}
	response := request(app.Handler, http.MethodPost, "/v1/sync/push", encodeHunts(t, []syncHunt{invalidParty}), testToken)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("invalid party status = %d, want %d", response.Code, http.StatusBadRequest)
	}

	mismatched := partyHunt("session", "Alice", "Bob")
	mismatched.Fingerprint = strings.Repeat("0", 64)
	response = request(app.Handler, http.MethodPost, "/v1/sync/push", encodeHunts(t, []syncHunt{mismatched}), testToken)
	if response.Code != http.StatusBadRequest {
		t.Fatalf("mismatched fingerprint status = %d, want %d", response.Code, http.StatusBadRequest)
	}
}

func TestConcurrentReportsOfSamePartyHuntCreateOneRecord(t *testing.T) {
	app := newTestApp(t, "")
	batches := [][]syncHunt{
		{partyHunt("  FROM 2026-08-29, 19:00:00 TO 2026-08-29, 20:00:00  ", "Bob", "Alice")},
		{partyHunt("from 2026-08-29, 19:00:00 to 2026-08-29, 20:00:00", " alice ", "BOB")},
	}

	start := make(chan struct{})
	statuses := make(chan int, len(batches))
	var workers sync.WaitGroup
	for _, batch := range batches {
		body := encodeHunts(t, batch)
		workers.Add(1)
		go func() {
			defer workers.Done()
			<-start
			statuses <- request(app.Handler, http.MethodPost, "/v1/sync/push", body, testToken).Code
		}()
	}
	close(start)
	workers.Wait()
	close(statuses)
	for status := range statuses {
		if status != http.StatusOK {
			t.Fatalf("concurrent push status = %d, want %d", status, http.StatusOK)
		}
	}

	page := pull(t, app.Handler, 0)
	if len(page.Hunts) != 1 || page.Hunts[0].Version != 2 {
		t.Fatalf("concurrent pull = %+v, want one version 2 party hunt", page)
	}
}

func TestEmptyPushDoesNotAdvanceCursorAndDeleteCreatesTombstone(t *testing.T) {
	app := newTestApp(t, "")
	first := push(t, app.Handler, []syncHunt{partyHunt("session one", "Alice", "Bob")})
	empty := push(t, app.Handler, nil)
	if len(empty.Accepted) != 0 || empty.ServerTime != first.ServerTime {
		t.Fatalf("empty push = %+v, want cursor %d and no accepted hunts", empty, first.ServerTime)
	}

	push(t, app.Handler, []syncHunt{{Fingerprint: first.Accepted[0], Deleted: true}})
	page := pull(t, app.Handler, first.ServerTime)
	if len(page.Hunts) != 1 || !page.Hunts[0].Deleted || page.Hunts[0].Version != 2 {
		t.Fatalf("deleted page = %+v, want one deleted version 2 party hunt", page)
	}
}

func TestPullPaginationKeepsCursorAtDeliveredHunt(t *testing.T) {
	app := newTestApp(t, "")
	hunts := make([]syncHunt, 500)
	for index := range hunts {
		hunts[index] = partyHunt(fmt.Sprintf("session %03d", index), "Alice", "Bob")
	}
	push(t, app.Handler, hunts)
	push(t, app.Handler, []syncHunt{partyHunt("session last", "Alice", "Bob")})

	firstPage := pull(t, app.Handler, 0)
	if len(firstPage.Hunts) != 500 || !firstPage.HasMore {
		t.Fatalf("first page has %d hunts and has_more=%v, want 500 and true", len(firstPage.Hunts), firstPage.HasMore)
	}
	if firstPage.Cursor != firstPage.Hunts[len(firstPage.Hunts)-1].UpdatedAt {
		t.Fatalf("first cursor = %d, want last delivered timestamp", firstPage.Cursor)
	}

	secondPage := pull(t, app.Handler, firstPage.Cursor)
	if len(secondPage.Hunts) != 1 || secondPage.Hunts[0].Deleted || secondPage.HasMore {
		t.Fatalf("second page = %+v, want only the final party hunt", secondPage)
	}
}
