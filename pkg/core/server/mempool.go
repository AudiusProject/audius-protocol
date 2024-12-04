package server

import (
	"encoding/json"
	"fmt"

	"github.com/labstack/echo/v4"
	"google.golang.org/protobuf/encoding/protojson"
)

func (s *Server) getMempl(c echo.Context) error {
	txs := s.mempl.GetAll()

	jsontxs := [][]byte{}
	for _, tx := range txs {
		jsonData, err := protojson.Marshal(tx)
		if err != nil {
			return fmt.Errorf("could not marshal proto into json: %v", err)
		}
		jsontxs = append(jsontxs, jsonData)
	}

	result := []map[string]interface{}{}
	for _, jsonData := range jsontxs {
		var obj map[string]interface{}
		if err := json.Unmarshal(jsonData, &obj); err != nil {
			return fmt.Errorf("invalid json")
		}
		result = append(result, obj)
	}

	return c.JSONPretty(200, result, "  ")
}
