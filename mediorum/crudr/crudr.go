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

// create partitioned ops table if it does not exist
func migrateOps(db *gorm.DB) error {
	opDDL := `
	CREATE TABLE IF NOT EXISTS ops (
		"ulid" TEXT,
		"host" TEXT,
		"action" TEXT,
		"table" TEXT,
		"data" JSONB)
		PARTITION BY HASH ("host");
	
	COMMIT;

	CREATE OR REPLACE FUNCTION create_partitions(min_i INTEGER, max_i INTEGER, total INTEGER)
	RETURNS VOID AS
	$$
	DECLARE
			i INTEGER;
			partition_name TEXT;
	BEGIN
			FOR i IN min_i..max_i LOOP
					partition_name := 'ops_' || i;
					EXECUTE 'CREATE TABLE IF NOT EXISTS ' || partition_name || ' PARTITION OF ops FOR VALUES WITH (MODULUS ' || total || ', REMAINDER ' || i || ');';
					BEGIN
							EXECUTE 'ALTER TABLE ' || partition_name || ' ADD PRIMARY KEY ("ulid");';
							EXCEPTION WHEN invalid_table_definition THEN NULL;
					END;
			END LOOP;
	END;
	$$
	LANGUAGE plpgsql;

  -- migrate and commit partitions in chunks to avoid running out of memory
	SELECT create_partitions(0, 200, 1009);
	COMMIT;
	SELECT create_partitions(201, 400, 1009);
	COMMIT;
	SELECT create_partitions(401, 600, 1009);
	COMMIT;
	SELECT create_partitions(601, 800, 1009);
	COMMIT;
	SELECT create_partitions(801, 1008, 1009);
	COMMIT;
	`
	return db.Exec(opDDL).Error
}

func New(selfHost string, myPrivateKey *ecdsa.PrivateKey, peerHosts []string, db *gorm.DB) *Crudr {
	selfHost = httputil.RemoveTrailingSlash(strings.ToLower(selfHost))

	err := migrateOps(db)
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

		host:    selfHost,
		logger:  slog.With("module", "crud", "from", selfHost),
		typeMap: map[string]reflect.Type{},

		peerClients: make([]*PeerClient, len(peerHosts)),
	}

	for idx, peerHost := range peerHosts {
		c.peerClients[idx] = NewPeerClient(peerHost, c, selfHost)
	}

	return c
}

func (c *Crudr) StartClients() {
	for _, p := range c.peerClients {
		p.Start()
	}
}

// used for testing
func (c *Crudr) ForceSweep() {
	for _, p := range c.peerClients {
		p.doSweep()
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
	if op.Host == c.host && !op.SkipBroadcast {
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

func (c *Crudr) GetPercentNodesSeeded() float64 {
	var nCaughtUp int
	var nPeers int = len(c.peerClients)
	for _, p := range c.peerClients {
		if p.Seeded {
			nCaughtUp++
		}
	}

	return (float64(nCaughtUp) / float64(nPeers)) * 100
}
