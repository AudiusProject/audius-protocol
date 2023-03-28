package schema

import (
	"encoding/json"
	"time"
)

type RpcLog struct {
	ID                 string          `db:"id" json:"id"`
	JetstreamSequence  int32           `db:"jetstream_sequence" json:"jetstream_sequence"`
	JetstreamTimestamp time.Time       `db:"jetstream_timestamp" json:"jetstream_timestamp"`
	RelayedBy          string          `db:"relayed_by" json:"relayed_by"`
	FromWallet         string          `db:"from_wallet" json:"from_wallet"`
	Rpc                json.RawMessage `db:"rpc" json:"rpc"`
	Sig                string          `db:"sig" json:"sig"`
}
