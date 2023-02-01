// Package bucketer handles the logic for deciding which content falls into which buckets.
// Implemented for cuid2, which consists of only numbers and lowercase letters (base36).
package bucketer

import "math"

var base36Chars = [36]string{"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

type Bucketer struct {
	PrefixLength int
	Buckets      []string
}

// New creates a Bucketer that partitions each id into buckets based on the first prefixLength letters.
// Example: prefixLength=1 means buckets like "a", "z", "0", "9". prefixLength=2 means buckets like "aa", "zz", "00", "99".
func New(prefixLength int) *Bucketer {
	return &Bucketer{
		PrefixLength: prefixLength,
		Buckets:      makeBuckets(prefixLength, base36Chars[:]),
	}
}

// GetBucketForId returns the bucket that id should be stored in.
func (b *Bucketer) GetBucketForId(id string) string {
	return id[len(id)-b.PrefixLength:]
}

// makeBuckets recursively generates all string combinations of length prefixLength using chars.
func makeBuckets(prefixLength int, chars []string) []string {
	buckets := make([]string, int(math.Pow(float64(len(base36Chars)), float64(prefixLength))))
	i := 0
	for _, c := range base36Chars {
		if prefixLength == 1 {
			buckets[i] = c
			i++
			continue
		}
		for _, res := range makeBuckets(prefixLength-1, chars) {
			buckets[i] = c + res
			i++
		}
	}
	return buckets
}
