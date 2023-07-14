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
	Healthy                   bool                       `json:"healthy"`
	Version                   string                     `json:"version"`
	Service                   string                     `json:"service"` // used by registerWithDelegate()
	IsSeeding                 bool                       `json:"isSeeding"`
	IsSeedingLegacy           bool                       `json:"isSeedingLegacy"`
	BuiltAt                   string                     `json:"builtAt"`
	StartedAt                 time.Time                  `json:"startedAt"`
	SPID                      int                        `json:"spID"`
	SPOwnerWallet             string                     `json:"spOwnerWallet"`
	Git                       string                     `json:"git"`
	AudiusDockerCompose       string                     `json:"audiusDockerCompose"`
	StoragePathUsed           uint64                     `json:"storagePathUsed"` // bytes
	StoragePathSize           uint64                     `json:"storagePathSize"` // bytes
	DatabaseSize              uint64                     `json:"databaseSize"`    // bytes
	AutoUpgradeEnabled        bool                       `json:"autoUpgradeEnabled"`
	SelectedDiscoveryProvider string                     `json:"selectedDiscoveryProvider"`
	TrustedNotifier           *ethcontracts.NotifierInfo `json:"trustedNotifier"`
	Env                       string                     `json:"env"`
	Self                      Peer                       `json:"self"`
	WalletIsRegistered        bool                       `json:"wallet_is_registered"`
	Signers                   []Peer                     `json:"signers"`
	ReplicationFactor         int                        `json:"replicationFactor"`
	Dir                       string                     `json:"dir"`
	ListenPort                string                     `json:"listenPort"`
	UpstreamCN                string                     `json:"upstreamCN"`
	TrustedNotifierID         int                        `json:"trustedNotifierId"`
	CidCursors                []cidCursor                `json:"cidCursors"`
	PeerHealths               map[string]time.Time       `json:"peerHealths"`
}

type legacyHealth struct {
	Version                   string `json:"version"`
	Service                   string `json:"service"`
	SelectedDiscoveryProvider string `json:"selectedDiscoveryProvider"`
}

func (ss *MediorumServer) serveHealthCheck(c echo.Context) error {
	healthy := ss.databaseSize > 0 && !ss.isSeeding && !ss.isSeedingLegacy

	// if we're in stage or prod, return healthy=false if we can't connect to the legacy CN
	legacyHealth, err := ss.fetchCreatorNodeHealth()
	if ss.Config.Env == "stage" || ss.Config.Env == "prod" {
		if err != nil {
			healthy = false
		}
	}

	// since we're using peerHealth
	ss.peerHealthMutex.RLock()
	defer ss.peerHealthMutex.RUnlock()

	data := healthCheckResponseData{
		Healthy:                   healthy,
		Version:                   legacyHealth.Version,
		Service:                   legacyHealth.Service,
		IsSeeding:                 ss.isSeeding,
		IsSeedingLegacy:           ss.isSeedingLegacy,
		BuiltAt:                   vcsBuildTime,
		StartedAt:                 ss.StartedAt,
		SelectedDiscoveryProvider: legacyHealth.SelectedDiscoveryProvider,
		SPID:                      ss.Config.SPID,
		SPOwnerWallet:             ss.Config.SPOwnerWallet,
		Git:                       ss.Config.GitSHA,
		AudiusDockerCompose:       ss.Config.AudiusDockerCompose,
		StoragePathUsed:           ss.storagePathUsed,
		StoragePathSize:           ss.storagePathSize,
		DatabaseSize:              ss.databaseSize,
		AutoUpgradeEnabled:        ss.Config.AutoUpgradeEnabled,
		TrustedNotifier:           ss.trustedNotifier,
		Dir:                       ss.Config.Dir,
		ListenPort:                ss.Config.ListenPort,
		UpstreamCN:                ss.Config.UpstreamCN,
		ReplicationFactor:         ss.Config.ReplicationFactor,
		Env:                       ss.Config.Env,
		Self:                      ss.Config.Self,
		WalletIsRegistered:        ss.Config.WalletIsRegistered,
		TrustedNotifierID:         ss.Config.TrustedNotifierID,
		CidCursors:                ss.cachedCidCursors,
		PeerHealths:               ss.peerHealth,
		Signers:                   ss.Config.Signers,
	}

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

	status := 200
	if !ss.Config.WalletIsRegistered {
		status = 506
	} else if !healthy {
		if ss.isSeeding {
			status = 503
		} else {
			status = 500
		}
	}

	signatureHex := fmt.Sprintf("0x%s", hex.EncodeToString(signature))
	return c.JSON(status, healthCheckResponse{
		Data:      data,
		Signer:    ss.Config.Self.Wallet,
		Signature: signatureHex,
		Timestamp: time.Now(),
	})
}

func (ss *MediorumServer) fetchCreatorNodeHealth() (legacyHealth, error) {
	legacyHealth := legacyHealth{}
	upstream, err := url.Parse(ss.Config.UpstreamCN)
	if err != nil {
		return legacyHealth, err
	}

	httpClient := http.Client{
		Timeout: time.Second,
	}

	req, err := http.NewRequest("GET", upstream.JoinPath("/health_check").String(), nil)
	if err != nil {
		return legacyHealth, err
	}
	req.Header.Set("User-Agent", "mediorum "+ss.Config.Self.Host)
	resp, err := httpClient.Do(req)
	if err != nil {
		return legacyHealth, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return legacyHealth, err
	}

	err = json.Unmarshal(body, &legacyHealth)
	return legacyHealth, err
}

func (ss *MediorumServer) requireHealthy(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		if !ss.Config.WalletIsRegistered {
			return c.JSON(506, "wallet not registered")
		}
		dbHealthy := ss.databaseSize > 0
		if !dbHealthy {
			return c.JSON(500, "database not healthy")
		}
		if ss.isSeeding {
			return c.JSON(503, "seeding")
		}
		if ss.isSeedingLegacy {
			return c.JSON(503, "seeding legacy")
		}

		return next(c)
	}
}
