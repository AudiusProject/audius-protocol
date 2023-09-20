package server

import (
	"encoding/json"
	"mediorum/ethcontracts"
	"reflect"
	"testing"
	"time"

	"github.com/gowebpki/jcs"
)

func TestHealthCheck(t *testing.T) {
	time, _ := time.Parse(time.RFC3339, "2023-06-07T08:25:30Z")
	data := healthCheckResponseData{
		Healthy:              true,
		Version:              "1.0.0",
		Service:              "content-node",
		SPID:                 1,
		SPOwnerWallet:        "0xtest1",
		Git:                  "123456",
		AudiusDockerCompose:  "123456",
		StoragePathUsed:      99999,
		StoragePathSize:      999999999,
		MediorumPathUsed:     88888,
		MediorumPathSize:     888888888,
		DatabaseSize:         99999,
		LastSuccessfulRepair: RepairTracker{ContentSize: 777777},
		AutoUpgradeEnabled:   true,

		StartedAt:         time,
		TrustedNotifier:   &ethcontracts.NotifierInfo{Wallet: "0xnotifier", Endpoint: "http://notifier.com", Email: "dmca@notifier.com"},
		Env:               "DEV",
		Self:              Peer{Host: "test1.com", Wallet: "0xtest1"},
		Signers:           []Peer{{Host: "test2.com", Wallet: "0xtest2"}},
		ReplicationFactor: 3,
		Dir:               "/dir",
		BlobStorePrefix:   "file",
		ListenPort:        "1991",
		TrustedNotifierID: 1,
	}

	expected := `{"audiusDockerCompose":"123456","autoUpgradeEnabled":true,"blobStorePrefix":"file","builtAt":"","databaseSize":99999,"dbSizeErr":"","dir":"/dir","env":"DEV","git":"123456","healthy":true,"isSeeding":false,"lastSuccessfulRepair":{"AbortedReason":"","CleanupMode":false,"ContentSize":777777,"Counters":null,"CursorI":0,"CursorQmCID":"","CursorUploadID":"","Duration":0,"FinishedAt":"0001-01-01T00:00:00Z","StartedAt":"0001-01-01T00:00:00Z","UpdatedAt":"0001-01-01T00:00:00Z"},"legacyDirUsed":0,"listenPort":"1991","mediorumDirUsed":0,"mediorumPathSize":888888888,"mediorumPathUsed":88888,"moveFromBlobStorePrefix":"","peerHealths":null,"replicationFactor":3,"self":{"host":"test1.com","wallet":"0xtest1"},"service":"content-node","signers":[{"host":"test2.com","wallet":"0xtest2"}],"spID":1,"spOwnerWallet":"0xtest1","startedAt":"2023-06-07T08:25:30Z","storagePathSize":999999999,"storagePathUsed":99999,"storeAll":false,"trustedNotifier":{"email":"dmca@notifier.com","endpoint":"http://notifier.com","wallet":"0xnotifier"},"trustedNotifierId":1,"unreachablePeers":null,"uploadsCount":0,"uploadsCountErr":"","version":"1.0.0","wallet_is_registered":false}`
	dataBytes, err := json.Marshal(data)
	if err != nil {
		t.Error(err)
	}
	dataBytesSorted, err := jcs.Transform(dataBytes)
	if err != nil {
		t.Error(err)
	}

	if !reflect.DeepEqual(expected, string(dataBytesSorted)) {
		t.Errorf("expected %v, got %v", expected, string(dataBytesSorted))
	}
}
