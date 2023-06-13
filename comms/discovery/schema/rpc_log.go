package schema

import (
	"encoding/json"
	"time"
)

// RpcLog is passed around between servers
// It has the rpc and sig (from header)
// The relay server that receives the RPC will stamp it with relayed_by and relayed_at
// relayed_by and relayed_at are used so that peer servers can consume a http-feeds style event feed
// from every peer
type RpcLog struct {
	ID         string          `db:"id" json:"id"`
	RelayedAt  time.Time       `db:"relayed_at" json:"relayed_at"`
	AppliedAt  time.Time       `db:"applied_at" json:"applied_at"`
	RelayedBy  string          `db:"relayed_by" json:"relayed_by"`
	FromWallet string          `db:"from_wallet" json:"from_wallet"`
	Rpc        json.RawMessage `db:"rpc" json:"rpc"`
	Sig        string          `db:"sig" json:"sig"`
}
