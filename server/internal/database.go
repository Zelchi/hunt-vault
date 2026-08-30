package api

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type partyHunt struct {
	Fingerprint string `gorm:"type:text;primaryKey"`
	Payload     string `gorm:"type:text;not null"`
	Version     int    `gorm:"not null"`
	UpdatedAt   int64  `gorm:"not null;autoCreateTime:false;autoUpdateTime:false;index:party_hunts_sync_idx"`
	DeletedAt   *int64
}

func (partyHunt) TableName() string { return "party_hunts" }

func openDatabase(ctx context.Context, path string) (*gorm.DB, error) {
	if directory := filepath.Dir(path); directory != "." {
		if err := os.MkdirAll(directory, 0o755); err != nil {
			return nil, fmt.Errorf("criar diretório do banco de dados: %w", err)
		}
	}

	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Error),
	})
	if err != nil {
		return nil, fmt.Errorf("abrir banco de dados: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("obter conexão do banco de dados: %w", err)
	}
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)
	if err := sqlDB.PingContext(ctx); err != nil {
		_ = sqlDB.Close()
		return nil, fmt.Errorf("conectar ao banco de dados: %w", err)
	}
	return db, nil
}

func closeDatabase(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

func migrateDatabase(ctx context.Context, db *gorm.DB) error {
	db = db.WithContext(ctx)
	for _, pragma := range []string{
		"PRAGMA foreign_keys = ON",
		"PRAGMA journal_mode = WAL",
		"PRAGMA synchronous = NORMAL",
		"PRAGMA busy_timeout = 5000",
	} {
		if err := db.Exec(pragma).Error; err != nil {
			return fmt.Errorf("configurar SQLite: %w", err)
		}
	}

	if err := db.AutoMigrate(&partyHunt{}); err != nil {
		return fmt.Errorf("migrar tabela de party hunts: %w", err)
	}
	return nil
}
