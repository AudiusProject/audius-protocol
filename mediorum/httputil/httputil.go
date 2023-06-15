package httputil

import "regexp"

func RemoveTrailingSlash(s string) string {
	re := regexp.MustCompile("/$")
	return re.ReplaceAllString(s, "")
}
