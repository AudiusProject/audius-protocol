package server

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"mediorum/ethcontracts"
	"mediorum/server/signature"
	"net/http"
	"net/url"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/gowebpki/jcs"
	"github.com/labstack/echo/v4"
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
	Healthy                   bool        `json:"healthy"`
	Version                   string      `json:"version"`
	Service                   string      `json:"service"` // used by registerWithDelegate()
	SPID                      int         `json:"spID"`
	SPOwnerWallet             string      `json:"spOwnerWallet"`
	Git                       string      `json:"git"`
	AudiusDockerCompose       string      `json:"audiusDockerCompose"`
	StoragePathUsed           uint64      `json:"storagePathUsed"` // bytes
	StoragePathSize           uint64      `json:"storagePathSize"` // bytes
	DatabaseSize              uint64      `json:"databaseSize"`    // bytes
	AutoUpgradeEnabled        bool        `json:"autoUpgradeEnabled"`
	SelectedDiscoveryProvider string      `json:"selectedDiscoveryProvider"`
	CidCursors                []cidCursor `json:"cidCursors"`

	StartedAt         time.Time                  `json:"startedAt"`
	TrustedNotifier   *ethcontracts.NotifierInfo `json:"trustedNotifier"`
	Env               string                     `json:"env"`
	Self              Peer                       `json:"self"`
	Peers             []Peer                     `json:"peers"`
	PeerHealths       map[string]time.Time       `json:"peerHealths"`
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
		Signers:                   ss.Config.Signers,
		ReplicationFactor:         ss.Config.ReplicationFactor,
		Env:                       ss.Config.Env,
		Self:                      ss.Config.Self,
	}

	// peer healths
	ss.peerHealthMutex.RLock()
	data.PeerHealths = ss.peerHealth
	ss.peerHealthMutex.RUnlock()

	// cursor statuses
	cidCursors := []cidCursor{}
	if err := pgxscan.Select(c.Request().Context(), ss.pgPool, &cidCursors, `select * from cid_cursor order by host`); err == nil {
		data.CidCursors = cidCursors
	}

	// problem blob count
	// this might be too expensive for health_check?
	// problemBlobCount, _ := ss.findProblemBlobsCount(false)
	// data.ProblemBlobs = problemBlobCount

	dataBytes, err := json.Marshal(data)
	if err != nil {
		return c.JSON(500, map[string]string{"error": "Failed to marshal health check data: " + err.Error()})
	}
	dataBytesSorted, err := jcs.Transform(dataBytes)
	if err != nil {
		return c.JSON(500, map[string]string{"error": "Failed to sort health check data: " + err.Error()})
	}
	signature, err := signature.SignBytes(dataBytesSorted, ss.Config.privateKey)
	if err != nil {
		return c.JSON(500, map[string]string{"error": "Failed to sign health check response: " + err.Error()})
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
	healthyPeers := ss.findHealthyPeers(2 * time.Minute)
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
