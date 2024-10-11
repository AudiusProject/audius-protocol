package rpcz

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/jmoiron/sqlx"
	"golang.org/x/exp/slog"
)

////////////////////

var (
	ErrMessageRateLimitExceeded = errors.New("user has exceeded the maximum number of new messages")
)

type Validator struct {
	db      *sqlx.DB
	limiter *RateLimiter
}

func (vtor *Validator) Validate(userId int32, rawRpc schema.RawRPC) error {
	methodName := schema.RPCMethod(rawRpc.Method)
	var noTx *sqlx.Tx = nil

	// actually skip timestamp check for now...
	// POST endpoint will check for recency...
	// but peer servers could get it later...
	// and we don't want to skip message that's over a min old.

	// Always check timestamp
	// if time.Now().UnixMilli()-rawRpc.Timestamp > sharedConfig.SignatureTimeToLiveMs {
	// 	return errors.New("Invalid timestamp")
	// }

	// banned?
	if vtor.isBanned(noTx, userId) {
		return fmt.Errorf("user_id %d is banned from chat", userId)
	}

	switch methodName {
	case schema.RPCMethodChatCreate:
		return vtor.validateChatCreate(noTx, userId, rawRpc)
	case schema.RPCMethodChatDelete:
		return vtor.validateChatDelete(noTx, userId, rawRpc)
	case schema.RPCMethodChatMessage:
		return vtor.validateChatMessage(noTx, userId, rawRpc)
	case schema.RPCMethodChatReact:
		return vtor.validateChatReact(noTx, userId, rawRpc)
	case schema.RPCMethodChatRead:
		return vtor.validateChatRead(noTx, userId, rawRpc)
	case schema.RPCMethodChatPermit:
		return vtor.validateChatPermit(noTx, userId, rawRpc)
	case schema.RPCMethodChatBlock:
		return vtor.validateChatBlock(noTx, userId, rawRpc)
	case schema.RPCMethodChatUnblock:
		return vtor.validateChatUnblock(noTx, userId, rawRpc)
	default:
		logger.Debug("no validator for " + rawRpc.Method)
	}

	return nil
}

func (vtor *Validator) isBanned(tx *sqlx.Tx, userId int32) bool {
	q := vtor.getQ(tx)
	isBanned := false
	q.Get(&isBanned, `select count(user_id) = 1 from chat_ban where user_id = $1 and is_banned = true`, userId)
	return isBanned
}

func (vtor *Validator) validateChatCreate(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	q := vtor.getQ(tx)

	// validate rpc.params valid
	var params schema.ChatCreateRPCParams
	err := json.Unmarshal(rpc.Params, &params)
	if err != nil {
		return err
	}

	// validate chatId does not already exist
	query := "select count(*) from chat where chat_id = $1;"
	var chatCount int
	err = q.Get(&chatCount, query, params.ChatID)
	if err != nil {
		return err
	}
	if chatCount != 0 {
		return errors.New("Chat already exists")
	}

	if len(params.Invites) != 2 {
		return errors.New("Chat must have 2 members")
	}

	user1, err := misc.DecodeHashId(params.Invites[0].UserID)
	if err != nil {
		return err
	}
	user2, err := misc.DecodeHashId(params.Invites[1].UserID)
	if err != nil {
		return err
	}

	receiver := int32(user1)
	if receiver == userId {
		receiver = int32(user2)
	}

	// if recipient is creating a chat from a blast
	// we ignore the receiver's inbox settings
	// because receiver has sent a blast to this user.
	{
		blasts, _ := queries.GetNewBlasts(q, context.Background(), queries.ChatMembershipParams{
			UserID: userId,
		})
		for _, b := range blasts {
			if b.FromUserID == receiver {
				return nil
			}
		}
	}

	// validate receiver permits chats from sender
	err = validatePermissions(q, userId, receiver)
	if err != nil {
		return err
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
	err = vtor.validateNewChatRateLimit(q, users)
	if err != nil {
		return err
	}

	return nil
}

func (vtor *Validator) validateChatMessage(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	q := vtor.getQ(tx)

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

	// validate not blocked and can chat according to receiver's inbox permission settings
	err = validatePermittedToMessage(q, userId, params.ChatID)
	if err != nil {
		return err
	}

	// validate does not exceed new message rate limit
	err = vtor.validateNewMessageRateLimit(q, userId, params.ChatID)
	if err != nil {
		return err
	}

	return nil
}

func (vtor *Validator) validateChatReact(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	q := vtor.getQ(tx)

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

	// validate not blocked and can chat according to receiver's inbox permission settings
	err = validatePermittedToMessage(q, userId, params.ChatID)
	if err != nil {
		return err
	}

	return nil
}

func (vtor *Validator) validateChatRead(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	q := vtor.getQ(tx)

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
}

func (vtor *Validator) validateChatPermit(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	// validate rpc.params valid
	var params schema.ChatPermitRPCParams
	err := json.Unmarshal(rpc.Params, &params)
	if err != nil {
		return err
	}

	return nil
}

func (vtor *Validator) validateChatBlock(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	// validate rpc.params valid
	var params schema.ChatBlockRPCParams
	err := json.Unmarshal(rpc.Params, &params)
	if err != nil {
		return err
	}

	return nil
}

func (vtor *Validator) validateChatUnblock(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	q := vtor.getQ(tx)

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
}

func (vtor *Validator) validateChatDelete(tx *sqlx.Tx, userId int32, rpc schema.RawRPC) error {
	q := vtor.getQ(tx)

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
}

// Calculate cursor from rate limit timeframe
func (vtor *Validator) calculateRateLimitCursor(timeframe int) time.Time {
	return time.Now().UTC().Add(-time.Hour * time.Duration(timeframe))
}

func (vtor *Validator) validateNewChatRateLimit(q db.Queryable, users []int32) error {
	var err error

	// rate_limit_seconds

	limiter := vtor.limiter
	timeframe := limiter.Get(config.RateLimitTimeframeHours)

	// Max num of new chats permitted per timeframe
	maxNumChats := limiter.Get(config.RateLimitMaxNumNewChats)

	cursor := vtor.calculateRateLimitCursor(timeframe)
	numChats, err := queries.MaxNumNewChatsSince(q, context.Background(), queries.MaxNumNewChatsSinceParams{
		Users:  users,
		Cursor: cursor,
	})
	if err != nil {
		return err
	}
	if numChats >= maxNumChats {
		logger.Info("hit rate limit (new chats)", "users", users)
		return errors.New("An invited user has exceeded the maximum number of new chats")
	}

	return nil
}

func (vtor *Validator) validateNewMessageRateLimit(q db.Queryable, userId int32, chatId string) error {
	var err error

	// BurstRateLimit
	{
		query := `
		select
			sum(case when created_at > now() - interval '1 second' then 1 else 0 end) as s1,
			sum(case when created_at > now() - interval '10 seconds' then 1 else 0 end) as s10,
			sum(case when created_at > now() - interval '60 seconds' then 1 else 0 end) as s60
		from chat_message
		where user_id = $1
		and created_at > now() - interval '60 seconds';
		`
		var s1, s10, s60 sql.NullInt64
		err = q.QueryRow(query, userId).Scan(&s1, &s10, &s60)
		if err != nil {
			slog.Error("burst rate limit query failed", "err", err)
		}

		// 10 per second in last second
		if s1.Int64 > 10 {
			slog.Warn("message rate limit exceeded", "bucket", "1s", "user_id", userId, "count", s1)
			return ErrMessageRateLimitExceeded

		}

		// 7 per second for last 10 seconds
		if s10.Int64 > 70 {
			slog.Warn("message rate limit exceeded", "bucket", "10s", "user_id", userId, "count", s10)
			return ErrMessageRateLimitExceeded
		}

		// 5 per second for last 60 seconds
		if s60.Int64 > 300 {
			slog.Warn("message rate limit exceeded", "bucket", "60s", "user_id", userId, "count", s60)
			return ErrMessageRateLimitExceeded
		}
	}

	limiter := vtor.limiter
	timeframe := limiter.Get(config.RateLimitTimeframeHours)

	// Max number of new messages permitted per timeframe
	maxNumMessages := limiter.Get(config.RateLimitMaxNumMessages)

	// Max number of new messages permitted per recipient (chat) per timeframe
	maxNumMessagesPerRecipient := limiter.Get(config.RateLimitMaxNumMessagesPerRecipient)

	// Cursor for rate limit timeframe
	cursor := vtor.calculateRateLimitCursor(timeframe)

	counts, err := queries.NumChatMessagesSince(q, context.Background(), queries.NumChatMessagesSinceParams{
		UserID: userId,
		Cursor: cursor,
	})
	if err != nil {
		return err
	}
	if counts.TotalCount >= maxNumMessages || counts.MaxCountPerChat >= maxNumMessagesPerRecipient {
		if counts.TotalCount >= maxNumMessages {
			logger.Info("hit rate limit (total count new messages)", "user", userId, "chat", chatId)
		}
		if counts.MaxCountPerChat >= maxNumMessagesPerRecipient {
			logger.Info("hit rate limit (new messages per recipient)", "user", userId, "chat", chatId)
		}
		return ErrMessageRateLimitExceeded
	}

	return nil
}

// Helpers

func (vtor *Validator) getQ(tx *sqlx.Tx) db.Queryable {
	if tx != nil {
		return tx
	}
	return vtor.db
}

func validateChatMembership(q db.Queryable, userId int32, chatId string) (db.ChatMember, error) {
	member, err := queries.ChatMembership(q, context.Background(), queries.ChatMembershipParams{
		UserID: userId,
		ChatID: chatId,
	})
	return member, err
}

// Recheck chat permissions before sending further messages if a member of the chat
// has cleared their chat history
func RecheckPermissionsRequired(lastMessageAt time.Time, members []db.ChatMember) bool {
	for _, member := range members {
		if member.ClearedHistoryAt.Valid && member.ClearedHistoryAt.Time.After(lastMessageAt) {
			return true
		}
	}
	return false
}

func validatePermissions(q db.Queryable, sender int32, receiver int32) error {
	permissionFailure := errors.New("Not permitted to send messages to this user")

	ok := false
	err := q.Get(&ok, `select chat_allowed($1, $2)`, sender, receiver)
	if err != nil {
		return err
	}
	if !ok {
		return permissionFailure
	}
	return nil

}

func validatePermittedToMessage(q db.Queryable, userId int32, chatId string) error {
	chatMembers, err := queries.ChatMembers(q, context.Background(), chatId)
	if err != nil {
		return err
	}
	if len(chatMembers) != 2 {
		return errors.New("Chat must have 2 members")
	}
	user1 := chatMembers[0].UserID
	user2 := chatMembers[1].UserID

	receiver := int32(user1)
	if receiver == userId {
		receiver = int32(user2)
	}
	err = validatePermissions(q, userId, receiver)
	if err != nil {
		return err
	}

	return nil
}
