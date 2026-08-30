package api

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"gorm.io/gorm"
)

type change struct {
	Fingerprint string
	Payload     json.RawMessage `json:"payload"`
	Deleted     bool            `json:"deleted"`
}

type storedPartyHunt struct {
	Fingerprint string          `json:"fingerprint"`
	Payload     json.RawMessage `json:"payload"`
	Version     int             `json:"version"`
	UpdatedAt   int64           `json:"updated_at"`
	Deleted     bool            `json:"deleted"`
}

type pullPage struct {
	Hunts   []storedPartyHunt `json:"hunts"`
	Cursor  int64             `json:"cursor"`
	HasMore bool              `json:"has_more"`
}

type store struct{ db *gorm.DB }

func newStore(db *gorm.DB) *store { return &store{db: db} }

func (s *store) push(ctx context.Context, changes []change) ([]string, int64, error) {
	accepted := make([]string, 0, len(changes))
	serverTime := int64(0)

	err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&partyHunt{}).Select("COALESCE(MAX(updated_at), 0)").Scan(&serverTime).Error; err != nil {
			return fmt.Errorf("consultar último timestamp: %w", err)
		}
		if len(changes) == 0 {
			return nil
		}

		nextTimestamp := time.Now().UnixMilli()
		if nextTimestamp <= serverTime {
			nextTimestamp = serverTime + 1
		}

		const upsert = `
INSERT INTO party_hunts (fingerprint, payload, version, updated_at, deleted_at)
VALUES (?, ?, 1, ?, ?)
ON CONFLICT(fingerprint) DO UPDATE SET
  payload = excluded.payload,
  version = party_hunts.version + 1,
  updated_at = excluded.updated_at,
  deleted_at = excluded.deleted_at`

		for index, change := range changes {
			updatedAt := nextTimestamp + int64(index)
			payload := string(change.Payload)
			var deletedAt *int64
			if change.Deleted {
				payload = "{}"
				deletedAt = &updatedAt
			}

			if err := tx.Exec(upsert, change.Fingerprint, payload, updatedAt, deletedAt).Error; err != nil {
				return fmt.Errorf("salvar party hunt: %w", err)
			}

			serverTime = updatedAt
			accepted = append(accepted, change.Fingerprint)
		}
		return nil
	})
	if err != nil {
		return nil, 0, err
	}
	return accepted, serverTime, nil
}

func (s *store) pull(ctx context.Context, since int64, limit int) (pullPage, error) {
	page := pullPage{Hunts: []storedPartyHunt{}, Cursor: since}
	if limit < 1 {
		return page, nil
	}

	records := make([]partyHunt, 0, limit+1)
	if err := s.db.WithContext(ctx).
		Where("updated_at > ?", since).
		Order("updated_at ASC, fingerprint ASC").
		Limit(limit + 1).
		Find(&records).Error; err != nil {
		return pullPage{}, err
	}

	page.HasMore = len(records) > limit
	if page.HasMore {
		records = records[:limit]
	}
	for _, item := range records {
		page.Hunts = append(page.Hunts, storedPartyHunt{
			Fingerprint: item.Fingerprint,
			Payload:     json.RawMessage(item.Payload),
			Version:     item.Version,
			UpdatedAt:   item.UpdatedAt,
			Deleted:     item.DeletedAt != nil,
		})
	}
	if len(page.Hunts) > 0 {
		page.Cursor = page.Hunts[len(page.Hunts)-1].UpdatedAt
	}
	return page, nil
}
