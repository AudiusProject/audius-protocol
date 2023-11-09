package main

import "net/url"

func apiPath(parts ...string) string {
	host := parts[0]
	parts[0] = ""
	u, err := url.Parse(host)
	if err != nil {
		panic(err)
	}
	u = u.JoinPath(parts...)
	return u.String()
}
