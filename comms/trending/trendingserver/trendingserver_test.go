package trendingserver_test

import (
	"io"
	"testing"

	"comms.audius.co/trending/testutils"
	"github.com/imroc/req/v3"
	"github.com/stretchr/testify/assert"
)

func TestGetHealth(t *testing.T) {
	testutils.IntegrationTester(func(c *req.Client) error {
		resp, err := c.R().Get("http://localhost:9876/trending/health")
		if err != nil {
			return err
		}
		assert.Equal(t, resp.StatusCode, 200)
		b, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		assert.Equal(t, string(b), "healthy :)")
		return nil
	})
}

func TestGetTracksTrending(t *testing.T) {
	testutils.IntegrationTester(func(c *req.Client) error {
		resp, err := c.R().Get("http://localhost:9876/tracks/trending")
		if err != nil {
			return err
		}
		assert.Equal(t, resp.StatusCode, 200)
		b, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		assert.Equal(t, string(b), "no tracks are trending yet :)")
		return nil
	})
}

func TestGetPlaylistsTrending(t *testing.T) {
	testutils.IntegrationTester(func(c *req.Client) error {
		resp, err := c.R().Get("http://localhost:9876/playlists/trending")
		if err != nil {
			return err
		}
		assert.Equal(t, resp.StatusCode, 200)
		b, err := io.ReadAll(resp.Body)
		if err != nil {
			return err
		}
		assert.Equal(t, string(b), "no playlists are trending yet :)")
		return nil
	})
}
