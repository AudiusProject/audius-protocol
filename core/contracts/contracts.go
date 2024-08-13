//go:generate go run ../scripts/generate_contracts/main.go
//go:generate go run ../scripts/generate_options/main.go Contracts contract_options.go

package contracts

type Contracts struct {
	AcdcRPC string
	EthRPC  string
}

func defaultContracts() *Contracts {
	return &Contracts{}
}

func initContracts(*Contracts) error {
	return nil
}
