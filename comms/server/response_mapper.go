package server

import (
	"time"

	"comms.audius.co/db"
	"comms.audius.co/db/queries"
	"comms.audius.co/misc"
	"comms.audius.co/schema"
)

func Map[T, U any](ts []T, f func(T) U) []U {
	us := make([]U, len(ts))
	for i := range ts {
		us[i] = f(ts[i])
	}
	return us
}

func ToChatMemberResponse(member db.ChatMember) schema.ChatMember {
	encodedUserId, _ := misc.EncodeHashId(int(member.UserID))
	memberData := schema.ChatMember{
		UserID: encodedUserId,
	}
	return memberData
}

func ToChatResponse(chat queries.UserChatRow, members []db.ChatMember) schema.UserChat {
	chatData := schema.UserChat{
		ChatID:             chat.ChatID,
		LastMessageAt:      chat.LastMessageAt.Format(time.RFC3339Nano),
		InviteCode:         chat.InviteCode,
		LastReadAt:         chat.LastActiveAt.Time.Format(time.RFC3339Nano),
		UnreadMessageCount: float64(chat.UnreadCount),
		ChatMembers:        Map(members, ToChatMemberResponse),
	}
	if chat.ClearedHistoryAt.Valid {
		chatData.ClearedHistoryAt = chat.ClearedHistoryAt.Time.Format(time.RFC3339Nano)
	}
	return chatData
}

func ToSummaryResponse(cursor string, summary queries.SummaryRow) schema.Summary {
	responseSummary := schema.Summary{
		TotalCount:     float64(summary.TotalCount),
		RemainingCount: float64(summary.RemainingCount),
		NextCursor:     cursor,
	}
	return responseSummary
}

func ToReactionsResponse(reactions queries.ReactionsSlice) []schema.Reaction {
	var reactionsData []schema.Reaction
	for _, reaction := range reactions {
		encodedSenderId, _ := misc.EncodeHashId(int(reaction.UserID))
		reactionsData = append(reactionsData, schema.Reaction{
			CreatedAt: reaction.CreatedAt.Format(time.RFC3339Nano),
			Reaction:  reaction.Reaction,
			UserID:    encodedSenderId,
		})
	}
	return reactionsData
}

func ToMessageResponse(message queries.ChatMessageAndReactionsRow) schema.ChatMessage {
	encodedSenderId, _ := misc.EncodeHashId(int(message.UserID))
	messageData := schema.ChatMessage{
		MessageID:    message.MessageID,
		SenderUserID: encodedSenderId,
		Message:      message.Ciphertext,
		CreatedAt:    message.CreatedAt.Format(time.RFC3339Nano),
		Reactions:    ToReactionsResponse(message.Reactions),
	}
	return messageData
}
