package rpcz

import (
	"context"
	"encoding/json"
	"errors"

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
			blockedCount, err := queries.CountChatBlocks(q, context.Background(), queries.CountChatBlocksParams{
				User1: int32(user1),
				User2: int32(user2),
			})
			if err != nil {
				return err
			}
			if blockedCount > 0 {
				return errors.New("Cannot create a chat with a user you have blocked or user who has blocked you")
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
			blockedCount, err := queries.CountChatBlocks(q, context.Background(), queries.CountChatBlocksParams{
				User1: chatMembers[0].UserID,
				User2: chatMembers[1].UserID,
			})
			if err != nil {
				return err
			}
			if blockedCount > 0 {
				return errors.New("Cannot sent messages to users you have blocked or users who have blocked you")
			}
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
