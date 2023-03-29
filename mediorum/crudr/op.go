package crudr

import (
	"encoding/json"
	"fmt"
)

type Op struct {
	ULID   string          `json:"ulid" gorm:"column:ulid;primaryKey"`
	Host   string          `json:"host"`
	Action string          `json:"action"` // create, update, delete
	Table  string          `json:"table"`
	Data   json.RawMessage `json:"data"`

	Transient bool `json:"transient" gorm:"-"`
}

type withOption = func(op *Op)

func WithTransient() withOption {
	return func(op *Op) {
		op.Transient = true
	}
}

func (op Op) String() string {
	return fmt.Sprintf("%s: %s %s %s", op.Host, op.Action, op.Table, op.Data)
}
