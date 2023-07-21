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
	BlobStoreDSN              string                     `json:"blobStoreDSN"`
	ListenPort                string                     `json:"listenPort"`
	UpstreamCN                string                     `json:"upstreamCN"`
	TrustedNotifierID         int                        `json:"trustedNotifierId"`
	CidCursors                []cidCursor                `json:"cidCursors"`
	PeerHealths               map[string]time.Time       `json:"peerHealths"`
	IsV2Only                  bool                       `json:"isV2Only"`
	StoreAll                  bool                       `json:"storeAll"`
}

type legacyHealth struct {
	Version                   string `json:"version"`
	Service                   string `json:"service"`
	SelectedDiscoveryProvider string `json:"selectedDiscoveryProvider"`
}

func (ss *MediorumServer) serveHealthCheck(c echo.Context) error {
	healthy := ss.databaseSize > 0

	// consider unhealthy when seeding only if we're not registered - otherwise we're just waiting to be registered so we can start seeding
	if ss.Config.WalletIsRegistered && (ss.isSeeding || ss.isSeedingLegacy) {
		healthy = false
	}

	var err error
	var version string
	var service string
	var selectedDiscoveryProvider string
	if ss.Config.IsV2Only {
		version = ss.Config.VersionJson.Version
		service = ss.Config.VersionJson.Service
		selectedDiscoveryProvider = "<none - v2 only>"
	} else {
		var legacyHealth legacyHealth
		legacyHealth, err = ss.fetchCreatorNodeHealth()
		if err == nil {
			version = legacyHealth.Version
			service = legacyHealth.Service
			selectedDiscoveryProvider = legacyHealth.SelectedDiscoveryProvider
		} else if ss.Config.Env == "stage" || ss.Config.Env == "prod" {
			// if we're in stage or prod, return healthy=false if we can't connect to the legacy CN
			healthy = false
		}
	}

	// since we're using peerHealth
	ss.peerHealthMutex.RLock()
	defer ss.peerHealthMutex.RUnlock()

	data := healthCheckResponseData{
		Healthy:                   healthy,
		Version:                   version,
		Service:                   service,
		IsSeeding:                 ss.isSeeding,
		IsSeedingLegacy:           ss.isSeedingLegacy,
		BuiltAt:                   vcsBuildTime,
		StartedAt:                 ss.StartedAt,
		SelectedDiscoveryProvider: selectedDiscoveryProvider,
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
		BlobStoreDSN:              ss.Config.BlobStoreDSN,
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
		IsV2Only:                  ss.Config.IsV2Only,
		StoreAll:                  ss.Config.StoreAll,
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
	if !healthy {
		status = 503
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
		dbHealthy := ss.databaseSize > 0
		if !dbHealthy {
			return c.JSON(503, "database not healthy")
		}

		// consider unhealthy when seeding only if we're not registered - otherwise we're just waiting to be registered so we can start seeding
		if ss.Config.WalletIsRegistered {
			if ss.isSeeding {
				return c.JSON(503, "seeding")
			}
			if ss.isSeedingLegacy {
				return c.JSON(503, "seeding legacy")
			}
		}

		return next(c)
	}
}
