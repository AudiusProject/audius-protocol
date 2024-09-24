package console

import (
	"encoding/json"
	"fmt"

	"github.com/labstack/echo/v4"
)

var cachedGenesis map[string]interface{}

func (cs *Console) genesisPage(c echo.Context) error {
	if cachedGenesis != nil {
		return cs.views.RenderGenesisView(c, cachedGenesis)
	}

	jsonData, err := json.Marshal(cs.config.GenesisFile)
	if err != nil {
		return fmt.Errorf("error marshalling to JSON: %v", err)
	}

	var result map[string]interface{}
	err = json.Unmarshal(jsonData, &result)
	if err != nil {
		return fmt.Errorf("error unmarshalling to map: %v", err)
	}
	cachedGenesis = result

	return cs.views.RenderGenesisView(c, result)
}
