package misc

import (
	"strings"
)

func TrimTrailingSlash(h string) string {
	return strings.TrimRight(strings.TrimSpace(h), "/")
}
