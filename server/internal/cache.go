package api

import (
	"sync"
	"time"
)

type cacheConfig[V any] struct {
	ttl        time.Duration
	maxEntries int
	maxBytes   int
	size       func(V) int
}

type cache[K comparable, V any] struct {
	mu         sync.Mutex
	entries    map[K]cacheEntry[V]
	ttl        time.Duration
	maxEntries int
	maxBytes   int
	size       func(V) int
	totalBytes int
}

type cacheEntry[V any] struct {
	value      V
	size       int
	expiresAt  time.Time
	lastUsedAt time.Time
}

func newCache[K comparable, V any](config cacheConfig[V]) *cache[K, V] {
	return &cache[K, V]{
		entries:    make(map[K]cacheEntry[V]),
		ttl:        config.ttl,
		maxEntries: config.maxEntries,
		maxBytes:   config.maxBytes,
		size:       config.size,
	}
}

func (cache *cache[K, V]) get(key K) (V, bool) {
	now := time.Now()

	cache.mu.Lock()
	defer cache.mu.Unlock()

	entry, ok := cache.entries[key]
	if !ok {
		var zero V
		return zero, false
	}
	if !now.Before(entry.expiresAt) {
		cache.remove(key)
		var zero V
		return zero, false
	}

	entry.lastUsedAt = now
	cache.entries[key] = entry
	return entry.value, true
}

func (cache *cache[K, V]) set(key K, value V) {
	valueSize := 0
	if cache.size != nil {
		valueSize = max(cache.size(value), 0)
	}
	if cache.maxBytes > 0 && valueSize > cache.maxBytes {
		return
	}

	now := time.Now()
	entry := cacheEntry[V]{
		value:      value,
		size:       valueSize,
		expiresAt:  now.Add(cache.ttl),
		lastUsedAt: now,
	}

	cache.mu.Lock()
	defer cache.mu.Unlock()

	cache.removeExpired(now)
	cache.remove(key)
	for (cache.maxEntries > 0 && len(cache.entries) >= cache.maxEntries) || (cache.maxBytes > 0 && cache.totalBytes+valueSize > cache.maxBytes) {
		if !cache.removeLeastRecentlyUsed() {
			return
		}
	}

	cache.entries[key] = entry
	cache.totalBytes += valueSize
}

func (cache *cache[K, V]) removeExpired(now time.Time) {
	for key, entry := range cache.entries {
		if !now.Before(entry.expiresAt) {
			cache.remove(key)
		}
	}
}

func (cache *cache[K, V]) removeLeastRecentlyUsed() bool {
	var oldestKey K
	var oldestTime time.Time
	found := false
	for key, entry := range cache.entries {
		if !found || entry.lastUsedAt.Before(oldestTime) {
			oldestKey = key
			oldestTime = entry.lastUsedAt
			found = true
		}
	}
	if !found {
		return false
	}
	cache.remove(oldestKey)
	return true
}

func (cache *cache[K, V]) remove(key K) {
	entry, ok := cache.entries[key]
	if !ok {
		return
	}
	cache.totalBytes -= entry.size
	delete(cache.entries, key)
}
