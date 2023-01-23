package rpcz

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strconv"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/jetstream"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
	"github.com/nats-io/nats.go"
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
			// validate chat members are not a <blocker, blockee> pair
			err = validateNotBlocked(q, int32(user1), int32(user2))
			if err != nil {
				return err
			}

			// validate receiver permits chats from sender
			receiver := int32(user1)
			if receiver == userId {
				receiver = int32(user2)
			}
			err = validatePermissions(q, userId, receiver)
			if err != nil {
				return err
			}
		} else {
			// validate chat has 2 members
			return errors.New("Chat must have 2 members")
		}

		// validate does not exceed new chat rate limit for any invited users
		var users []int32
		for _, invite := range params.Invites {
			userId, err := misc.DecodeHashId(invite.UserID)
			if err != nil {
				return err
			}
			users = append(users, int32(userId))
		}
		err = validateNewChatRateLimit(q, users)
		if err != nil {
			return err
		}

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

		chatMembers, err := queries.ChatMembers(q, context.Background(), params.ChatID)
		// 1-1 DMs
		if len(chatMembers) == 2 {
			// validate chat members are not a <blocker, blockee> pair
			err = validateNotBlocked(q, chatMembers[0].UserID, chatMembers[1].UserID)
			if err != nil {
				return err
			}

			// validate receiver permits messages from sender
			receiver := chatMembers[0].UserID
			if receiver == userId {
				receiver = chatMembers[1].UserID
			}

			err = validatePermissions(q, userId, receiver)
			if err != nil {
				return err
			}
		}

		// validate does not exceed new message rate limit
		err = validateNewMessageRateLimit(q, userId, params.ChatID)
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

func validatePermissions(q db.Queryable, sender int32, receiver int32) error {
	permissionFailure := errors.New("Not permitted to send messages to this user")
	permits, err := queries.GetChatPermissions(q, context.Background(), receiver)
	if err != nil {
		if err != sql.ErrNoRows {
			return err
		}
		// No permissions set; default to 'all'
		return nil
	}

	if permits == schema.None {
		return permissionFailure
	} else if permits == schema.Followees {
		// Only allow messages from users that receiver follows
		count, err := queries.CountFollows(q, context.Background(), queries.CountFollowsParams{
			FollowerUserID: receiver,
			FolloweeUserID: sender,
		})
		if err != nil {
			return err
		}
		if count == 0 {
			return permissionFailure
		}
	} else if permits == schema.Tippers {
		// Only allow messages from users that have tipped receiver
		count, err := queries.CountTips(q, context.Background(), queries.CountTipsParams{
			SenderUserID:   sender,
			ReceiverUserID: receiver,
		})
		if err != nil {
			return err
		}
		if count == 0 {
			return permissionFailure
		}
	}
	return nil
}

func getRateLimit(kv nats.KeyValue, rule string, fallback int) int {
	got, err := kv.Get(rule)
	if err != nil {
		return fallback
	}
	limit, err := strconv.Atoi(string(got.Value()))
	if err != nil {
		config.Logger.Debug("unable to convert rate limit from KV to int, using default value", "error", err, "rule", rule)
		return fallback
	}
	return limit
}

// Calculate cursor from rate limit timeframe
func calculateRateLimitCursor(timeframe int) time.Time {
	return time.Now().UTC().Add(-time.Hour * time.Duration(timeframe))
}

func validateNewChatRateLimit(q db.Queryable, users []int32) error {
	var err error

	timeframe := config.DefaultRateLimitRules[config.RateLimitTimeframeHours]
	// Max num of new chats permitted per timeframe
	maxNumChats := config.DefaultRateLimitRules[config.RateLimitMaxNumNewChats]

	// Retrieve rate limit rules KV
	jsc := jetstream.GetJetstreamContext()
	if kv, err := jsc.KeyValue(config.RateLimitRulesBucketName); err == nil {
		timeframe = getRateLimit(kv, config.RateLimitTimeframeHours, timeframe)
		maxNumChats = getRateLimit(kv, config.RateLimitMaxNumNewChats, maxNumChats)
	} else {
		config.Logger.Debug("unable to retrive rate limit KV, using default values", "error", err)
	}

	cursor := calculateRateLimitCursor(timeframe)
	numChats, err := queries.MaxNumNewChatsSince(q, context.Background(), queries.MaxNumNewChatsSinceParams{
		Users:  users,
		Cursor: cursor,
	})
	if err != nil {
		return err
	}
	if numChats >= maxNumChats {
		config.Logger.Info("hit rate limit (new chats)", "users", users)
		return errors.New("An invited user has exceeded the maximum number of new chats")
	}

	return nil
}

func validateNewMessageRateLimit(q db.Queryable, userId int32, chatId string) error {
	var err error

	timeframe := config.DefaultRateLimitRules[config.RateLimitTimeframeHours]
	// Max number of new messages permitted per timeframe
	maxNumMessages := config.DefaultRateLimitRules[config.RateLimitMaxNumMessages]
	// Max number of new messages permitted per recipient (chat) per timeframe
	maxNumMessagesPerRecipient := config.DefaultRateLimitRules[config.RateLimitMaxNumMessagesPerRecipient]

	// Retrieve rate limit rules KV
	jsc := jetstream.GetJetstreamContext()
	if kv, err := jsc.KeyValue(config.RateLimitRulesBucketName); err == nil {
		timeframe = getRateLimit(kv, config.RateLimitTimeframeHours, timeframe)
		maxNumMessages = getRateLimit(kv, config.RateLimitMaxNumMessages, maxNumMessages)
		maxNumMessagesPerRecipient = getRateLimit(kv, config.RateLimitMaxNumMessagesPerRecipient, maxNumMessagesPerRecipient)
	} else {
		config.Logger.Debug("unable to retrive rate limit KV, using default values", "error", err)
	}

	// Cursor for rate limit timeframe
	cursor := calculateRateLimitCursor(timeframe)

	counts, err := queries.NumChatMessagesSince(q, context.Background(), queries.NumChatMessagesSinceParams{
		UserID: userId,
		Cursor: cursor,
	})
	if err != nil {
		return err
	}
	if counts.TotalCount >= maxNumMessages || counts.MaxCountPerChat >= maxNumMessagesPerRecipient {
		if counts.TotalCount >= maxNumMessages {
			config.Logger.Info("hit rate limit (total count new messages)", "user", userId, "chat", chatId)
		}
		if counts.MaxCountPerChat >= maxNumMessagesPerRecipient {
			config.Logger.Info("hit rate limit (new messages per recipient)", "user", userId, "chat", chatId)
		}
		return errors.New("User has exceeded the maximum number of new messages")
	}

	return nil
}
