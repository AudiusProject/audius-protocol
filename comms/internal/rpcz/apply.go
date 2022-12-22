package rpcz

import (
	"context"
	"encoding/json"

	"comms.audius.co/config"
	"comms.audius.co/db"
	"comms.audius.co/db/queries"
	"comms.audius.co/misc"
	"comms.audius.co/schema"
	"github.com/nats-io/nats.go"
)

// Validates + Applies a NATS message

func Apply(msg *nats.Msg) {
	var err error
	logger := config.Logger.New()

	// get seq
	meta, err := msg.Metadata()
	if err != nil {
		logger.Info("invalid nats message", err)
		return
	}
	logger = logger.New("seq", meta.Sequence.Stream)

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
	err = Validate(userId, rawRpc)
	if err != nil {
		logger.Info(err.Error())
		return
	}

	for attempt := 1; attempt < 5; attempt++ {

		logger = logger.New("attempt", attempt)

		if err != nil {
			logger.Warn(err.Error())
		}

		// write to db
		tx := db.Conn.MustBegin()
		if err != nil {
			continue
		}

		var count int
		err = tx.Get(&count, "select count(*) from rpc_log where jetstream_sequence = $1", meta.Sequence.Stream)
		if err != nil {
			continue
		}
		if count > 0 {
			// Do not process redelivered messages that have already been processed
			logger.Info("rpc already in log, skipping duplicate seq number", meta.Sequence.Stream)
			return
		}
		_, err = tx.Exec("insert into rpc_log (jetstream_sequence, jetstream_timestamp, from_wallet, rpc, sig) values($1, $2, $3, $4, $5)", meta.Sequence.Stream, meta.Timestamp, wallet, msg.Data, signatureHeader)
		if err != nil {
			continue
		}

		switch schema.RPCMethod(rawRpc.Method) {
		case schema.RPCMethodChatCreate:
			var params schema.ChatCreateRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			err = chatCreate(tx, userId, meta.Timestamp, params)
		case schema.RPCMethodChatDelete:
			var params schema.ChatDeleteRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			err = chatDelete(tx, userId, params.ChatID, meta.Timestamp)
		case schema.RPCMethodChatMessage:
			var params schema.ChatMessageRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			err = chatSendMessage(tx, userId, params.ChatID, params.MessageID, meta.Timestamp, params.Message)
		case schema.RPCMethodChatReact:
			var params schema.ChatReactRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			err = chatReactMessage(tx, userId, params.MessageID, params.Reaction, meta.Timestamp)
		case schema.RPCMethodChatRead:
			var params schema.ChatReadRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			// do nothing if last active at >= message timestamp
			lastActive, err := queries.LastActiveAt(tx, context.Background(), queries.ChatMembershipParams{
				ChatID: params.ChatID,
				UserID: userId,
			})
			if err != nil {
				continue
			}
			if !lastActive.Valid || meta.Timestamp.After(lastActive.Time) {
				err = chatReadMessages(tx, userId, params.ChatID, meta.Timestamp)
			}
		case schema.RPCMethodChatPermit:
			var params schema.ChatPermitRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			err = chatSetPermissions(tx, userId, params.Permit)
		case schema.RPCMethodChatBlock:
			var params schema.ChatBlockRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			blockeeUserId, err := misc.DecodeHashId(params.UserID)
			if err != nil {
				continue
			}
			err = chatBlock(tx, userId, int32(blockeeUserId), meta.Timestamp)
		case schema.RPCMethodChatUnblock:
			var params schema.ChatUnblockRPCParams
			err = json.Unmarshal(rawRpc.Params, &params)
			if err != nil {
				continue
			}
			unblockedUserId, err := misc.DecodeHashId(params.UserID)
			if err != nil {
				continue
			}
			err = chatUnblock(tx, userId, int32(unblockedUserId))
		default:
			logger.Warn("no handler for ", rawRpc.Method)
		}

		err = tx.Commit()
		if err != nil {
			continue
		} else {
			break
		}
	}

}
