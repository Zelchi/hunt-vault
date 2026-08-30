package test

import (
	"path/filepath"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestStoresOnlyPartyHunts(t *testing.T) {
	databasePath := filepath.Join(t.TempDir(), "hunt-vault.db")
	app := newTestApp(t, databasePath)
	push(t, app.Handler, []syncHunt{partyHunt("session", "Alice", "Bob")})
	if err := app.Close(); err != nil {
		t.Fatalf("close app: %v", err)
	}

	db, err := gorm.Open(sqlite.Open(databasePath), &gorm.Config{})
	if err != nil {
		t.Fatalf("open database: %v", err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("get SQL database: %v", err)
	}
	defer sqlDB.Close()

	var partyHunts int64
	if err := db.Raw("SELECT COUNT(*) FROM party_hunts").Scan(&partyHunts).Error; err != nil {
		t.Fatalf("count party hunts: %v", err)
	}
	var genericTables int64
	if err := db.Raw("SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'records'").Scan(&genericTables).Error; err != nil {
		t.Fatalf("inspect generic records table: %v", err)
	}
	if partyHunts != 1 || genericTables != 0 {
		t.Fatalf("storage has party_hunts=%d records_tables=%d, want 1 and 0", partyHunts, genericTables)
	}
}
