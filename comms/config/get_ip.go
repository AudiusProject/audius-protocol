package config

import (
	"io"
	"net/http"
	"os"
	"strings"
)

func getIp() (string, error) {
	if testHost := os.Getenv("test_host"); testHost != "" {
		return testHost, nil
	}

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
