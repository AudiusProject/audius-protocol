package server

import (
	"path"
	"strings"
)

func apiPath(parts ...string) string {
	host := parts[0]
	parts[0] = apiBasePath
	return host + path.Join(parts...)
}

func isLegacyCID(cid string) bool {
	return len(cid) == 46 && strings.HasPrefix(cid, "Qm")
}
