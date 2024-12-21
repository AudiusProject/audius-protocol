// The mempool (memory pool) stores and broadcasts transactions that are prepared to be included in a block.
// There is no guarantee that when a transaction makes it into the mempool that it will be included in a block.
package server

import (
	"container/list"
	"encoding/json"
	"errors"
	"fmt"
	"sync"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_openapi/protocol"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
	"github.com/labstack/echo/v4"
	"google.golang.org/protobuf/encoding/protojson"
)

var (
	ErrFullMempool = errors.New("mempool full")
)

type Mempool struct {
	logger *common.Logger
	config *config.Config

	deque *list.List
	txMap map[string]*list.Element
	mutex sync.Mutex

	db *db.Queries

	maxMempoolTransactions int
}

// signed tx with mempool related metadata
// deadline - the block MUST be included in a block prior to the deadline
type MempoolTransaction struct {
	Deadline int64
	Tx       *core_proto.SignedTransaction
}

func NewMempool(logger *common.Logger, config *config.Config, db *db.Queries, maxTransactions int) *Mempool {
	return &Mempool{
		logger:                 logger.Child("mempool"),
		config:                 config,
		deque:                  list.New(),
		txMap:                  make(map[string]*list.Element),
		db:                     db,
		maxMempoolTransactions: maxTransactions,
	}
}

// gathers a batch of transactions skipping those that have expired
func (m *Mempool) GetBatch(batchSize int, currentBlock int64) []*core_proto.SignedTransaction {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	batch := []*core_proto.SignedTransaction{}
	count := 0

	for e := m.deque.Front(); e != nil && count < batchSize; e = e.Next() {
		tx, ok := e.Value.(*MempoolTransaction)
		if !ok {
			continue
		}

		if tx.Deadline <= currentBlock {
			continue
		}

		batch = append(batch, tx.Tx)
		count++
	}

	return batch
}

func (m *Mempool) GetAll() []*core_proto.SignedTransaction {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	batch := []*core_proto.SignedTransaction{}

	for {
		e := m.deque.Front()
		if e.Next() != nil {
			tx, ok := e.Value.(*MempoolTransaction)
			if !ok {
				continue
			}
			batch = append(batch, tx.Tx)
			continue
		}
		break
	}

	return batch
}

func (m *Mempool) RemoveBatch(ids []string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	for _, id := range ids {
		if element, exists := m.txMap[id]; exists {
			m.deque.Remove(element)
			delete(m.txMap, id)
			m.logger.Infof("removed from mempool %s", id)
		}
	}
}

func (m *Mempool) RemoveExpiredTransactions(blockNum int64) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	for id, element := range m.txMap {
		mptx, ok := element.Value.(*MempoolTransaction)
		if !ok {
			continue
		}
		deadline := mptx.Deadline
		if deadline <= blockNum {
			m.deque.Remove(element)
			delete(m.txMap, id)
		}
	}
}

func (m *Mempool) MempoolSize() (int, int) {
	return len(m.txMap), m.deque.Len()
}

func (s *Server) addMempoolTransaction(key string, tx *MempoolTransaction, broadcast bool) error {
	// TODO: check db if tx already exists

	// broadcast to peers before adding to our own mempool
	if broadcast {
		go s.broadcastMempoolTransaction(key, tx)
	}

	m := s.mempl
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if len(m.txMap) >= m.maxMempoolTransactions {
		return ErrFullMempool
	}

	_, exists := m.txMap[key]
	if exists {
		m.logger.Warningf("duplicate tx %s tried to add to mempool", key)
		return nil
	}

	element := m.deque.PushBack(tx)
	m.txMap[key] = element

	m.logger.Infof("added to mempool %s", key)
	return nil
}

func (s *Server) broadcastMempoolTransaction(key string, tx *MempoolTransaction) {
	// only broadcast certain types of txs, don't broadcast these ones
	switch tx.Tx.Transaction.(type) {
	case *core_proto.SignedTransaction_SlaRollup:
		return
	}

	peers := s.GetPeers()
	for _, peer := range peers {
		go func(logger *common.Logger, peer *sdk.Sdk) {
			params := protocol.NewProtocolForwardTransactionParams()
			params.SetTransaction(common.SignedTxProtoIntoSignedTxOapi(tx.Tx))
			_, err := peer.ProtocolForwardTransaction(params)
			if err != nil {
				logger.Errorf("could not broadcast tx %s: %v", key, err)
				return
			}
			s.logger.Infof("broadcasted tx %s to peer", key)
		}(s.logger, peer)
	}
}

func (s *Server) getMempl(c echo.Context) error {
	txs := s.mempl.GetAll()

	jsontxs := [][]byte{}
	for _, tx := range txs {
		jsonData, err := protojson.Marshal(tx)
		if err != nil {
			return fmt.Errorf("could not marshal proto into json: %v", err)
		}
		jsontxs = append(jsontxs, jsonData)
	}

	result := []map[string]interface{}{}
	for _, jsonData := range jsontxs {
		var obj map[string]interface{}
		if err := json.Unmarshal(jsonData, &obj); err != nil {
			return fmt.Errorf("invalid json")
		}
		result = append(result, obj)
	}

	return c.JSONPretty(200, result, "  ")
}
