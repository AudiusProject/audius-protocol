package em

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"strings"
	"testing"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/stretchr/testify/assert"
)

func TestEmChain(t *testing.T) {
	t.Skip()

	config.IsStaging = true // dagron

	db.Dial()

	cf, err := NewCidFetcher()
	assert.NoError(t, err)

	var relayEndpoint = "https://nethermind.staging.audius.co/"
	var emContractAddress = "0x1Cd8a543596D499B9b6E7a6eC15ECd2B7857Fd64"

	client, err := ethclient.Dial(relayEndpoint)
	if err != nil {
		log.Fatal(err)
	}

	query := ethereum.FilterQuery{
		FromBlock: big.NewInt(1000),
		ToBlock:   big.NewInt(500_000),
		Addresses: []common.Address{
			common.HexToAddress(emContractAddress),
		},
	}

	log.Println("querying")
	logs, err := client.FilterLogs(context.Background(), query)
	if err != nil {
		log.Fatal(err)
	}

	for _, txlog := range logs {

		ev, err := emAbi.EventByID(txlog.Topics[0])
		if err != nil {
			log.Fatal("EventByID failed:", err)
		}

		params := map[string]interface{}{}
		err = ev.Inputs.UnpackIntoMap(params, txlog.Data)
		if err != nil {
			log.Fatal("UnpackIntoMap failed:", err)
		}

		// fmt.Println(" \t", ev.Name, params)
		if ev.Name != "ManageEntity" {
			fmt.Println("skipping", ev.Name, params)
			continue
		}

		action := &EntityManagerAction{
			UserID:     params["_userId"].(*big.Int).Int64(),
			Action:     params["_action"].(string),
			EntityType: params["_entityType"].(string),
			EntityID:   params["_entityId"].(*big.Int).Int64(),
			Metadata:   params["_metadata"].(string),
			Signer:     params["_signer"].(common.Address).String(),

			blockNumber: int(txlog.BlockNumber),
			blockhash:   txlog.BlockHash.String(),
			txHash:      txlog.TxHash.String(),
			txIndex:     int(txlog.TxIndex),
		}

		if action.EntityType == "UserReplicaSet" {
			continue
		}

		// annoying: you have to get the block to get the timestamp
		// todo: collect into batches to batch fetch:
		//    block, metadata cid, user + entity rows

		// block, err := client.BlockByHash(context.Background(), txlog.BlockHash)
		// assert.NoError(t, err)
		// ts := time.Unix(int64(block.Time()), 0)
		// action.Timestamp = ts

		// then just a matter of
		// validate params
		// do db updates
		// some challenge bus stuff?

		if action.Metadata != "" && strings.HasPrefix(action.Metadata, "Qm") {
			j, err := cf.Fetch(action.UserID, action.Metadata)
			if err != nil {
				config.Logger.Warn(err.Error())
			} else {
				action.MetadataJSON = j
			}
		}

		processEntityManagerAction(action)

	}
}
