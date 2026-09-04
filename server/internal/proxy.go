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
)

func (s *server) proxy(c *gin.Context) {
	proxyPath := c.Param("path")
	if !validProxyPath(proxyPath) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "caminho do proxy inválido"})
		return
	}

	s.forwardProxy(c, proxyPath, c.Request.URL.Query())
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

func (s *server) forwardProxy(c *gin.Context, proxyPath string, query url.Values) {
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
	if accept := c.GetHeader("Accept"); accept != "" {
		request.Header.Set("Accept", accept)
	} else {
		request.Header.Set("Accept", "application/json")
	}

	client := s.proxyHTTPClient
	if client == nil {
		client = &http.Client{Timeout: proxyRequestTimeout}
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
	c.Data(response.StatusCode, contentType, body)
}
