package server

import (
	"context"
	"sync"
	"time"

	"github.com/AudiusProject/audius-protocol/pkg/core/gen/core_proto"
	"github.com/AudiusProject/audius-protocol/pkg/mediorum/server/signature"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const playBatch = 500

type PlayEventQueue struct {
	mu    sync.Mutex
	plays []*PlayEvent
}

func NewPlayEventQueue() *PlayEventQueue {
	return &PlayEventQueue{
		plays: []*PlayEvent{},
	}
}

func (p *PlayEventQueue) pushPlayEvent(play *PlayEvent) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.plays = append(p.plays, play)
}

func (p *PlayEventQueue) popPlayEventBatch() []*PlayEvent {
	p.mu.Lock()
	defer p.mu.Unlock()

	batchSize := playBatch
	if len(p.plays) < playBatch {
		batchSize = len(p.plays)
	}

	batch := p.plays[:batchSize]
	p.plays = p.plays[batchSize:]

	return batch
}

var playQueueInterval = 20 * time.Second

type PlayEvent struct {
	RowID     int
	UserID    string
	TrackID   string
	PlayTime  time.Time
	Signature string
	City      string
	Region    string
	Country   string
}

func (ss *MediorumServer) startPlayEventQueue() {
	ss.logger.Info("plays queue waiting for core sdk")
	<-ss.coreSdkReady
	ss.logger.Info("core sdk initialized")

	ticker := time.NewTicker(playQueueInterval)
	defer ticker.Stop()

	for range ticker.C {
		if err := ss.processPlayRecordBatch(); err != nil {
			ss.logger.Error("error recording play batch", "error", err)
		}
	}
}

func (ss *MediorumServer) processPlayRecordBatch() error {
	// require all operations in process batch take at most 30 seconds
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	plays := ss.playEventQueue.popPlayEventBatch()
	if len(plays) == 0 {
		return nil
	}

	// assemble batch of plays into core tx
	sdk := ss.coreSdk

	corePlays := []*core_proto.TrackPlay{}
	for _, play := range plays {
		corePlays = append(corePlays, &core_proto.TrackPlay{
			UserId:    play.UserID,
			TrackId:   play.TrackID,
			Timestamp: timestamppb.New(play.PlayTime),
			Signature: play.Signature,
			City:      play.City,
			Country:   play.Country,
			Region:    play.Region,
		})
	}

	playsTx := &core_proto.TrackPlays{
		Plays: corePlays,
	}

	// sign plays event payload with mediorum priv key
	signedPlaysEvent, err := signature.SignCoreBytes(playsTx, ss.Config.privateKey)
	if err != nil {
		ss.logger.Error("core error signing listen proto event", "err", err)
		return err
	}

	// construct proto listen signedTx alongside signature of plays signedTx
	signedTx := &core_proto.SignedTransaction{
		Signature: signedPlaysEvent,
		Transaction: &core_proto.SignedTransaction_Plays{
			Plays: playsTx,
		},
	}

	// submit to configured core node
	res, err := sdk.SendTransaction(ctx, &core_proto.SendTransactionRequest{
		Transaction: signedTx,
	})

	if err != nil {
		ss.logger.Error("core error submitting listen event", "err", err)
		return err
	}

	ss.logger.Info("core %d listens recorded", "tx", len(corePlays), res.Txhash)
	return nil
}
