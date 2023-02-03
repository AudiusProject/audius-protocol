package natsd

import (
	"encoding/json"
	"regexp"

	"github.com/labstack/echo/v4"
)

var ipRegexp = regexp.MustCompile(`\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}`)

func redactIp(src []byte) []byte {
	return ipRegexp.ReplaceAllFunc(src, func(m []byte) []byte {
		dots := 1
		for idx, char := range m {
			if char == '.' {
				dots++
			} else if dots > 2 {
				m[idx] = 'x'
			}
		}
		return m
	})
}

func redactedJson(c echo.Context, obj interface{}) error {
	j, err := json.Marshal(obj)
	if err != nil {
		return err
	}
	return c.Blob(200, "application/json", redactIp(j))
}
