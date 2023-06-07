package server

import (
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/labstack/echo/v4"
	"github.com/tidwall/sjson"
)

func (ss *MediorumServer) getMyHealth(c echo.Context) error {
	return c.JSON(200, ss.healthReport())
}

func (ss *MediorumServer) getPeerHealth(c echo.Context) error {
	peers := []*ServerHealth{}
	ss.crud.DB.Find(&peers)
	healthyPeers, _ := ss.findHealthyPeers("2 minutes")
	return c.JSON(200, map[string]any{
		"peers":   peers,
		"healthy": healthyPeers,
	})
}

func (ss *MediorumServer) serveUnifiedHealthCheck(c echo.Context) error {
	j := []byte(`{}`)

	// attempt fetch from upstream?
	cnHealth, err := ss.fetchCreatorNodeHealth()
	if err != nil {
		j, _ = sjson.SetBytes(j, "creator_node_error", err)
	} else {
		j = cnHealth
	}

	// annotate with mediorum health
	mediorumHealth := map[string]any{
		"self":    ss.healthReport(),
		"peers":   ss.Config.Peers,
		"signers": ss.Config.Signers,
	}

	// peer health
	if peers, err := ss.allPeers(); err == nil {
		mediorumHealth["peers"] = peers
	}

	// problem blob count
	// this might be too expensive for health_check?
	// problemBlobCount, _ := ss.findProblemBlobsCount(false)
	// mediorumHealth["problem_blobs"] = problemBlobCount

	// cursor status
	cidCursors := []struct {
		Host      string    `json:"host"`
		UpdatedAt time.Time `json:"updated_at"`
	}{}
	if err := pgxscan.Select(c.Request().Context(), ss.pgPool, &cidCursors, `select * from cid_cursor order by host`); err == nil {
		mediorumHealth["cid_cursors"] = cidCursors
	}

	j, _ = sjson.SetBytes(j, "mediorum", mediorumHealth)

	return c.JSONBlob(200, j)
}

func (ss *MediorumServer) fetchCreatorNodeHealth() (json.RawMessage, error) {

	upstream, err := url.Parse(ss.Config.UpstreamCN)
	if err != nil {
		return nil, err
	}

	httpClient := http.Client{
		Timeout: time.Second,
	}

	resp, err := httpClient.Get(upstream.JoinPath("/health_check").String())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}
