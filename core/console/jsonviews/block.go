package jsonviews

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/AudiusProject/audius-protocol/core/console/utils"
	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
	coretypes "github.com/cometbft/cometbft/rpc/core/types"
	"github.com/labstack/echo/v4"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

type BlockResponse struct {
	Hash      string                   `json:"block_hash"`
	Height    int64                    `json:"block_height"`
	Timestamp time.Time                `json:"block_time"`
	Txs       []map[string]interface{} `json:"transactions"`
}

// takes the comet type and renders it in a json view
func BlockPageJSON(c echo.Context, block *coretypes.ResultBlock) error {
	txs := block.Block.Txs

	jsonDataArray := [][]byte{}

	for _, tx := range txs {
		var transaction gen_proto.SignedTransaction
		err := proto.Unmarshal(tx, &transaction)
		if err != nil {
			return fmt.Errorf("could not marshal tx into signed tx: %v", err)
		}

		jsonData, err := protojson.Marshal(&transaction)
		if err != nil {
			return fmt.Errorf("could not marshal proto into json: %v", err)
		}
		jsonDataArray = append(jsonDataArray, jsonData)
	}

	var result []map[string]interface{}

	// Parse each byte array into a map and append to the result slice
	for _, jsonData := range jsonDataArray {
		var obj map[string]interface{}
		if err := json.Unmarshal(jsonData, &obj); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid json"})
		}
		result = append(result, obj)
	}

	resTxs := utils.CamelCaseKeys(result)

	data := &BlockResponse{
		Hash:      hex.EncodeToString(block.Block.Hash()),
		Height:    block.Block.Height,
		Timestamp: block.Block.Time,
		Txs:       resTxs,
	}

	return c.JSON(200, data)
}
