package types

import "time"

type BlockPageData struct {
	Height    string
	Hash      string
	Proposer  string
	Timestamp time.Time
	Txs       [][]byte
}

type TransactionPageData struct {
	Height    string
	Hash      string
	Timestamp time.Time
}

type HomePageData struct {
	Blocks       []*BlockPageData
	Transactions []*TransactionPageData
}
