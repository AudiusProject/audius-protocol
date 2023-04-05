package schema

import (
	"encoding/json"
	"time"
)

type RpcLog struct {
	ID         string          `db:"id" json:"id"`
	RelayedAt  time.Time       `db:"relayed_at" json:"relayed_at"`
	AppliedAt  time.Time       `db:"applied_at" json:"applied_at"`
	RelayedBy  string          `db:"relayed_by" json:"relayed_by"`
	FromWallet string          `db:"from_wallet" json:"from_wallet"`
	Rpc        json.RawMessage `db:"rpc" json:"rpc"`
	Sig        string          `db:"sig" json:"sig"`
}
