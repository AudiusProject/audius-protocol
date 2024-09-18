package types

type BlockPageData struct {
	Height   string
	Hash     string
	Proposer string
	Txs      [][]byte
}
