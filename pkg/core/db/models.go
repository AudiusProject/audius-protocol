// Code generated by sqlc. DO NOT EDIT.
// versions:
//   sqlc v1.27.0

package db

import (
	"github.com/jackc/pgx/v5/pgtype"
)

type BlockEvent struct {
	BlockID      int64
	Height       int64
	ChainID      string
	Type         string
	Key          pgtype.Text
	CompositeKey pgtype.Text
	Value        pgtype.Text
}

type CoreAppState struct {
	BlockHeight int64
	AppHash     []byte
	CreatedAt   pgtype.Timestamp
}

type CoreAttribute struct {
	EventID      int64
	Key          string
	CompositeKey string
	Value        pgtype.Text
}

type CoreBlock struct {
	Rowid     int64
	Height    int64
	ChainID   string
	CreatedAt pgtype.Timestamptz
}

type CoreEvent struct {
	Rowid   int64
	BlockID int64
	TxID    pgtype.Int8
	Type    string
}

type CoreTxResult struct {
	Rowid     int64
	BlockID   int64
	Index     int32
	CreatedAt pgtype.Timestamptz
	TxHash    string
	TxResult  []byte
}

type CoreTxStat struct {
	ID          int32
	TxType      string
	TxHash      string
	BlockHeight int64
	CreatedAt   pgtype.Timestamp
}

type CoreValidator struct {
	Rowid        int32
	PubKey       string
	Endpoint     string
	EthAddress   string
	CometAddress string
	EthBlock     string
	NodeType     string
	SpID         string
}

type EventAttribute struct {
	BlockID      int64
	TxID         pgtype.Int8
	Type         string
	Key          pgtype.Text
	CompositeKey pgtype.Text
	Value        pgtype.Text
}

type SlaNodeReport struct {
	ID             int32
	Address        string
	BlocksProposed int32
	SlaRollupID    pgtype.Int4
}

type SlaRollup struct {
	ID         int32
	TxHash     string
	BlockStart int64
	BlockEnd   int64
	Time       pgtype.Timestamp
}

type TxEvent struct {
	Height       int64
	Index        int32
	ChainID      string
	Type         string
	Key          pgtype.Text
	CompositeKey pgtype.Text
	Value        pgtype.Text
	CreatedAt    pgtype.Timestamptz
}
