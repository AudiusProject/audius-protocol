package server

import "path"

func apiPath(parts ...string) string {
	host := parts[0]
	parts[0] = apiBasePath
	return host + path.Join(parts...)
}
