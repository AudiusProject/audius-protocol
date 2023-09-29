package server

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"mediorum/ethcontracts"
	"mediorum/server/signature"
	"strconv"
	"strings"
	"time"

	"github.com/gowebpki/jcs"
	"github.com/labstack/echo/v4"
)

type healthCheckResponse struct {
	Data      healthCheckResponseData `json:"data"`
	Signer    string                  `json:"signer"`
	Signature string                  `json:"signature"`
	Timestamp time.Time               `json:"timestamp"`
}
type healthCheckResponseData struct {
	Healthy                 bool                       `json:"healthy"`
	Version                 string                     `json:"version"`
	Service                 string                     `json:"service"` // used by registerWithDelegate()
	IsSeeding               bool                       `json:"isSeeding"`
	BuiltAt                 string                     `json:"builtAt"`
	StartedAt               time.Time                  `json:"startedAt"`
	SPID                    int                        `json:"spID"`
	SPOwnerWallet           string                     `json:"spOwnerWallet"`
	Git                     string                     `json:"git"`
	AudiusDockerCompose     string                     `json:"audiusDockerCompose"`
	MediorumPathUsed        uint64                     `json:"mediorumPathUsed"` // bytes
	MediorumPathSize        uint64                     `json:"mediorumPathSize"` // bytes
	DatabaseSize            uint64                     `json:"databaseSize"`     // bytes
	DbSizeErr               string                     `json:"dbSizeErr"`
	LastSuccessfulRepair    RepairTracker              `json:"lastSuccessfulRepair"`
	LastSuccessfulCleanup   RepairTracker              `json:"lastSuccessfulCleanup"`
	UploadsCount            int64                      `json:"uploadsCount"`
	UploadsCountErr         string                     `json:"uploadsCountErr"`
	AutoUpgradeEnabled      bool                       `json:"autoUpgradeEnabled"`
	TrustedNotifier         *ethcontracts.NotifierInfo `json:"trustedNotifier"`
	Env                     string                     `json:"env"`
	Self                    Peer                       `json:"self"`
	WalletIsRegistered      bool                       `json:"wallet_is_registered"`
	Signers                 []Peer                     `json:"signers"`
	ReplicationFactor       int                        `json:"replicationFactor"`
	Dir                     string                     `json:"dir"`
	BlobStorePrefix         string                     `json:"blobStorePrefix"`
	MoveFromBlobStorePrefix string                     `json:"moveFromBlobStorePrefix"`
	ListenPort              string                     `json:"listenPort"`
	TrustedNotifierID       int                        `json:"trustedNotifierId"`
	PeerHealths             map[string]*PeerHealth     `json:"peerHealths"`
	UnreachablePeers        []string                   `json:"unreachablePeers"`
	FailsPeerReachability   bool                       `json:"failsPeerReachability"`
	StoreAll                bool                       `json:"storeAll"`
}

func (ss *MediorumServer) serveHealthCheck(c echo.Context) error {
	healthy := ss.databaseSize > 0 && ss.dbSizeErr == "" && ss.uploadsCountErr == ""

	allowUnregistered, _ := strconv.ParseBool(c.QueryParam("allow_unregistered"))
	if !allowUnregistered && !ss.Config.WalletIsRegistered {
		healthy = false
	}

	blobStorePrefix, _, foundBlobStore := strings.Cut(ss.Config.BlobStoreDSN, "://")
	if !foundBlobStore {
		blobStorePrefix = ""
	}
	blobStoreMoveFromPrefix, _, foundBlobStoreMoveFrom := strings.Cut(ss.Config.MoveFromBlobStoreDSN, "://")
	if !foundBlobStoreMoveFrom {
		blobStoreMoveFromPrefix = ""
	}

	var err error
	// since we're using peerHealth
	ss.peerHealthsMutex.RLock()
	defer ss.peerHealthsMutex.RUnlock()

	data := healthCheckResponseData{
		Healthy:                 healthy,
		Version:                 ss.Config.VersionJson.Version,
		Service:                 ss.Config.VersionJson.Service,
		IsSeeding:               ss.isSeeding,
		BuiltAt:                 vcsBuildTime,
		StartedAt:               ss.StartedAt,
		SPID:                    ss.Config.SPID,
		SPOwnerWallet:           ss.Config.SPOwnerWallet,
		Git:                     ss.Config.GitSHA,
		AudiusDockerCompose:     ss.Config.AudiusDockerCompose,
		MediorumPathUsed:        ss.mediorumPathUsed,
		MediorumPathSize:        ss.mediorumPathSize,
		DatabaseSize:            ss.databaseSize,
		DbSizeErr:               ss.dbSizeErr,
		LastSuccessfulRepair:    ss.lastSuccessfulRepair,
		LastSuccessfulCleanup:   ss.lastSuccessfulCleanup,
		UploadsCount:            ss.uploadsCount,
		UploadsCountErr:         ss.uploadsCountErr,
		AutoUpgradeEnabled:      ss.Config.AutoUpgradeEnabled,
		TrustedNotifier:         ss.trustedNotifier,
		Dir:                     ss.Config.Dir,
		BlobStorePrefix:         blobStorePrefix,
		MoveFromBlobStorePrefix: blobStoreMoveFromPrefix,
		ListenPort:              ss.Config.ListenPort,
		ReplicationFactor:       ss.Config.ReplicationFactor,
		Env:                     ss.Config.Env,
		Self:                    ss.Config.Self,
		WalletIsRegistered:      ss.Config.WalletIsRegistered,
		TrustedNotifierID:       ss.Config.TrustedNotifierID,
		PeerHealths:             ss.peerHealths,
		UnreachablePeers:        ss.unreachablePeers,
		FailsPeerReachability:   ss.failsPeerReachability,
		Signers:                 ss.Config.Signers,
		StoreAll:                ss.Config.StoreAll,
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
		if !allowUnregistered && !ss.Config.WalletIsRegistered {
			status = 506
		} else {
			status = 503
		}
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
		allowUnhealthy, _ := strconv.ParseBool(c.QueryParam("allow_unhealthy"))
		if allowUnhealthy {
			return next(c)
		}

		if !ss.Config.WalletIsRegistered {
			return c.JSON(506, "wallet not registered")
		}
		dbHealthy := ss.databaseSize > 0 && ss.dbSizeErr == "" && ss.uploadsCountErr == ""
		if !dbHealthy {
			return c.JSON(503, "database not healthy")
		}

		return next(c)
	}
}
