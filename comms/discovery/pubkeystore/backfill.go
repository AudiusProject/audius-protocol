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
	"github.com/AudiusProject/audiusd/pkg/core/gen/core_proto"
	"github.com/ethereum/go-ethereum/crypto"
	"golang.org/x/exp/slog"
	"google.golang.org/protobuf/proto"
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

		// visit core_transactions table
		err := recoverPubkeysFromCoreTransactions()
		if err != nil {
			slog.Info("pubkey backfill: recoverPubkeysFromCoreTransactions failed", "err", err)
		}

		// fetch missing from peers
		ids := []int{}
		err = db.Conn.Select(&ids, sql)
		if err != nil {
			slog.Info("pubkey backfill: query error", "err", err)
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

func recoverPubkeysFromCoreTransactions() error {
	checkpointName := "user_pubkeys_core_transactions"
	startBlock := 0
	db.Conn.Get(&startBlock, "select last_checkpoint from indexing_checkpoints where tablename = $1", checkpointName)

	var txs []CoreTransaction
	err := db.Conn.Select(&txs, "SELECT block_id, tx_hash, transaction FROM core_transactions WHERE block_id > $1 ORDER BY block_id asc limit 10000", startBlock)
	if err != nil {
		return err
	}

	slog.Info("starting pubkey recover from core_transaction", "block", startBlock, "size", len(txs))

	worked := 0
	for _, ct := range txs {
		startBlock = ct.BlockID

		var signedTx core_proto.SignedTransaction
		if err := proto.Unmarshal(ct.Transaction, &signedTx); err != nil {
			slog.Info("proto unmarshal failed", "err", err)
			continue
		}

		switch signedTx.GetTransaction().(type) {
		case *core_proto.SignedTransaction_ManageEntity:
			em := signedTx.GetManageEntity()
			wallet, pubkey, err := recoverPubkeyFromCoreTx(em)
			if err != nil {
				slog.Info("failed to recover pubkey", "err", err, "block_id", ct.BlockID, "tx_hash", ct.TxHash)
				continue
			}

			err = SetPubkeyForWallet(wallet, pubkey)
			if err != nil {
				slog.Info("SetPubkeyForWallet failed", "signer", em.Signer, "err", err)
				continue
			}
			worked++
		default:
		}

	}

	slog.Info("Updating checkpoint", "name", checkpointName, "checkpoint", startBlock, "tried", len(txs), "ok", worked)

	_, err = db.Conn.Exec(`
		insert into indexing_checkpoints values ($1, $2)
		on conflict (tablename) do update set last_checkpoint = excluded.last_checkpoint
		`,
		checkpointName, startBlock)

	return err
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
		return errors.New("failed to find user_id for wallet: " + wallet)
	}
	if userId == 0 {
		return errors.New("failed to find user_id for wallet: " + wallet)
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
