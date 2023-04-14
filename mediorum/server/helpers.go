package server

import (
	"net/url"
	"strings"
)

func apiPath(parts ...string) string {
	host := parts[0]
	parts[0] = apiBasePath
	u, err := url.Parse(host)
	if err != nil {
		panic(err)
	}
	u = u.JoinPath(parts...)
	return u.String()
}

func isLegacyCID(cid string) bool {
	return len(cid) == 46 && strings.HasPrefix(cid, "Qm")
}
