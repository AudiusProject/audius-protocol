package jsonviews

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/AudiusProject/audius-protocol/core/console/pages"
	gen_proto "github.com/AudiusProject/audius-protocol/core/gen/proto"
	"github.com/labstack/echo/v4"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

type BlockPageResponse struct {
	Height   string                   `json:"block_height"`
	Hash     string                   `json:"block_hash"`
	Proposer string                   `json:"proposer"`
	Txs      []map[string]interface{} `json:"transactions"`
}

func BlockPage(c echo.Context, data pages.BlockPageData) error {
	txs := data.Txs

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

	resTxs := CamelCaseKeys(result)

	return c.JSON(200, BlockPageResponse{
		Height:   data.Height,
		Hash:     data.Hash,
		Proposer: data.Proposer,
		Txs:      resTxs,
	})
}
