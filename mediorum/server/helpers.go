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

// replaces the host portion of a URL, maintaining path and query params
func replaceHost(u url.URL, newHost string) url.URL {
	u.Host = cleanHost(newHost)
	return u
}

// gets the host from a URL string
// without protocol
func cleanHost(host string) string {
	u, _ := url.Parse(host)
	return u.Host
}

func isLegacyCID(cid string) bool {
	return len(cid) == 46 && strings.HasPrefix(cid, "Qm")
}
