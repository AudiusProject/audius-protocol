package pubkeystore

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/exp/slog"
)

func StartPubkeyBackfill(config *config.DiscoveryConfig) {

	sql := `
	select user_id
	from users
	where not exists (select 1 from user_pubkeys p where users.user_id = p.user_id);
	`

	for {
		// space it out a bit
		time.Sleep(time.Minute * 2)

		ids := []int{}
		err := db.Conn.Select(&ids, sql)
		if err != nil {
			slog.Info("pubkey backfill: query error", err)
			break
		}
		for _, id := range ids {
			_, err = RecoverFromPeers(config, id)
			if err != nil {
				slog.Info("pubkey backfill: peer recovery failed", "user_id", id, "err", err)
			}
		}

		time.Sleep(time.Minute * 8)

	}

}

func GetPubkey(userId int) (string, error) {
	var pk string
	err := db.Conn.Get(&pk, `select pubkey_base64 from user_pubkeys where user_id = $1`, userId)
	return pk, err
}

func setPubkey(userId int, pubkeyBase64 string) error {
	_, err := db.Conn.Exec(`insert into user_pubkeys values ($1, $2) on conflict do nothing`, userId, pubkeyBase64)
	return err
}

func SetPubkeyForWallet(wallet string, pubkey *ecdsa.PublicKey) error {
	var userId int
	err := db.Conn.Get(&userId, `select user_id from users where wallet = lower($1)`, wallet)
	if err != nil {
		slog.Info("failed to find user for wallet", "wallet", wallet)
		return err
	}
	if userId == 0 {
		slog.Info("failed to find user for wallet", "wallet", wallet)
		return errors.New("failed to find user_id for wallet")
	}

	pubkeyBytes := crypto.FromECDSAPub(pubkey)
	pubkeyBase64 := base64.StdEncoding.EncodeToString(pubkeyBytes)
	return setPubkey(userId, pubkeyBase64)
}

var lastHost = ""

func RecoverFromPeers(discoveryConfig *config.DiscoveryConfig, id int) (string, error) {

	// first try lastHost to reduce searching
	if lastHost != "" {
		pk, err := recoverFromPeer(lastHost, id)
		if err == nil {
			return pk, nil
		}
	}

	for _, peer := range discoveryConfig.Peers() {
		if strings.EqualFold(peer.Wallet, discoveryConfig.MyWallet) {
			continue
		}

		pk, err := recoverFromPeer(peer.Host, id)
		if err == nil {
			lastHost = peer.Host
			return pk, nil
		}
	}

	return "", errors.New("failed")
}

func recoverFromPeer(host string, id int) (string, error) {
	idEncoded, err := misc.EncodeHashId(id)
	if err != nil {
		return "", err
	}

	host = strings.TrimRight(host, "/")
	if host == "" {
		return "", errors.New("invalid host")
	}

	resp, err := http.Get(host + "/comms/pubkey/" + idEncoded + "/cached")
	if err != nil {
		return "", errors.New("get failed")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", errors.New("get failed")
	}

	var result struct {
		Data string `json:"data"`
	}
	err = json.NewDecoder(resp.Body).Decode(&result)
	if err != nil {
		slog.Info("failed to decode response from peer", "peer", host, "err", err)
		return "", err
	}

	err = setPubkey(id, result.Data)
	if err != nil {
		return "", err
	}

	return result.Data, nil
}
