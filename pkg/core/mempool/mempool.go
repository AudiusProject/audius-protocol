package mempool

import (
	"container/list"
	"context"
	"errors"
	"net/url"
	"sync"

	"github.com/AudiusProject/audius-protocol/pkg/core/common"
	"github.com/AudiusProject/audius-protocol/pkg/core/config"
	"github.com/AudiusProject/audius-protocol/pkg/core/db"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_openapi/protocol"
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/core/sdk"
	"golang.org/x/sync/errgroup"
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
	broadcastPeers         map[*sdk.Sdk]struct{}
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
		broadcastPeers:         make(map[*sdk.Sdk]struct{}),
		db:                     db,
		maxMempoolTransactions: maxTransactions,
	}
}

func (m *Mempool) AddPeer(peer *sdk.Sdk) {
	m.broadcastPeers[peer] = struct{}{}
}

func (m *Mempool) AddTransaction(key string, tx *MempoolTransaction, broadcast bool) error {
	// TODO: check db if tx already exists

	// broadcast to peers before adding to our own mempool
	if broadcast {
		go m.BroadcastTransaction(key, tx)
	}

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

func (m *Mempool) BroadcastTransaction(key string, tx *MempoolTransaction) {
	// only broadcast certain types of txs, don't broadcast these ones
	switch tx.Tx.Transaction.(type) {
	case *core_proto.SignedTransaction_SlaRollup:
		return
	}

	for peer := range m.broadcastPeers {
		go func(logger *common.Logger, peer *sdk.Sdk) {
			params := protocol.NewProtocolForwardTransactionParams()
			params.SetTransaction(common.SignedTxProtoIntoSignedTxOapi(tx.Tx))
			_, err := peer.ProtocolForwardTransaction(params)
			if err != nil {
				logger.Errorf("could not broadcast tx: %v", err)
				return
			}
			m.logger.Debugf("broadcasted tx %s to peer", key)
		}(m.logger, peer)
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

// utility method to add validator types to this instance of the mempool
// reads validators from genesis doc, gets urls from db, then creates
// sdk instances to all of them for broadcasting capabilities
func (m *Mempool) CreateValidatorClients() error {
	gendoc := m.config.GenesisFile
	validators := gendoc.Validators

	g, ctx := errgroup.WithContext(context.Background())

	for _, validator := range validators {
		g.Go(func() error {
			validatorAddr := validator.Address.String()

			if m.config.ProposerAddress == validatorAddr {
				m.logger.Info("found self, not peering")
				return nil
			}

			validatorRecord, err := m.db.GetRegisteredNodeByCometAddress(ctx, validatorAddr)
			if err != nil {
				m.logger.Errorf("could not get validator %s to add to mempool: %v", validatorAddr, err)
				return err
			}

			parsedURL, err := url.Parse(validatorRecord.Endpoint)
			if err != nil {
				m.logger.Errorf("could not parse url for %s: %v", validatorRecord.Endpoint, err)
				return err
			}

			// TODO: init all these clients at a higher level including non validators
			oapiendpoint := parsedURL.Host
			peerSdk, err := sdk.NewSdk(sdk.WithOapiendpoint(oapiendpoint))
			if err != nil {
				m.logger.Errorf("could not init sdk for %s %s: %v", oapiendpoint, validatorAddr, err)
				return err
			}

			m.AddPeer(peerSdk)
			m.logger.Infof("added peer %s", oapiendpoint)
			return nil
		})
	}

	// if adding any peers fails, return error
	return g.Wait()
}
