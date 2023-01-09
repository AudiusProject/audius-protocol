package schema

import (
	"encoding/json"
)

type RawRPC struct {
	ID     string
	Method string
	Params json.RawMessage
}
