package api

import (
	"context"
	"fmt"
	"net/http"

	"gorm.io/gorm"
)

type App struct {
	db      *gorm.DB
	Handler http.Handler
}

func New(ctx context.Context, config Config) (*App, error) {
	if err := config.Validate(); err != nil {
		return nil, fmt.Errorf("configuração inválida: %w", err)
	}

	db, err := openDatabase(ctx, config.DatabasePath)
	if err != nil {
		return nil, err
	}
	if err := migrateDatabase(ctx, db); err != nil {
		_ = closeDatabase(db)
		return nil, err
	}

	events := newBroker()
	return &App{
		db:      db,
		Handler: newApplicationHandler(newRouter(newStore(db), events, config.SyncAPIKey), config.StaticDir),
	}, nil
}

func (a *App) Close() error {
	if a == nil {
		return nil
	}
	return closeDatabase(a.db)
}
