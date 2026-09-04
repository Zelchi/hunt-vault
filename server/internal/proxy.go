package api

import (
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	maxProxyPathLength  = 1024
	maxProxyResponse    = 4 << 20
	proxyRequestTimeout = 10 * time.Second
	proxyCacheTTL       = 24 * time.Hour
	proxyCacheMaxBytes  = 256 << 20
)

type proxyResponse struct {
	status      int
	contentType string
	body        []byte
}

func (s *server) proxy(c *gin.Context) {
	proxyPath := c.Param("path")
	if !validProxyPath(proxyPath) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "caminho do proxy inválido"})
		return
	}

	accept := c.GetHeader("Accept")
	if accept == "" {
		accept = "application/json"
	}
	cacheKey := proxyCacheKey(proxyPath, c.Request.URL.Query(), accept)
	if s.proxyCache != nil {
		if entry, ok := s.proxyCache.get(cacheKey); ok {
			c.Header("X-Proxy-Cache", "HIT")
			writeProxyResponse(c, entry)
			return
		}
	}

	s.forwardProxy(c, proxyPath, c.Request.URL.Query(), cacheKey, accept)
}

func validProxyPath(value string) bool {
	if value == "" || value == "/" || len(value) > maxProxyPathLength || !strings.HasPrefix(value, "/") || strings.ContainsAny(value, "\x00?#\\") {
		return false
	}

	for _, segment := range strings.Split(strings.TrimPrefix(value, "/"), "/") {
		if segment == "" || segment == "." || segment == ".." {
			return false
		}
	}
	return true
}

func proxyCacheKey(path string, queryValues url.Values, accept string) string {
	return path + "\x00" + queryValues.Encode() + "\x00" + accept
}

func (s *server) forwardProxy(c *gin.Context, proxyPath string, query url.Values, cacheKey, accept string) {
	baseURL := s.proxyAPIURL
	if baseURL == "" {
		baseURL = defaultProxyAPIURL
	}

	upstreamURL, err := url.Parse(baseURL + proxyPath)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "URL do proxy inválida"})
		return
	}
	upstreamURL.RawQuery = query.Encode()

	request, err := http.NewRequestWithContext(c.Request.Context(), http.MethodGet, upstreamURL.String(), nil)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "não foi possível consultar o serviço externo"})
		return
	}
	request.Header.Set("Accept", accept)

	client := s.proxyHTTPClient
	if client == nil {
		client = defaultProxyHTTPClient()
	}
	response, err := client.Do(request)
	if err != nil {
		if c.Request.Context().Err() != nil {
			return
		}
		c.JSON(http.StatusBadGateway, gin.H{"error": "serviço externo indisponível"})
		return
	}
	defer response.Body.Close()

	body, err := io.ReadAll(io.LimitReader(response.Body, maxProxyResponse+1))
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": "resposta inválida do serviço externo"})
		return
	}
	if len(body) > maxProxyResponse {
		c.JSON(http.StatusBadGateway, gin.H{"error": "resposta do serviço externo excede o limite"})
		return
	}

	contentType := response.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/json"
	}

	if response.StatusCode >= http.StatusOK && response.StatusCode < http.StatusMultipleChoices && s.proxyCache != nil {
		s.proxyCache.set(cacheKey, proxyResponse{
			status:      response.StatusCode,
			contentType: contentType,
			body:        body,
		})
	}
	c.Header("X-Proxy-Cache", "MISS")
	c.Data(response.StatusCode, contentType, body)
}

func writeProxyResponse(c *gin.Context, entry proxyResponse) {
	c.Data(entry.status, entry.contentType, entry.body)
}

func defaultProxyHTTPClient() *http.Client {
	return &http.Client{Timeout: proxyRequestTimeout}
}
