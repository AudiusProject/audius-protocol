package rpcz

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"comms.audius.co/config"
	"comms.audius.co/db"
	"comms.audius.co/db/queries"
	"comms.audius.co/misc"
	"comms.audius.co/schema"
	"github.com/jmoiron/sqlx"
)

type validatorFunc func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error

func Validate(userId int32, rawRpc schema.RawRPC) error {

	validator := Validators[rawRpc.Method]
	if validator == nil {
		config.Logger.Debug("no validator for " + rawRpc.Method)
		return nil
	}

	return validator(nil, userId, rawRpc)
}

var Validators = map[string]validatorFunc{
	// Mutations
	string(schema.RPCMethodChatCreate): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		// validate rpc.params valid
		var params schema.ChatCreateRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		// validate chatId does not already exist
		query := "select count(*) from chat where chat_id = $1;"
		var chatCount int
		if tx != nil {
			err = tx.Get(&chatCount, query, params.ChatID)
		} else {
			err = db.Conn.Get(&chatCount, query, params.ChatID)
		}
		if err != nil {
			return err
		}
		if chatCount != 0 {
			return errors.New("Chat already exists")
		}

		// for 1-1 DMs: validate chat members are not a <blocker, blockee> pair
		var q db.Queryable
		q = db.Conn
		if tx != nil {
			q = tx
		}

		if len(params.Invites) == 2 {
			user1, err := misc.DecodeHashId(params.Invites[0].UserID)
			if err != nil {
				return err
			}
			user2, err := misc.DecodeHashId(params.Invites[1].UserID)
			if err != nil {
				return err
			}
			err = validateNotBlocked(q, int32(user1), int32(user2))
			if err != nil {
				return err
			}
		}

		// TODO check receiving invitee's permission settings

		return nil
	},
	string(schema.RPCMethodChatDelete): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		var q db.Queryable
		q = db.Conn
		if tx != nil {
			q = tx
		}

		// validate rpc.params valid
		var params schema.ChatDeleteRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		// validate userId is a member of chatId in good standing
		_, err = validateChatMembership(q, userId, params.ChatID)
		if err != nil {
			return err
		}

		return nil
	},
	string(schema.RPCMethodChatMessage): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		var q db.Queryable
		q = db.Conn
		if tx != nil {
			q = tx
		}

		// validate rpc.params valid
		var params schema.ChatMessageRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		// validate userId is a member of chatId in good standing
		_, err = validateChatMembership(q, userId, params.ChatID)
		if err != nil {
			return err
		}

		// TODO check receiver's permission settings

		// for 1-1 DMs: validate chat members are not a <blocker, blockee> pair
		chatMembers, err := queries.ChatMembers(q, context.Background(), params.ChatID)
		if len(chatMembers) == 2 {
			err = validateNotBlocked(q, chatMembers[0].UserID, chatMembers[1].UserID)
			if err != nil {
				return err
			}
		}

		err = validateNewMessageRateLimitNotExceeded(q, userId, params.ChatID)
		if err != nil {
			return err
		}

		return nil
	},
	string(schema.RPCMethodChatReact): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		var q db.Queryable
		q = db.Conn
		if tx != nil {
			q = tx
		}

		// validate rpc.params valid
		var params schema.ChatReactRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		// validate userId is a member of chatId in good standing
		_, err = validateChatMembership(q, userId, params.ChatID)
		if err != nil {
			return err
		}

		// validate message exists in chat
		_, err = queries.ChatMessage(q, context.Background(), queries.ChatMessageParams{
			ChatID:    params.ChatID,
			MessageID: params.MessageID,
		})
		if err != nil {
			return err
		}

		return nil
	},
	string(schema.RPCMethodChatRead): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		var q db.Queryable
		q = db.Conn
		if tx != nil {
			q = tx
		}

		// validate rpc.params valid
		var params schema.ChatReadRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		// validate userId is a member of chatId in good standing
		_, err = validateChatMembership(q, userId, params.ChatID)
		if err != nil {
			return err
		}

		return nil
	},
	string(schema.RPCMethodChatPermit): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		// validate rpc.params valid
		var params schema.ChatPermitRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		return nil
	},
	string(schema.RPCMethodChatBlock): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		// validate rpc.params valid
		var params schema.ChatBlockRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		return nil
	},
	string(schema.RPCMethodChatUnblock): func(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
		var q db.Queryable
		q = db.Conn
		if tx != nil {
			q = tx
		}

		// validate rpc.params valid
		var params schema.ChatBlockRPCParams
		err := json.Unmarshal(rpc.Params, &params)
		if err != nil {
			return err
		}

		// validate that params.UserID is currently blocked by userId
		blockeeUserId, err := misc.DecodeHashId(params.UserID)
		if err != nil {
			return err
		}
		_, err = queries.ChatBlock(q, context.Background(), queries.ChatBlockParams{
			BlockerUserID: int32(userId),
			BlockeeUserID: int32(blockeeUserId),
		})
		if err != nil {
			return err
		}

		return nil
	},
}

// Helpers
func validateChatMembership(q db.Queryable, userId int32, chatId string) (db.ChatMember, error) {
	member, err := queries.ChatMembership(q, context.Background(), queries.ChatMembershipParams{
		UserID: userId,
		ChatID: chatId,
	})
	return member, err
}

func validateNotBlocked(q db.Queryable, user1 int32, user2 int32) error {
	blockedCount, err := queries.CountChatBlocks(q, context.Background(), queries.CountChatBlocksParams{
		User1: user1,
		User2: user2,
	})
	if err != nil {
		return err
	}
	if blockedCount > 0 {
		return errors.New("Cannot chat with a user you have blocked or user who has blocked you")
	}

	return nil
}

func validateNewMessageRateLimitNotExceeded(q db.Queryable, userId int32, chatId string) error {
	// Retrieve rate limit rules KV
	kv, err := JetstreamClient.KeyValue(config.RateLimitRulesBucketName)
	if err != nil {
		return err
	}
	// Calculate cursor from rate limit timeframe
	got, err := kv.Get(config.RateLimitTimeframeHours)
	if err != nil {
		return err
	}
	timeframe, err := strconv.Atoi(string(got.Value()))
	if err != nil {
		return err
	}
	cursor := time.Now().UTC().Add(-time.Hour * time.Duration(timeframe))

	// Max number of new messages permitted per timeframe
	got, err = kv.Get(config.RateLimitMaxNumMessages)
	if err != nil {
		return err
	}
	maxNumMessages, err := strconv.Atoi(string(got.Value()))
	if err != nil {
		return err
	}
	numMessages, err := queries.NumChatMessagesSince(q, context.Background(), queries.NumChatMessagesSinceParams{
		UserID: userId,
		Cursor: cursor,
	})
	if err != nil {
		return err
	}
	fmt.Println("user:", userId)
	fmt.Println("cursor:", cursor)
	fmt.Println("time now:", time.Now().UTC())
	fmt.Println("numMessages:", numMessages)
	fmt.Println("maxNumMessages:", maxNumMessages)
	if numMessages == maxNumMessages {
		return errors.New("User has exceeded the maximum number of new messages")
	}

	// Max number of new messages permitted per recipient (chat) per timeframe
	got, err = kv.Get(config.RateLimitMaxNumMessagesPerRecipient)
	if err != nil {
		return err
	}
	maxNumMessagesPerRecipient, err := strconv.Atoi(string(got.Value()))
	if err != nil {
		return err
	}
	numMessagesPerRecipient, err := queries.NumChatMessagesPerRecipientSince(q, context.Background(), queries.NumChatMessagesPerRecipientSinceParams{
		UserID: userId,
		ChatID: chatId,
		Cursor: cursor,
	})
	if err != nil {
		return err
	}
	fmt.Println("numMessagesPerRecipient:", numMessagesPerRecipient)
	fmt.Println("maxNumMessagesPerRecipient:", maxNumMessagesPerRecipient)
	if numMessagesPerRecipient == maxNumMessagesPerRecipient {
		return errors.New("User has exceeded the maximum number of new messages per recipient")
	}

	return nil
}
