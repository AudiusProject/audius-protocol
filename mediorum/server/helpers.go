package server

import (
	"io"
	"net/http"
	"net/url"
	"os"
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

func sniffMimeType(r io.ReadSeeker) string {
	buffer := make([]byte, 512)
	r.Read(buffer)
	r.Seek(0, 0)
	return http.DetectContentType(buffer)
}

// returns true if file exists and sniffed mime type is audio.*
// returns false if anything goes wrong (i.e. file doesn't exist).
// if file doesn't exist we want to fall thru to redirect behavior instead of blocking.
func isAudioFile(filePath string) bool {
	if f, err := os.Open(filePath); err == nil {
		mime := sniffMimeType(f)
		f.Close()
		return strings.HasPrefix(mime, "audio")
	}
	return false
}
