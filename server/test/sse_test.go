package test

import (
	"bufio"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"time"
)

type sseMessage struct {
	ID    string
	Event string
	Data  string
}

type syncEvent struct {
	Cursor       int64    `json:"cursor"`
	Fingerprints []string `json:"fingerprints"`
}

func TestEventsArePublic(t *testing.T) {
	app := newTestApp(t, "")
	httpServer := httptest.NewServer(app.Handler)
	t.Cleanup(httpServer.Close)
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, httpServer.URL+"/v1/sync/events", nil)
	if err != nil {
		t.Fatalf("create events request: %v", err)
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("open public events stream: %v", err)
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		t.Fatalf("events status = %d, want %d", response.StatusCode, http.StatusOK)
	}
}

func TestEventsAnnouncesCommittedPushAndClientRecoversWithPull(t *testing.T) {
	app := newTestApp(t, "")
	httpServer := httptest.NewServer(app.Handler)
	t.Cleanup(httpServer.Close)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, httpServer.URL+"/v1/sync/events", nil)
	if err != nil {
		t.Fatalf("create events request: %v", err)
	}
	request.Header.Set("Authorization", "Bearer "+testToken)
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		t.Fatalf("open events stream: %v", err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		t.Fatalf("events status = %d, want %d", response.StatusCode, http.StatusOK)
	}
	if contentType := response.Header.Get("Content-Type"); !strings.HasPrefix(contentType, "text/event-stream") {
		t.Fatalf("events content type = %q, want text/event-stream", contentType)
	}

	reader := bufio.NewReader(response.Body)
	ready := readSSEMessage(t, reader)
	if ready.Event != "ready" || ready.Data != "{}" {
		t.Fatalf("ready event = %+v, want event ready with empty data", ready)
	}

	accepted := push(t, app.Handler, []syncHunt{partyHunt("live session", "Alice", "Bob")})
	message := readSSEMessage(t, reader)
	if message.Event != "sync" || message.ID != strconv.FormatInt(accepted.ServerTime, 10) {
		t.Fatalf("sync event = %+v, want cursor %d", message, accepted.ServerTime)
	}

	var event syncEvent
	if err := json.Unmarshal([]byte(message.Data), &event); err != nil {
		t.Fatalf("decode sync event: %v", err)
	}
	if event.Cursor != accepted.ServerTime || len(event.Fingerprints) != 1 || event.Fingerprints[0] != accepted.Accepted[0] {
		t.Fatalf("sync event payload = %+v, want accepted push %+v", event, accepted)
	}

	page := pull(t, app.Handler, 0)
	if page.Cursor != event.Cursor || len(page.Hunts) != 1 || page.Hunts[0].Fingerprint != event.Fingerprints[0] {
		t.Fatalf("pull after event = %+v, want announced party hunt", page)
	}
}

func readSSEMessage(t *testing.T, reader *bufio.Reader) sseMessage {
	t.Helper()
	var message sseMessage
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			t.Fatalf("read SSE message: %v", err)
		}
		line = strings.TrimSuffix(strings.TrimSuffix(line, "\n"), "\r")
		if line == "" {
			return message
		}
		if strings.HasPrefix(line, ":") {
			continue
		}
		field, value, found := strings.Cut(line, ":")
		if !found {
			continue
		}
		value = strings.TrimPrefix(value, " ")
		switch field {
		case "id":
			message.ID = value
		case "event":
			message.Event = value
		case "data":
			if message.Data != "" {
				message.Data += "\n"
			}
			message.Data += value
		}
	}
}
