package api

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

func newApplicationHandler(apiHandler http.Handler, staticDir string) http.Handler {
	mux := http.NewServeMux()
	mux.Handle("/api", http.StripPrefix("/api", apiHandler))
	mux.Handle("/api/", http.StripPrefix("/api", apiHandler))
	mux.Handle("/health", apiHandler)
	mux.Handle("/v1/", apiHandler)

	if strings.TrimSpace(staticDir) == "" {
		mux.Handle("/", apiHandler)
		return mux
	}

	mux.Handle("/", singlePageApplication(staticDir))
	return mux
}

func singlePageApplication(staticDir string) http.Handler {
	fileServer := http.FileServer(http.Dir(staticDir))
	indexPath := filepath.Join(staticDir, "index.html")

	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.Method != http.MethodGet && request.Method != http.MethodHead {
			http.NotFound(response, request)
			return
		}

		requestPath := path.Clean("/" + request.URL.Path)
		relativePath := strings.TrimPrefix(requestPath, "/")
		localPath := filepath.Join(staticDir, filepath.FromSlash(relativePath))
		info, err := os.Stat(localPath)
		if requestPath == "/" || (err == nil && (info.IsDir() || info.Mode().IsRegular())) {
			fileServer.ServeHTTP(response, request)
			return
		}

		if !os.IsNotExist(err) {
			http.Error(response, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
		http.ServeFile(response, request, indexPath)
	})
}
