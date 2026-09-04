package api

import (
	"bufio"
	"errors"
	"fmt"
	"log"
	"net/url"
	"os"
	"strings"
)

const defaultProxyAPIURL = "https://api.increasesoft.com/api"

type Config struct {
	Address      string
	DatabasePath string
	StaticDir    string
	SyncAPIKey   []byte
	ProxyAPIURL  string
}

func LoadConfig() Config {
	if err := loadDotEnv(".env"); err != nil {
		log.Printf("erro ao carregar .env: %v", err)
	}
	return Config{
		Address:      env("ADDR", ":8080"),
		DatabasePath: env("DATABASE_PATH", "data/hunt-vault.db"),
		StaticDir:    env("STATIC_DIR", ""),
		SyncAPIKey:   []byte(env("SYNC_API_KEY", "")),
		ProxyAPIURL:  env("PROXY_API_URL", defaultProxyAPIURL),
	}
}

func (c Config) Validate() error {
	c = c.withDefaults()
	if strings.TrimSpace(c.Address) == "" {
		return errors.New("ADDR não pode ser vazio")
	}
	if strings.TrimSpace(c.DatabasePath) == "" {
		return errors.New("DATABASE_PATH não pode ser vazio")
	}
	if strings.ContainsRune(c.StaticDir, '\x00') {
		return errors.New("STATIC_DIR contém um caminho inválido")
	}
	if len(c.SyncAPIKey) < 32 {
		return errors.New("SYNC_API_KEY deve ter pelo menos 32 bytes")
	}
	if err := validateProxyAPIURL(c.ProxyAPIURL); err != nil {
		return err
	}
	return nil
}

func (c Config) withDefaults() Config {
	if strings.TrimSpace(c.ProxyAPIURL) == "" {
		c.ProxyAPIURL = defaultProxyAPIURL
	}
	return c
}

func validateProxyAPIURL(value string) error {
	parsed, err := url.Parse(strings.TrimRight(strings.TrimSpace(value), "/"))
	if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" || parsed.RawQuery != "" || parsed.Fragment != "" {
		return errors.New("PROXY_API_URL deve ser uma URL HTTP(S) válida sem query ou fragmento")
	}
	return nil
}

func loadDotEnv(path string) error {
	file, err := os.Open(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil
		}
		return fmt.Errorf("abrir arquivo: %w", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(strings.TrimPrefix(scanner.Text(), "\uFEFF"))
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, found := strings.Cut(line, "=")
		key = strings.TrimSpace(strings.TrimPrefix(key, "export "))
		if !found || key == "" || os.Getenv(key) != "" {
			continue
		}
		_ = os.Setenv(key, strings.Trim(strings.TrimSpace(value), `"`))
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("ler arquivo: %w", err)
	}
	return nil
}

func env(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}
