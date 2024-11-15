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
	"github.com/AudiusProject/audius-protocol/pkg/core/gen/proto"
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

type MempoolTransaction struct {
	Deadline int64
	Tx       *proto.SignedTransaction
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

func (m *Mempool) AddTransaction(key string, tx *MempoolTransaction) error {
	// TODO: check db if tx already exists

	// broadcast to peers before adding to our own mempool
	go m.BroadcastTransaction(tx)

	m.mutex.Lock()
	defer m.mutex.Unlock()

	if len(m.txMap) >= m.maxMempoolTransactions {
		return ErrFullMempool
	}

	element := m.deque.PushBack(tx)
	m.txMap[key] = element
	return nil
}

func (m *Mempool) GetBatch(batchSize int) []*proto.SignedTransaction {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	batch := []*proto.SignedTransaction{}
	count := 0

	for e := m.deque.Front(); e != nil && count < batchSize; e = e.Next() {
		tx, ok := e.Value.(*MempoolTransaction)
		if !ok {
			continue
		}
		batch = append(batch, tx.Tx)
		count++
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
		}
	}
}

func (m *Mempool) BroadcastTransaction(tx *MempoolTransaction) {
	for peer, _ := range m.broadcastPeers {
		go func(logger *common.Logger, peer *sdk.Sdk) {
			params := protocol.NewProtocolForwardTransactionParams()
			params.SetTransaction(common.SignedTxProtoIntoSignedTxOapi(tx.Tx))
			_, err := peer.ProtocolForwardTransaction(params)
			if err != nil {
				logger.Errorf("could not broadcast tx: %v", err)
				return
			}
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

// utility method to add validator types to this instance of the mempool
// reads validators from genesis doc, gets urls from db, then creates
// sdk instances to all of them for broadcasting capabilities
func (m *Mempool) AddValidators() error {
	gendoc := m.config.GenesisFile
	validators := gendoc.Validators

	g, ctx := errgroup.WithContext(context.Background())

	for _, validator := range validators {
		g.Go(func() error {
			validatorAddr := validator.Address.String()
			m.logger.Debugf("attempted to add %s as peer", validatorAddr)

			if m.config.ProposerAddress == validatorAddr {
				m.logger.Info("found self, not peering")
			}

			m.logger.Debugf("not me %s", validatorAddr)

			validatorRecord, err := m.db.GetRegisteredNodeByCometAddress(ctx, validatorAddr)
			if err != nil {
				m.logger.Errorf("could not get validator %s to add to mempool: %v", validatorAddr, err)
				return err
			}

			m.logger.Debugf("found them %s", validatorAddr)

			parsedURL, err := url.Parse(validatorRecord.Endpoint)
			if err != nil {
				m.logger.Errorf("could not parse url for %s: %v", validatorRecord.Endpoint, err)
				return err
			}

			m.logger.Debugf("parsed url %s", validatorAddr)

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
