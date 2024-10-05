package server

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
)

var gendoc interface{}

func (s *Server) getGenesisJSON(c echo.Context) error {
	if gendoc != nil {
		return c.JSON(http.StatusOK, gendoc)
	}

	genesisFilePath := s.cconfig.GenesisFile()

	genesisData, err := os.ReadFile(genesisFilePath)
	if err != nil {
		return err
	}

	var genesisJson interface{}
	if err := json.Unmarshal(genesisData, &genesisJson); err != nil {
		return err
	}

	// cache gendoc once computed
	gendoc = genesisJson

	return c.JSON(http.StatusOK, genesisJson)
}
