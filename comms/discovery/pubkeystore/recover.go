package pubkeystore

import (
	"context"
	"errors"
	"fmt"
	"math/big"
	"strings"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/ethereum/go-ethereum/signer/core/apitypes"
	"github.com/nats-io/nats.go"
)

var (
	jsc       nats.JetStreamContext
	poaClient *ethclient.Client

	// on staging, and soon prod
	// we will need two clients:
	// a POA client for older users
	// an audius chain client for newer users
	finalPoaBlock     int64 = 0
	audiusChainClient *ethclient.Client
)

func Dial(jetstreamContext nats.JetStreamContext) error {
	var err error

	jsc = jetstreamContext

	endpoint := "https://poa-gateway.audius.co"

	if config.IsStaging {
		endpoint = "https://legacy-poa-gateway.staging.audius.co"

		// should get dynamically from
		// https://identityservice.staging.audius.co/health_check/poa
		finalPoaBlock = 30000000

		audiusChainClient, err = ethclient.Dial("https://poa-gateway.staging.audius.co")
		if err != nil {
			return err
		}
	}

	poaClient, err = ethclient.Dial(endpoint)
	return err
}

func RecoverUserPublicKeyBase64(ctx context.Context, userId int) (string, error) {
	var err error

	logger := config.Logger.New("module", "pubkeystore", "userId", userId)

	conn := db.Conn

	kv, err := jsc.KeyValue(config.PubkeystoreBucketName)
	if err != nil {
		return "", err
	}

	key := fmt.Sprintf("userId=%d", userId)

	// first check a "pubkey cache" for a hit
	// see: https://github.com/AudiusProject/audius-docker-compose/blob/nats/discovery-provider/clusterizer/src/recover.ts#L65
	if got, err := kv.Get(key); err == nil {
		logger.Debug("pubkey cache hit")
		return string(got.Value()), nil
	}

	query := `
	select wallet, blocknumber, txhash
	from users where user_id = $1 and is_current in (true, false) 
	order by blocknumber asc;
	`

	rows, err := conn.QueryContext(ctx, query, userId)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	var wallet string
	var blocknumber int64
	var txhash string

	var pubkeyBase64 string

	for rows.Next() {
		err = rows.Scan(&wallet, &blocknumber, &txhash)
		if err != nil {
			continue
		}

		// a couple possible situations:
		// - addUser on POA
		// - entity manager on POA
		// - entity manager on audius chain

		if finalPoaBlock != 0 && blocknumber > finalPoaBlock {
			// EM on Audius Chain
			pubkeyBase64, err = recoverEntityManagerPubkey(audiusChainClient, txhash, wallet)
			if err == nil {
				break
			}
		} else {
			// try EM on POA
			if strings.HasPrefix(txhash, "0x") {
				pubkeyBase64, err = recoverEntityManagerPubkey(poaClient, txhash, wallet)
				if err == nil {
					break
				}
			}

			// try addUser on POA
			pubkeyBase64, err = findAddUserTransaction(ctx, big.NewInt(blocknumber))
			if err == nil {
				break
			}
		}

	}

	// success
	if err == nil && pubkeyBase64 != "" {
		_, err = kv.PutString(key, pubkeyBase64)
		if err != nil {
			logger.Warn("kv set failed", "err", err)
		}

		logger.Debug("recovered pubkey OK")
		return pubkeyBase64, nil
	}

	logger.Warn("failed to recover pubkey for user", "err", err)
	return "", errors.New("could not recover pubkey")
}

func unpackTransactionInput(txData []byte) (map[string]interface{}, error) {
	method, err := addUserAbi.MethodById(txData)
	if err != nil {
		return nil, err
	}

	m := map[string]interface{}{}
	err = method.Inputs.UnpackIntoMap(m, txData[4:])
	if err != nil {
		return nil, err
	}

	return m, nil
}

// taken from:
// https://gist.github.com/APTy/f2a6864a97889793c587635b562c7d72#file-main-go
func recoverPublicKey(signature []byte, typedData apitypes.TypedData) ([]byte, error) {

	domainSeparator, err := typedData.HashStruct("EIP712Domain", typedData.Domain.Map())
	if err != nil {
		return nil, fmt.Errorf("eip712domain hash struct: %w", err)
	}

	typedDataHash, err := typedData.HashStruct(typedData.PrimaryType, typedData.Message)
	if err != nil {
		return nil, fmt.Errorf("primary type hash struct: %w", err)
	}

	// add magic string prefix
	rawData := []byte(fmt.Sprintf("\x19\x01%s%s", string(domainSeparator), string(typedDataHash)))
	sighash := crypto.Keccak256(rawData)

	// update the recovery id
	// https://github.com/ethereum/go-ethereum/blob/55599ee95d4151a2502465e0afc7c47bd1acba77/internal/ethapi/api.go#L442
	signature[64] -= 27

	return crypto.Ecrecover(sighash, signature)

}
