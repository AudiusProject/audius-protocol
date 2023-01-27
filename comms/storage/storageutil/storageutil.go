// Package storageutil provides miscellaneous utilities for storage nodes.
package storageutil

import (
	"time"
)

func TimeNowPtr() *time.Time {
	now := time.Now()
	return &now
}
