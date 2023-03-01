package peering

import (
	"io"
	"net/http"
	"strings"
)

func getIp() (string, error) {
	resp, err := http.Get("https://icanhazip.com/")
	if err != nil {
		return "", err
	}

	rawIp, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	ip := strings.TrimSpace(string(rawIp))

	return ip, nil
}
