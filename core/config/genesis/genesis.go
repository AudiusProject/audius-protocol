package genesis

import (
	"embed"
	"fmt"

	"github.com/cometbft/cometbft/types"
)

//go:embed sandbox.json
var sandboxGenesis embed.FS

//go:embed dev.json
var devGenesis embed.FS

//go:embed stage.json
var stageGenesis embed.FS

//go:embed prod.json
var prodGenesis embed.FS

func Read(environment string) (*types.GenesisDoc, error) {
	switch environment {
	case "prod", "production", "mainnet":
		data, err := prodGenesis.ReadFile("prod.json")
		if err != nil {
			return nil, fmt.Errorf("failed to read embedded file: %v", err)
		}
		genDoc, err := types.GenesisDocFromJSON(data)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal prod.json into genesis: %v", err)
		}
		return genDoc, nil
	case "stage", "staging", "testnet":
		data, err := stageGenesis.ReadFile("stage.json")
		if err != nil {
			return nil, fmt.Errorf("failed to read embedded file: %v", err)
		}
		genDoc, err := types.GenesisDocFromJSON(data)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal stage.json into genesis: %v", err)
		}
		return genDoc, nil
	case "sandbox":
		data, err := sandboxGenesis.ReadFile("sandbox.json")
		if err != nil {
			return nil, fmt.Errorf("failed to read embedded file: %v", err)
		}
		genDoc, err := types.GenesisDocFromJSON(data)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal stage.json into genesis: %v", err)
		}
		return genDoc, nil
	default:
		data, err := devGenesis.ReadFile("dev.json")
		if err != nil {
			return nil, fmt.Errorf("failed to read embedded file: %v", err)
		}
		genDoc, err := types.GenesisDocFromJSON(data)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal dev.json into genesis: %v", err)
		}
		return genDoc, nil
	}
}
