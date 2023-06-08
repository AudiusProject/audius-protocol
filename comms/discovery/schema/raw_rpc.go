package schema

import (
	"encoding/json"
)

// RawRPC matches (quicktype generated) RPC
// Except Params is a json.RawMessage instead of a quicktype approximation of a golang union type which sadly doesn't really exist.
// which is more generic + convienent to use in go code
// it should match the fields of RPC
type RawRPC struct {
	CurrentUserID string          `json:"current_user_id"`
	Method        string          `json:"method"`
	Params        json.RawMessage `json:"params"`
	Timestamp     int64           `json:"timestamp"`
}
