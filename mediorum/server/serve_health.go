package server

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"mediorum/ethcontracts"
	"mediorum/server/signature"
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
	TrustedNotifierID         int                        `json:"trustedNotifierId"`
	CidCursors                []cidCursor                `json:"cidCursors"`
	PeerHealths               map[string]time.Time       `json:"peerHealths"`
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
	// since we're using peerHealth
	ss.peerHealthMutex.RLock()
	defer ss.peerHealthMutex.RUnlock()

	data := healthCheckResponseData{
		Healthy:                   healthy,
		Version:                   ss.Config.VersionJson.Version,
		Service:                   ss.Config.VersionJson.Service,
		IsSeeding:                 ss.isSeeding,
		IsSeedingLegacy:           ss.isSeedingLegacy,
		BuiltAt:                   vcsBuildTime,
		StartedAt:                 ss.StartedAt,
		SelectedDiscoveryProvider: "<none - v2 only>",
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
		ReplicationFactor:         ss.Config.ReplicationFactor,
		Env:                       ss.Config.Env,
		Self:                      ss.Config.Self,
		WalletIsRegistered:        ss.Config.WalletIsRegistered,
		TrustedNotifierID:         ss.Config.TrustedNotifierID,
		CidCursors:                ss.cachedCidCursors,
		PeerHealths:               ss.peerHealth,
		Signers:                   ss.Config.Signers,
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
	signatureHex := "private key not set (should only happen on local dev)!"
	if ss.Config.privateKey != nil {
		signature, err := signature.SignBytes(dataBytesSorted, ss.Config.privateKey)
		if err != nil {
			return c.JSON(500, map[string]string{"error": "Failed to sign health check response: " + err.Error()})
		}
		signatureHex = fmt.Sprintf("0x%s", hex.EncodeToString(signature))
	}

	status := 200
	if !healthy {
		status = 503
	}

	return c.JSON(status, healthCheckResponse{
		Data:      data,
		Signer:    ss.Config.Self.Wallet,
		Signature: signatureHex,
		Timestamp: time.Now(),
	})
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
