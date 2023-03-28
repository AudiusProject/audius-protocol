package rpcz

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/r3labs/sse/v2"
	"github.com/tidwall/gjson"
)

type RPCProcessor struct {
	sync.Mutex
	waiters   map[uint64]chan error
	validator *Validator
	SSEServer *sse.Server
}

const (
	sseStreamName = "rpc"
)

func NewProcessor() (*RPCProcessor, error) {

	// set up validator + limiter
	limiter, err := NewRateLimiter()
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
	go func() {
		for {
			time.Sleep(time.Second * 10)
			msg := fmt.Sprintf("ping: %s", time.Now().Format(time.RFC3339))
			sseServer.Publish(sseStreamName, &sse.Event{
				Data: []byte(msg),
			})

		}
	}()

	proc := &RPCProcessor{
		waiters:   make(map[uint64]chan error),
		validator: validator,
		SSEServer: sseServer,
	}

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
func (proc *RPCProcessor) ApplyAndPublish(rpcLog *schema.RpcLog) (*schema.RpcLog, error) {

	// apply
	err := proc.Apply(rpcLog)
	if err != nil {
		return nil, err
	}

	// publish event
	j, err := json.Marshal(rpcLog)
	if err != nil {
		log.Println("err: invalid json", err)
	} else {
		proc.SSEServer.Publish(sseStreamName, &sse.Event{
			Data: j,
		})
		log.Println("sse published", string(rpcLog.Rpc))
	}

	return rpcLog, nil
}

// Validates + applies a NATS message
func (proc *RPCProcessor) Apply(rpcLog *schema.RpcLog) error {

	var err error
	logger := logger.New()

	startTime := time.Now()
	takeSplit := func() time.Duration {
		split := time.Since(startTime)
		startTime = time.Now()
		return split
	}

	// get ts
	messageTs := rpcLog.RelayedAt

	// recover wallet + user
	signatureHeader := rpcLog.Sig
	wallet, err := misc.RecoverWallet(rpcLog.Rpc, signatureHeader)
	if err != nil {
		logger.Warn("unable to recover wallet, skipping")
		return nil
	}
	logger.Debug("recovered wallet", "took", takeSplit())

	if wallet != rpcLog.FromWallet {
		fmt.Println("recovered wallet no match", "recovered", wallet, "expected", rpcLog.FromWallet, "realeyd_by", rpcLog.RelayedBy, "sig", rpcLog.Sig)
		return nil
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, context.Background(), wallet)
	if err != nil {
		logger.Warn("wallet not found: "+err.Error(), "wallet", wallet, "sig", signatureHeader)
		return nil
	}
	logger = logger.New("wallet", wallet, "userId", userId)
	logger.Debug("got user", "took", takeSplit())

	// parse raw rpc
	var rawRpc schema.RawRPC
	err = json.Unmarshal(rpcLog.Rpc, &rawRpc)
	if err != nil {
		logger.Info(err.Error())
		return nil
	}

	// call any validator
	err = proc.validator.Validate(userId, rawRpc)
	if err != nil {
		logger.Info(err.Error())
		return nil
	}
	logger.Debug("did validation", "took", takeSplit())

	attemptApply := func() error {

		// write to db
		tx, err := db.Conn.Beginx()
		if err != nil {
			return err
		}
		defer tx.Rollback()

		logger.Debug("begin tx", "took", takeSplit(), "sig", rpcLog.Sig)

		query := `
		INSERT INTO rpc_log (relayed_by, relayed_at, applied_at, from_wallet, rpc, sig)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT DO NOTHING
		`
		result, err := tx.Exec(query, rpcLog.RelayedBy, messageTs, time.Now(), wallet, rpcLog.Rpc, signatureHeader)
		if err != nil {
			return err
		}
		count, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if count == 0 {
			// No rows were inserted because the sig (id) is already in rpc_log.
			// Do not process redelivered messages that have already been processed.
			logger.Info("rpc already in log, skipping duplicate", "sig", rpcLog.Sig)
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

	err = attemptApply()
	if err != nil {
		logger.Warn("apply failed", "err", err)
	}
	return err
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
