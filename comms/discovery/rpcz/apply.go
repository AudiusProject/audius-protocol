package rpcz

import (
	"context"
	"encoding/json"
	"expvar"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/nats-io/nats.go"
	"github.com/tidwall/gjson"
)

type RPCProcessor struct {
	validator         *Validator
	JetstreamSequence *expvar.Int
	ConsumerSequence  *expvar.Int
}

func NewProcessor(jsc nats.JetStreamContext) (*RPCProcessor, error) {
	limiter, err := NewRateLimiter(jsc)
	if err != nil {
		return nil, err
	}
	validator := &Validator{
		db:      db.Conn,
		limiter: limiter,
	}

	return &RPCProcessor{
		validator:         validator,
		JetstreamSequence: expvar.NewInt("jetstream_sequence"),
		ConsumerSequence:  expvar.NewInt("consumer_sequence"),
	}, nil
}

func (proc *RPCProcessor) Validate(userId int32, rawRpc schema.RawRPC) error {
	return proc.validator.Validate(userId, rawRpc)
}

// Validates + applies a NATS message
func (proc *RPCProcessor) Apply(msg *nats.Msg) {
	var err error
	logger := config.Logger.New()

	// get seq
	meta, err := msg.Metadata()
	if err != nil {
		logger.Info("invalid nats message", err)
		return
	}
	logger = logger.New("js_seq", meta.Sequence.Stream, "consumer_seq", meta.Sequence.Consumer)
	proc.JetstreamSequence.Set(int64(meta.Sequence.Stream))
	proc.ConsumerSequence.Set(int64(meta.Sequence.Consumer))

	// recover wallet + user
	signatureHeader := msg.Header.Get(config.SigHeader)
	wallet, err := misc.RecoverWallet(msg.Data, signatureHeader)
	if err != nil {
		logger.Warn("unable to recover wallet, skipping")
		return
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, context.Background(), wallet)
	if err != nil {
		logger.Warn("wallet not found: " + err.Error())
		return
	}
	logger = logger.New("wallet", wallet, "userId", userId)

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

	attemptApply := func(msg *nats.Msg) error {

		// write to db
		tx, err := db.Conn.Beginx()
		if err != nil {
			return err
		}

		query := `
		INSERT INTO rpc_log (jetstream_sequence, jetstream_timestamp, from_wallet, rpc, sig) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
		`
		result, err := tx.Exec(query, meta.Sequence.Stream, meta.Timestamp, wallet, msg.Data, signatureHeader)
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
			logger.Info("rpc already in log, skipping duplicate seq number", "seq", meta.Sequence.Stream)
			return nil
		}

		switch schema.RPCMethod(rawRpc.Method) {
		case schema.RPCMethodChatCreate:
			var params schema.ChatCreateRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatCreate(tx, userId, meta.Timestamp, params)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatDelete:
			var params schema.ChatDeleteRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatDelete(tx, userId, params.ChatID, meta.Timestamp)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatMessage:
			var params schema.ChatMessageRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatSendMessage(tx, userId, params.ChatID, params.MessageID, meta.Timestamp, params.Message)
			if err != nil {
				return err
			}
		case schema.RPCMethodChatReact:
			var params schema.ChatReactRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				return err
			}
			err = chatReactMessage(tx, userId, params.MessageID, params.Reaction, meta.Timestamp)
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
			if !lastActive.Valid || meta.Timestamp.After(lastActive.Time) {
				err = chatReadMessages(tx, userId, params.ChatID, meta.Timestamp)
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
			err = chatBlock(tx, userId, int32(blockeeUserId), meta.Timestamp)
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

		err = tx.Commit()
		if err != nil {
			return err
		}

		// send out websocket events?
		if chatId := gjson.GetBytes(rawRpc.Params, "chat_id").String(); chatId != "" {
			var userIds []int32
			err = db.Conn.Select(&userIds, `select user_id from chat_member where chat_id = $1`, chatId)
			if err != nil {
				config.Logger.Warn("failed to load chat members for websocket push " + err.Error())
			} else {
				var parsedParams schema.RPCPayloadParams
				err := json.Unmarshal(rawRpc.Params, &parsedParams)
				if err != nil {
					config.Logger.Error("Failed to parse params")
				}
				payload := schema.RPCPayload{Method: schema.RPCMethod(rawRpc.Method), Params: parsedParams}
				encodedUserId, err := misc.EncodeHashId(int(userId))
				data := schema.ChatWebsocketEventData{RPC: payload, Metadata: schema.Metadata{Timestamp: meta.Timestamp.Format(time.RFC3339Nano), UserID: encodedUserId}}
				for _, subscribedUserId := range userIds {
					// Don't send events sent by a user to that same user
					if subscribedUserId != userId {
						websocketPush(subscribedUserId, data)
					}
				}
			}

		}

		return nil
	}

	for i := 1; i < 5; i++ {
		err := attemptApply(msg)
		if err != nil {
			logger.Warn("apply failed "+err.Error(), "attempt", i)
			time.Sleep(time.Second * 3)
		} else {
			break
		}
	}

}
