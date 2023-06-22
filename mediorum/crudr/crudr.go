package crudr

import (
	"crypto/ecdsa"
	"encoding/json"
	"errors"
	"fmt"
	"mediorum/httputil"
	"reflect"
	"strings"
	"sync"

	"github.com/oklog/ulid/v2"
	"golang.org/x/exp/slog"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	ActionCreate = "create"
	ActionUpdate = "update"
	ActionDelete = "delete"
)

const (
	LocalStreamName  = "ops"
	GlobalStreamName = "global"
)

var (
	errDuplicateOp = errors.New("duplicate op")
)

type Crudr struct {
	DB           *gorm.DB
	myPrivateKey *ecdsa.PrivateKey

	host    string
	logger  *slog.Logger
	typeMap map[string]reflect.Type

	peerClients []*PeerClient

	mu        sync.Mutex
	callbacks []func(op *Op, records interface{})
}

func New(host string, myPrivateKey *ecdsa.PrivateKey, peerHosts []string, db *gorm.DB) *Crudr {
	host = httputil.RemoveTrailingSlash(strings.ToLower(host))

	opDDL := `
	create table if not exists ops (
		ulid text primary key,
		host text not null,
		action text not null,
		"table" text not null,
		data json
	);
	`
	err := db.Exec(opDDL).Error

	if err != nil {
		panic(err)
	}

	// todo: combine with above
	err = db.AutoMigrate(&Cursor{})
	if err != nil {
		panic(err)
	}

	c := &Crudr{
		DB:           db,
		myPrivateKey: myPrivateKey,

		host:    host,
		logger:  slog.With("module", "crud", "from", host),
		typeMap: map[string]reflect.Type{},

		peerClients: make([]*PeerClient, len(peerHosts)),
	}

	for idx, host := range peerHosts {
		c.peerClients[idx] = NewPeerClient(host, c)
	}

	return c
}

func (c *Crudr) StartClients() {
	for _, p := range c.peerClients {
		p.Start()
	}
}

// RegisterModels accepts a instance of a GORM model and registers it
// to work with Op apply.
func (c *Crudr) RegisterModels(tables ...interface{}) *Crudr {
	c.mu.Lock()
	defer c.mu.Unlock()
	for _, t := range tables {
		tableName := c.tableNameFor(t)
		c.typeMap[tableName] = reflect.TypeOf(t)
	}
	return c
}

func (c *Crudr) AddOpCallback(cb func(op *Op, records interface{})) {
	c.mu.Lock()
	c.callbacks = append(c.callbacks, cb)
	c.mu.Unlock()
}

func (c *Crudr) callOpCallbacks(op *Op, records interface{}) {
	for _, cb := range c.callbacks {
		cb(op, records)
	}
}

func (c *Crudr) Create(data interface{}, opts ...withOption) error {
	op := c.newOp(ActionCreate, data, opts...)
	return c.doOp(op)
}

func (c *Crudr) Update(data interface{}, opts ...withOption) error {
	op := c.newOp(ActionUpdate, data, opts...)
	return c.doOp(op)
}

func (c *Crudr) Patch(data interface{}, opts ...withOption) error {
	opts = append(opts, WithTransient())
	op := c.newOp(ActionUpdate, data, opts...)
	return c.doOp(op)
}

func (c *Crudr) Delete(data interface{}, opts ...withOption) error {
	op := c.newOp(ActionDelete, data, opts...)
	return c.doOp(op)
}

func (c *Crudr) newOp(action string, data interface{}, opts ...withOption) *Op {
	tableName := c.tableNameFor(data)

	j := jsonArrayMarshal(data)

	op := &Op{
		ULID:   ulid.Make().String(),
		Host:   c.host,
		Action: action,
		Table:  tableName,
		Data:   j,
	}
	for _, opt := range opts {
		opt(op)
	}

	return op
}

func (c *Crudr) doOp(op *Op) error {
	// apply locally
	err := c.ApplyOp(op)
	if err != nil {
		c.logger.Warn("apply failed", "op", op, "err", err)
		return err
	}

	return nil
}

func jsonArrayMarshal(data interface{}) []byte {
	j, err := json.Marshal(data)
	// panic here because data is always provided by app dev
	if err != nil {
		panic(err)
	}

	// ensure array
	if j[0] != '[' {
		j = append([]byte{'['}, j...)
		j = append(j, ']')
	}

	return j
}

// tableNameFor finds the struct at the heart of a thing
// and gets the gorm table name for it.
// will continually unwrap slices / pointers till it gets
// to the named struct type
func (c *Crudr) tableNameFor(obj interface{}) string {
	t := reflect.TypeOf(obj)
	for t.Kind() != reflect.Struct {
		t = t.Elem()
	}
	typeName := t.Name()
	return c.DB.NamingStrategy.TableName(typeName)
}

func (c *Crudr) KnownType(op *Op) bool {
	_, ok := c.typeMap[op.Table]
	return ok
}

func (c *Crudr) ApplyOp(op *Op) error {
	elemType, ok := c.typeMap[op.Table]
	if !ok {
		return fmt.Errorf("no type registered for %s", op.Table)
	}

	// deserialize op.Data to proper go type
	records := reflect.New(reflect.SliceOf(elemType)).Interface()
	err := json.Unmarshal(op.Data, &records)
	if err != nil {
		return fmt.Errorf("invalid crud data: %v %s", err, op.Data)
	}

	// create op + records in a db transaction
	err = c.DB.Transaction(func(tx *gorm.DB) error {
		if !op.Transient {
			res := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(op)
			if res.Error != nil {
				return res.Error
			}

			// if ulid already in ops table
			// with belt+suspenders we see every event twice
			// so no need to log anything here
			if res.RowsAffected == 0 {
				return errDuplicateOp
			}
		}

		switch op.Action {
		case ActionCreate:
			res := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(records)
			if res.RowsAffected == 0 {
				c.logger.Debug("create had no effect", "ulid", op.ULID)
				return nil
			}
			err = res.Error
		case ActionUpdate:
			res := tx.Clauses(clause.OnConflict{UpdateAll: true}).Create(records)
			err = res.Error
		case ActionDelete:
			err = tx.Delete(records).Error
		default:
			return fmt.Errorf("unknown action: %s", op.Action)
		}

		return err
	})

	if err == errDuplicateOp {
		// belt+suspenders: just move on
		return nil
	} else if err != nil {
		return err
	}

	// broadcast if this host is origin...
	if op.Host == c.host {
		msg, _ := json.Marshal(op)
		c.broadcast(msg)
	}

	// notify any local (in memory) subscribers
	c.callOpCallbacks(op, records)

	return nil
}

func (c *Crudr) GetOutboxSizes() map[string]int {
	sizes := make(map[string]int)
	for _, p := range c.peerClients {
		sizes[p.Host] = len(p.outbox)
	}
	return sizes
}
