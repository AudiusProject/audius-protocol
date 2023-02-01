// Package decider decides which IDs this node should store.
package decider

type StorageDecider interface {
	// ShouldStore returns true if this node should store the content with ID id.
	ShouldStore(id string) bool

	// OnChange finds content that needs to be stored or deleted and fetches or deletes it.
	OnChange(prevBuckets []string, curBuckets []string) error
}

// NaiveDecider is a storage decider that stores everything.
type NaiveDecider struct{}

// NewNaiveDecider creates a storage decider that makes this node store all content.
func NewNaiveDecider() *NaiveDecider {
	return &NaiveDecider{}
}

func (d *NaiveDecider) ShouldStore(id string) bool {
	return true
}

func (d *NaiveDecider) OnChange(prevBuckets []string, curBuckets []string) error {
	return nil
}
