package api

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	maxJSONBody  = 1 << 20
	maxChanges   = 500
	pullPageSize = 500
)

type server struct {
	store           *store
	broker          *broker
	apiKey          []byte
	proxyAPIURL     string
	proxyHTTPClient *http.Client
	proxyCache      *cache[string, proxyResponse]
}

type partyHuntRequest struct {
	Fingerprint string          `json:"fingerprint"`
	SessionData string          `json:"session_data"`
	Members     []string        `json:"members"`
	Payload     json.RawMessage `json:"payload"`
	Deleted     bool            `json:"deleted"`
}

func newRouter(store *store, events *broker, apiKey []byte, proxyAPIURL string) *gin.Engine {
	server := &server{
		store:           store,
		broker:          events,
		apiKey:          append([]byte(nil), apiKey...),
		proxyAPIURL:     strings.TrimRight(strings.TrimSpace(proxyAPIURL), "/"),
		proxyHTTPClient: &http.Client{Timeout: proxyRequestTimeout},
		proxyCache: newCache[string, proxyResponse](cacheConfig[proxyResponse]{
			ttl:      proxyCacheTTL,
			maxBytes: proxyCacheMaxBytes,
			size:     func(response proxyResponse) int { return len(response.body) },
		}),
	}
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), allowBrowserClients())
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	syncRoutes := router.Group("/v1/sync")
	syncRoutes.POST("/push", server.authorize(), server.push)
	syncRoutes.GET("/pull", server.pull)
	syncRoutes.GET("/events", server.events)
	router.GET("/proxy/*path", server.proxy)
	return router
}

func allowBrowserClients() gin.HandlerFunc {
	return func(c *gin.Context) {
		if origin := c.GetHeader("Origin"); origin != "" {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
			c.Header("Access-Control-Allow-Private-Network", "true")
			c.Header("Access-Control-Max-Age", "86400")
			c.Header("Vary", "Origin")
		}
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

func (s *server) authorize() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, ok := bearerToken(c.GetHeader("Authorization"))
		if !ok || subtle.ConstantTimeCompare([]byte(token), s.apiKey) != 1 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "não autorizado"})
			return
		}
		c.Next()
	}
}

func (s *server) push(c *gin.Context) {
	var request struct {
		Hunts []partyHuntRequest `json:"hunts"`
	}
	if !decodeJSON(c, &request) {
		return
	}
	if len(request.Hunts) > maxChanges {
		c.JSON(http.StatusBadRequest, gin.H{"error": "máximo de 500 caçadas por envio"})
		return
	}

	changes := make([]change, 0, len(request.Hunts))
	for _, hunt := range request.Hunts {
		fingerprint := strings.ToLower(strings.TrimSpace(hunt.Fingerprint))
		if hunt.Deleted {
			if !validFingerprint(fingerprint) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "fingerprint inválido"})
				return
			}
			changes = append(changes, change{Fingerprint: fingerprint, Deleted: true})
			continue
		}

		calculatedFingerprint, ok := partyHuntFingerprint(hunt.SessionData, hunt.Members)
		if !ok || !json.Valid(hunt.Payload) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "party hunt inválida"})
			return
		}
		if fingerprint != "" && fingerprint != calculatedFingerprint {
			c.JSON(http.StatusBadRequest, gin.H{"error": "fingerprint não corresponde à party hunt"})
			return
		}
		changes = append(changes, change{Fingerprint: calculatedFingerprint, Payload: hunt.Payload})
	}

	accepted, serverTime, err := s.store.push(c.Request.Context(), changes)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao salvar alterações"})
		return
	}
	if len(accepted) > 0 {
		s.broker.publish(syncEvent{Cursor: serverTime, Fingerprints: accepted})
	}
	c.JSON(http.StatusOK, gin.H{"accepted": accepted, "server_time": serverTime})
}

func (s *server) pull(c *gin.Context) {
	page, err := s.store.pull(c.Request.Context(), parseCursor(c.Query("since")), pullPageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "erro ao ler alterações"})
		return
	}
	c.JSON(http.StatusOK, page)
}

func (s *server) events(c *gin.Context) {
	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming não suportado"})
		return
	}
	events, unsubscribe := s.broker.subscribe()
	defer unsubscribe()

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")
	c.Status(http.StatusOK)
	if _, err := io.WriteString(c.Writer, "event: ready\ndata: {}\n\n"); err != nil {
		return
	}
	flusher.Flush()

	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case event := <-events:
			data, err := json.Marshal(event)
			if err != nil {
				continue
			}
			if _, err := fmt.Fprintf(c.Writer, "id: %d\nevent: sync\ndata: %s\n\n", event.Cursor, data); err != nil {
				return
			}
			flusher.Flush()
		case <-heartbeat.C:
			if _, err := io.WriteString(c.Writer, ": keep-alive\n\n"); err != nil {
				return
			}
			flusher.Flush()
		case <-c.Request.Context().Done():
			return
		}
	}
}

func decodeJSON(c *gin.Context, target any) bool {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxJSONBody)
	defer c.Request.Body.Close()

	decoder := json.NewDecoder(c.Request.Body)
	if err := decoder.Decode(target); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return false
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return false
	}
	return true
}

func bearerToken(header string) (string, bool) {
	scheme, token, found := strings.Cut(strings.TrimSpace(header), " ")
	token = strings.TrimSpace(token)
	valid := found && strings.EqualFold(scheme, "Bearer") && token != "" && !strings.ContainsAny(token, " \t\r\n")
	return token, valid
}

func parseCursor(value string) int64 {
	cursor, err := strconv.ParseInt(value, 10, 64)
	if err != nil || cursor < 0 {
		return 0
	}
	return cursor
}

func partyHuntFingerprint(sessionData string, members []string) (string, bool) {
	sessionData = normalizeIdentityPart(sessionData)
	uniqueMembers := make(map[string]struct{}, len(members))
	for _, member := range members {
		if normalized := normalizeIdentityPart(member); normalized != "" {
			uniqueMembers[normalized] = struct{}{}
		}
	}
	if sessionData == "" || len(uniqueMembers) == 0 {
		return "", false
	}

	normalizedMembers := make([]string, 0, len(uniqueMembers))
	for member := range uniqueMembers {
		normalizedMembers = append(normalizedMembers, member)
	}
	sort.Strings(normalizedMembers)
	canonical := "session:" + sessionData + "\nmembers:" + strings.Join(normalizedMembers, "|")
	hash := sha256.Sum256([]byte(canonical))
	return hex.EncodeToString(hash[:]), true
}

func normalizeIdentityPart(value string) string {
	return strings.ToLower(strings.Join(strings.Fields(value), " "))
}

func validFingerprint(value string) bool {
	if len(value) != sha256.Size*2 {
		return false
	}
	_, err := hex.DecodeString(value)
	return err == nil
}
