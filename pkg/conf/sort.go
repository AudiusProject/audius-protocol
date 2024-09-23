//go:build osx
// +build osx

package conf

import (
	"strconv"
	"unicode"
)

// i.e. host10.node.com should come after host5.node.com
type NaturalSort []string

func (s NaturalSort) Len() int {
	return len(s)
}

func (s NaturalSort) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s NaturalSort) Less(i, j int) bool {
	return compareNatural(s[i], s[j]) < 0
}

// compareNatural compares two strings alphanumerically
func compareNatural(a, b string) int {
	ai, bi := 0, 0
	for ai < len(a) && bi < len(b) {
		ar, br := a[ai], b[bi]
		if unicode.IsDigit(rune(ar)) && unicode.IsDigit(rune(br)) {
			anum, aidx := extractNumber(a, ai)
			bnum, bidx := extractNumber(b, bi)
			if anum != bnum {
				return anum - bnum
			}
			ai, bi = aidx, bidx
		} else {
			if ar != br {
				if ar < br {
					return -1
				}
				return 1
			}
			ai++
			bi++
		}
	}
	if len(a) < len(b) {
		return -1
	}
	if len(a) > len(b) {
		return 1
	}
	return 0
}

func extractNumber(s string, i int) (int, int) {
	start := i
	for i < len(s) && unicode.IsDigit(rune(s[i])) {
		i++
	}
	num, _ := strconv.Atoi(s[start:i])
	return num, i
}
