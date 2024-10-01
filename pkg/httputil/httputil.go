package httputil

import "regexp"

var (
	trailingSlash = regexp.MustCompile("/$")
)

func RemoveTrailingSlash(s string) string {
	return trailingSlash.ReplaceAllString(s, "")
}
