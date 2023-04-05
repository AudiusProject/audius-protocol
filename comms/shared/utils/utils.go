package utils

// Returns the elements in `a` that aren't in `b`.
func Difference(a, b []int32) []int32 {
	bMap := make(map[int32]struct{}, len(b))
	for _, elem := range b {
		bMap[elem] = struct{}{}
	}
	var diff []int32
	for _, elem := range a {
		if _, found := bMap[elem]; !found {
			diff = append(diff, elem)
		}
	}
	return diff
}
