package server

import (
	"io"
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
)

func (s *Server) proxyCometRequest(c echo.Context) error {
	rpcUrl := strings.ReplaceAll(s.config.RPCladdr, "tcp", "http")

	s.logger.Info("request", "url", rpcUrl, "method", c.Request().Method, "url", c.Request().RequestURI)

	path := rpcUrl + strings.TrimPrefix(c.Request().RequestURI, "/core/comet")

	req, err := http.NewRequest(c.Request().Method, path, c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "failed to create internal comet request"})
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to forward request"})
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to read response"})
	}

	return c.Blob(resp.StatusCode, resp.Header.Get("Content-Type"), body)
}
