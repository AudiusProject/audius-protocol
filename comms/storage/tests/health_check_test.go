package tests

import (
	"context"
	"net/http"
	"testing"
)

func TestHealthCheck(t *testing.T) {
	client, server, err := SpawnServer()
	if err != nil {
		t.Fatalf("failed to start server, %+v", err)
	}

	resp, err := client.HealthCheck()
	if err != nil {
		t.Fatalf("failed to upload whitenoise, %+v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Fatalf("status code is not 200, got=%s", resp.Status)
	}

	if err := server.WebServer.Shutdown(context.Background()); err != nil {
		t.Fatalf("failed to shutdown server, %+v", err)
	}
}
