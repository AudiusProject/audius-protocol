package server

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mediorum/ethcontracts"
	"mediorum/server/signature"
	"net/http"
	"net/url"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/labstack/echo/v4"
	"gocloud.dev/blob"
)

type cidCursor struct {
	Host      string    `json:"host"`
	UpdatedAt time.Time `json:"updated_at"`
}

type healthCheckResponse struct {
	Data      healthCheckResponseData `json:"data"`
	Signer    string                  `json:"signer"`
	Signature string                  `json:"signature"`
	Timestamp time.Time               `json:"timestamp"`
}
type healthCheckResponseData struct {
	Healthy                   bool   `json:"healthy"`
	Version                   string `json:"version"`
	Service                   string `json:"service"` // used by registerWithDelegate()
	SPID                      int    `json:"spID"`
	SPOwnerWallet             string `json:"spOwnerWallet"`
	Git                       string `json:"git"`
	AudiusDockerCompose       string `json:"audiusDockerCompose"`
	StoragePathUsed           uint64 `json:"storagePathUsed"` // bytes
	StoragePathSize           uint64 `json:"storagePathSize"` // bytes
	DatabaseSize              uint64 `json:"databaseSize"`    // bytes
	AutoUpgradeEnabled        bool   `json:"autoUpgradeEnabled"`
	SelectedDiscoveryProvider string `json:"selectedDiscoveryProvider"`

	StartedAt         time.Time                  `json:"startedAt"`
	TrustedNotifier   *ethcontracts.NotifierInfo `json:"trustedNotifier"`
	Env               string                     `json:"env"`
	Self              Peer                       `json:"self"`
	Peers             []Peer                     `json:"peers"`
	Signers           []Peer                     `json:"signers"`
	ReplicationFactor int                        `json:"replicationFactor"`
	Dir               string                     `json:"dir"`
	ListenPort        string                     `json:"listenPort"`
	UpstreamCN        string                     `json:"upstreamCN"`
	TrustedNotifierID int                        `json:"trustedNotifierId"`
}

type legacyHealth struct {
	Version                   string `json:"version"`
	Service                   string `json:"service"`
	SelectedDiscoveryProvider string `json:"selectedDiscoveryProvider"`
}

func (ss *MediorumServer) serveHealthCheck(c echo.Context) error {
	legacyHealth, err := ss.fetchCreatorNodeHealth()
	data := healthCheckResponseData{
		Healthy:                   err == nil,
		Version:                   legacyHealth.Version,
		Service:                   legacyHealth.Service,
		SelectedDiscoveryProvider: legacyHealth.SelectedDiscoveryProvider,
		SPID:                      ss.Config.SPID,
		SPOwnerWallet:             ss.Config.SPOwnerWallet,
		Git:                       ss.Config.GitSHA,
		AudiusDockerCompose:       ss.Config.AudiusDockerCompose,
		StoragePathUsed:           ss.storagePathUsed,
		StoragePathSize:           ss.storagePathSize,
		DatabaseSize:              ss.databaseSize,
		AutoUpgradeEnabled:        ss.Config.AutoUpgradeEnabled,
		StartedAt:                 ss.StartedAt,
		TrustedNotifier:           ss.trustedNotifier,
		Dir:                       ss.Config.Dir,
		ListenPort:                ss.Config.ListenPort,
		UpstreamCN:                ss.Config.UpstreamCN,
		Peers:                     ss.Config.Peers,
		Signers:                   ss.Config.Signers,
		ReplicationFactor:         ss.Config.ReplicationFactor,
		Env:                       ss.Config.Env,
		Self:                      ss.Config.Self,
	}
	sortedData, err := signature.SortKeys(data)
	if err != nil {
		return errors.New("failed to sort health check data: " + err.Error())
	}
	signature, err := signature.Sign(sortedData, ss.Config.privateKey)
	if err != nil {
		return errors.New("failed to sign health check response: " + err.Error())
	}
	signatureHex := fmt.Sprintf("0x%s", hex.EncodeToString(signature))
	return c.JSON(200, healthCheckResponse{
		Data:      data,
		Signer:    ss.Config.Self.Wallet,
		Signature: signatureHex,
		Timestamp: time.Now(),
	})
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

func (ss *MediorumServer) fetchCreatorNodeHealth() (legacyHealth legacyHealth, err error) {
	upstream, err := url.Parse(ss.Config.UpstreamCN)
	if err != nil {
		return
	}

	httpClient := http.Client{
		Timeout: time.Second,
	}

	resp, err := httpClient.Get(upstream.JoinPath("/health_check").String())
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return
	}

	err = json.Unmarshal(body, &legacyHealth)
	return
}

func (ss *MediorumServer) getLs(c echo.Context) error {
	ctx := c.Request().Context()
	page, _, err := ss.bucket.ListPage(ctx, blob.FirstPageToken, 100, nil)
	if err != nil {
		return err
	}
	return c.JSON(200, page)
}

func (ss *MediorumServer) dumpBlobs(c echo.Context) error {
	var blobs []*Blob
	ss.crud.DB.Unscoped().Order("key, host").Find(&blobs)
	return c.JSON(200, blobs)
}

func (ss *MediorumServer) dumpUploads(c echo.Context) error {
	var uploads []*Upload
	ss.crud.DB.Unscoped().Order("id").Find(&uploads)
	return c.JSON(200, uploads)
}

func (ss *MediorumServer) debugPeers(c echo.Context) error {
	return c.JSON(200, map[string]interface{}{
		"peers":   ss.Config.Peers,
		"signers": ss.Config.Signers,
	})
}

func (ss *MediorumServer) debugCidCursor(c echo.Context) error {
	ctx := context.Background()
	cidCursors := []cidCursor{}
	sql := `select * from cid_cursor order by host`
	err := pgxscan.Select(ctx, ss.pgPool, &cidCursors, sql)

	if err != nil {
		return c.JSON(400, map[string]string{
			"error": err.Error(),
		})
	}
	return c.JSON(200, cidCursors)
}
