package pubkeystore

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
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
			err = recoverFromPeers(config, id)
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

func recoverFromPeers(discoveryConfig *config.DiscoveryConfig, id int) error {
	idEncoded, err := misc.EncodeHashId(id)
	if err != nil {
		return err
	}
	for _, peer := range discoveryConfig.Peers() {
		if strings.EqualFold(peer.Wallet, discoveryConfig.MyWallet) {
			continue
		}

		host := strings.TrimRight(peer.Host, "/")
		if host == "" {
			continue
		}

		resp, err := http.Get(host + "/comms/pubkey/" + idEncoded + "/cached")
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			continue
		}

		var result struct {
			Data string `json:"data"`
		}
		err = json.NewDecoder(resp.Body).Decode(&result)
		if err != nil {
			slog.Debug("failed to decode response from peer", "peer", peer.Host, "err", err)
			continue
		}

		setPubkey(id, result.Data)
		return nil
	}

	return errors.New("failed")
}
