package api

import "sync"

type syncEvent struct {
	Cursor       int64    `json:"cursor"`
	Fingerprints []string `json:"fingerprints"`
}

type broker struct {
	mutex       sync.RWMutex
	subscribers map[chan syncEvent]struct{}
}

func newBroker() *broker {
	return &broker{subscribers: make(map[chan syncEvent]struct{})}
}

func (b *broker) subscribe() (<-chan syncEvent, func()) {
	channel := make(chan syncEvent, 1)
	b.mutex.Lock()
	b.subscribers[channel] = struct{}{}
	b.mutex.Unlock()

	return channel, func() {
		b.mutex.Lock()
		delete(b.subscribers, channel)
		b.mutex.Unlock()
	}
}

func (b *broker) publish(event syncEvent) {
	b.mutex.RLock()
	defer b.mutex.RUnlock()
	for subscriber := range b.subscribers {
		select {
		case subscriber <- event:
		default:
		}
	}
}
