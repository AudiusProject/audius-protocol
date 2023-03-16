package rpcz

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"expvar"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	discoveryConfig "comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	natsdConfig "comms.audius.co/natsd/config"
	sharedConfig "comms.audius.co/shared/config"
	"github.com/avast/retry-go"
	"github.com/nats-io/nats.go"
	"github.com/r3labs/sse/v2"
	"github.com/tidwall/gjson"
)

type RPCProcessor struct {
	sync.Mutex
	jsc               nats.JetStreamContext
	waiters           map[uint64]chan error
	validator         *Validator
	JetstreamSequence *expvar.Int
	ConsumerSequence  *expvar.Int
	SSEServer         *sse.Server

	work chan *nats.Msg
}

const (
	sseStreamName = "rpc"
)

func NewProcessor(jsc nats.JetStreamContext) (*RPCProcessor, error) {

	// set up validator + limiter
	limiter, err := NewRateLimiter(jsc)
	if err != nil {
		return nil, err
	}
	validator := &Validator{
		db:      db.Conn,
		limiter: limiter,
	}

	sseServer := sse.New()
	sseServer.AutoReplay = false
	sseServer.CreateStream(sseStreamName)
	sseServer.CreateStream("ping")
	go func() {
		for {
			time.Sleep(time.Second * 5)
			msg := fmt.Sprintf(" time: %s ", time.Now().String())
			sseServer.Publish("ping", &sse.Event{
				Data: []byte(msg),
			})
		}
	}()

	proc := &RPCProcessor{
		jsc:               jsc,
		waiters:           make(map[uint64]chan error),
		validator:         validator,
		JetstreamSequence: expvar.NewInt("jetstream_sequence"),
		ConsumerSequence:  expvar.NewInt("consumer_sequence"),
		SSEServer:         sseServer,
		work:              make(chan *nats.Msg),
	}

	// create backing stream
	_, err = jsc.AddStream(&nats.StreamConfig{
		Name:     discoveryConfig.GlobalStreamName,
		Subjects: []string{discoveryConfig.GlobalStreamSubject},
		Replicas: natsdConfig.NatsReplicaCount,
		// DenyDelete: true,
		// DenyPurge:  true,
		Placement: discoveryConfig.DiscoveryPlacement(),
	})
	if err != nil {
		return nil, err
	}

	// create consumer
	// messages processed in parallel via work chan
	// work := make(chan *nats.Msg)
	workerCount := 5
	for i := 0; i < workerCount; i++ {
		go proc.startWorker(proc.work)
	}

	// durableId := discoveryConfig.GetDiscoveryConfig().PeeringConfig.Keys.DelegatePublicKey
	// sub, err := jsc.ChanSubscribe(discoveryConfig.GlobalStreamSubject, work, nats.Durable(durableId), nats.AckExplicit())
	// if err != nil {
	// 	logger.Error(err.Error())
	// 	return nil, err
	// }
	// sub.SetPendingLimits(-1, -1)

	return proc, nil
}

func (proc *RPCProcessor) Validate(userId int32, rawRpc schema.RawRPC) error {
	return proc.validator.Validate(userId, rawRpc)
}

// ApplyAndPublish is the "no nats" version of submit and wait.
// it:
//   - timestamps message
//   - applies locally
//   - publishes to SSE server for any connected peers.
//
// there are several todos here to match the "manyfeeds" document:
//   - should consider partition ID and forward to rendezvous "write leader"
//   - should return error if apply fails
//   - `sync_client.go` needs to perform backfill on boot
//   - SSE publish is "fire and forget" style... if we want a quorum write thing we'll need some form of ACKs
func (proc *RPCProcessor) ApplyAndPublish(msg *nats.Msg) (*nats.PubAck, error) {

	// add headers
	// msg.Header.Add("relayed_by", "todo: relayer host name")
	msg.Header.Add("relayed_at", time.Now().Format(time.RFC3339))

	// apply
	// todo: apply should return error
	proc.Apply(msg)

	// publish event
	j, err := json.Marshal(msg)
	if err != nil {
		log.Println("err: invalid json", err)
	} else {
		proc.SSEServer.Publish(sseStreamName, &sse.Event{
			Data: j,
		})
		log.Println("sse published", string(msg.Data))
	}

	// just to mimic existing SubmitAndWait signature
	return &nats.PubAck{}, nil
}

func (proc *RPCProcessor) SubmitAndWait(msg *nats.Msg) (*nats.PubAck, error) {

	ok, err := proc.jsc.PublishMsg(msg)
	if err != nil {
		return nil, err
	}

	// register waiter
	ch := make(chan error)
	proc.Lock()
	proc.waiters[ok.Sequence] = ch
	proc.Unlock()

	// await result
	select {
	case err = <-ch:
	case <-time.After(10 * time.Second):
		err = errors.New("apply timed out after 10 seconds")
	}

	// deregister waiter
	proc.Lock()
	delete(proc.waiters, ok.Sequence)
	close(ch)
	proc.Unlock()

	return ok, err
}

func (proc *RPCProcessor) startWorker(work chan *nats.Msg) {
	for msg := range work {
		proc.Apply(msg)
	}
}

// Validates + applies a NATS message
func (proc *RPCProcessor) Apply(msg *nats.Msg) {
	defer msg.Ack()

	var err error
	logger := logger.New()

	startTime := time.Now()
	takeSplit := func() time.Duration {
		split := time.Since(startTime)
		startTime = time.Now()
		return split
	}

	// get ts
	var messageTs time.Time
	var jetstreamSequence uint64
	if meta, err := msg.Metadata(); err == nil {
		logger = logger.New("js_seq", meta.Sequence.Stream, "consumer_seq", meta.Sequence.Consumer)
		messageTs = meta.Timestamp
		jetstreamSequence = meta.Sequence.Stream
	} else {
		if ts, err := time.Parse(time.RFC3339, msg.Header.Get("relayed_at")); err != nil {
			log.Println("failed to get TS", msg)
		} else {
			messageTs = ts
		}
	}

	// proc.JetstreamSequence.Set(int64(meta.Sequence.Stream))
	// proc.ConsumerSequence.Set(int64(meta.Sequence.Consumer))

	// notify any waiters of apply result
	defer func() {
		proc.Lock()
		if waiter, ok := proc.waiters[jetstreamSequence]; ok {
			waiter <- err
		}
		proc.Unlock()
	}()

	// recover wallet + user
	signatureHeader := msg.Header.Get(sharedConfig.SigHeader)
	wallet, err := misc.RecoverWallet(msg.Data, signatureHeader)
	if err != nil {
		logger.Warn("unable to recover wallet, skipping")
		return
	}
	logger.Debug("recovered wallet", "took", takeSplit())

	userId, err := queries.GetUserIDFromWallet(db.Conn, context.Background(), wallet)
	if err != nil {
		logger.Warn("wallet not found: " + err.Error())
		return
	}
	logger = logger.New("wallet", wallet, "userId", userId)
	logger.Debug("got user", "took", takeSplit())

	// parse raw rpc
	var rawRpc schema.RawRPC
	err = json.Unmarshal(msg.Data, &rawRpc)
	if err != nil {
		logger.Info(err.Error())
		return
	}

	// call any validator
	err = proc.validator.Validate(userId, rawRpc)
	if err != nil {
		logger.Info(err.Error())
		return
	}
	logger.Debug("did validation", "took", takeSplit())

	attemptApply := func() error {

		// write to db
		tx, err := db.Conn.Beginx()
		if err != nil {
			return err
		}
		defer tx.Rollback()

		// build rpc_log id
		hash := md5.Sum(msg.Data)
		hashHex := hex.EncodeToString(hash[:])
		tsString := strings.Replace(messageTs.Format("2006.01.02.15.04.05.000"), ".", "", -1)
		idString := tsString + "_" + hashHex

		logger.Debug("begin tx", "took", takeSplit(), "id", idString)

		query := `
		INSERT INTO rpc_log (jetstream_sequence, jetstream_timestamp, from_wallet, rpc, sig, id)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT DO NOTHING
		`
		result, err := tx.Exec(query, jetstreamSequence, messageTs, wallet, msg.Data, signatureHeader, idString)
		if err != nil {
			return err
		}
		count, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if count == 0 {
			// No rows were inserted because the jetstream seq number is already in rpc_log.
			// Do not process redelivered messages that have already been processed.
			logger.Info("rpc already in log, skipping duplicate seq number", "seq", jetstreamSequence)
			return nil
		}
		logger.Debug("inserted RPC", "took", takeSplit())

		switch schema.RPCMethod(rawRpc.Method) {
		case schema.RPCMethodChatCreate:
			var params schema.ChatCreateRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatCreate(tx, userId, messageTs, params)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatDelete:
			var params schema.ChatDeleteRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatDelete(tx, userId, params.ChatID, messageTs)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatMessage:
			var params schema.ChatMessageRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatSendMessage(tx, userId, params.ChatID, params.MessageID, messageTs, params.Message)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatReact:
			var params schema.ChatReactRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatReactMessage(tx, userId, params.MessageID, params.Reaction, messageTs)
			if err != nil {
				return err
			}

		case schema.RPCMethodChatRead:
			var params schema.ChatReadRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			// do nothing if last active at >= message timestamp
			lastActive, err := queries.LastActiveAt(tx, context.Background(), queries.ChatMembershipParams{
				ChatID: params.ChatID,
				UserID: userId,
			})
			if err != nil {
				return err
			}
			if !lastActive.Valid || messageTs.After(lastActive.Time) {
				err = chatReadMessages(tx, userId, params.ChatID, messageTs)
				if err != nil {
					return err
				}
			}
		case schema.RPCMethodChatPermit:
			var params schema.ChatPermitRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatSetPermissions(tx, userId, params.Permit)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatBlock:
			var params schema.ChatBlockRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			blockeeUserId, err := misc.DecodeHashId(params.UserID)
			if err != nil {
				return err
			}
			err = chatBlock(tx, userId, int32(blockeeUserId), messageTs)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatUnblock:
			var params schema.ChatUnblockRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			unblockedUserId, err := misc.DecodeHashId(params.UserID)
			if err != nil {
				return err
			}
			err = chatUnblock(tx, userId, int32(unblockedUserId))
			if err != nil {
				return err
			}
		default:
			logger.Warn("no handler for ", rawRpc.Method)
		}

		logger.Debug("called handler", "took", takeSplit())

		err = tx.Commit()
		if err != nil {
			return err
		}
		logger.Debug("commited", "took", takeSplit())

		// send out websocket events fire + forget style
		websocketNotify(rawRpc, userId, messageTs.Round(time.Microsecond))
		logger.Debug("websocket push done", "took", takeSplit())

		return nil
	}

	err = retry.Do(
		attemptApply,
		retry.Delay(300*time.Millisecond),
		retry.OnRetry(func(n uint, err error) {
			logger.Warn("apply attempt failed", "attempt", n, "err", err)
		}))

	if err != nil {
		logger.Warn("apply failed", "err", err)
	}

}

func websocketNotify(rawRpc schema.RawRPC, userId int32, timestamp time.Time) {
	if chatId := gjson.GetBytes(rawRpc.Params, "chat_id").String(); chatId != "" {
		var userIds []int32
		err := db.Conn.Select(&userIds, `select user_id from chat_member where chat_id = $1`, chatId)
		if err != nil {
			logger.Warn("failed to load chat members for websocket push " + err.Error())
		} else {
			var parsedParams schema.RPCPayloadParams
			err := json.Unmarshal(rawRpc.Params, &parsedParams)
			if err != nil {
				logger.Error("Failed to parse params")
				return
			}
			payload := schema.RPCPayload{Method: schema.RPCMethod(rawRpc.Method), Params: parsedParams}
			encodedUserId, _ := misc.EncodeHashId(int(userId))
			data := schema.ChatWebsocketEventData{RPC: payload, Metadata: schema.Metadata{Timestamp: timestamp.Format(time.RFC3339Nano), UserID: encodedUserId}}
			for _, subscribedUserId := range userIds {
				websocketPush(subscribedUserId, data)
			}
		}

	}
}
