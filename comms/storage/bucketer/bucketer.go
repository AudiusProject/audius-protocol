// Package bucketer handles the logic for deciding which content falls into which buckets.
// Implemented for cuid2, which consists of only numbers and lowercase letters (base36).
package bucketer

import (
	"log"
	"math"

	"golang.org/x/exp/slices"
)

var base36Chars = [36]string{"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

type Bucketer struct {
	SuffixLength int
	Buckets      []string
}

// New creates a Bucketer that partitions each id into buckets based on the last suffixLength letters.
// Example: suffixLength=1 means buckets like "a", "z", "0", "9". suffixLength=2 means buckets like "aa", "zz", "00", "99".
func New(suffixLength int) *Bucketer {
	return &Bucketer{
		SuffixLength: suffixLength,
		Buckets:      makeBuckets(suffixLength, base36Chars[:]),
	}
}

// GetBucketForId returns the bucket that id should be stored in.
func (b *Bucketer) GetBucketForId(id string) string {
	bucket := id[len(id)-b.SuffixLength:]
	if !slices.Contains(b.Buckets, bucket) {
		log.Fatalf("bucket %s not found (id=%q)", bucket, id)
	}
	return bucket
}

// makeBuckets recursively generates all string combinations of length suffixLength using chars.
func makeBuckets(suffixLength int, chars []string) []string {
	buckets := make([]string, int(math.Pow(float64(len(base36Chars)), float64(suffixLength))))
	i := 0
	for _, c := range base36Chars {
		if suffixLength == 1 {
			buckets[i] = c
			i++
			continue
		}
		for _, bucketLenMinus1 := range makeBuckets(suffixLength-1, chars) {
			buckets[i] = c + bucketLenMinus1
			i++
		}
	}
	return buckets
}
