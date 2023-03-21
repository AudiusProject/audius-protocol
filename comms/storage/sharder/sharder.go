// Package sharder handles the logic for deciding which content falls into which shards.
// Implemented for cuid2, which consists of only numbers and lowercase letters (base36).
package sharder

import (
	"fmt"
	"math"

	"golang.org/x/exp/slices"
)

var base36Chars = [36]string{"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

type Sharder struct {
	SuffixLength int
	Shards       []string
}

// New creates a Sharder that partitions each id into shards based on the last suffixLength letters.
// Example: suffixLength=1 means shards like "a", "z", "0", "9". suffixLength=2 means shards like "aa", "zz", "00", "99".
func New(suffixLength int) *Sharder {
	return &Sharder{
		SuffixLength: suffixLength,
		Shards:       makeShards(suffixLength, base36Chars[:]),
	}
}

// GetShardForId returns the shard that id should be stored in.
func (b *Sharder) GetShardForId(id string) (string, error) {
	shard := id[len(id)-b.SuffixLength:]
	if !slices.Contains(b.Shards, shard) {
		return "", fmt.Errorf("shard %s not found (id=%q)", shard, id)
	}
	return shard, nil
}

// makeShards recursively generates all string combinations of length suffixLength using chars.
func makeShards(suffixLength int, chars []string) []string {
	shards := make([]string, int(math.Pow(float64(len(base36Chars)), float64(suffixLength))))
	i := 0
	for _, c := range base36Chars {
		if suffixLength == 1 {
			shards[i] = c
			i++
			continue
		}
		for _, shardLenMinus1 := range makeShards(suffixLength-1, chars) {
			shards[i] = c + shardLenMinus1
			i++
		}
	}
	return shards
}
