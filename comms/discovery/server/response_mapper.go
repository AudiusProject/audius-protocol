package server

import (
	"sort"
	"strings"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/schema"
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
	var encodedContentId *string
	if chat.AudienceContentID.Valid {
		id, _ := misc.EncodeHashId(int(chat.AudienceContentID.Int32))
		encodedContentId = &id
	}

	var audienceContentType *string
	if chat.AudienceContentType.Valid {
		audienceContentType = &chat.AudienceContentType.String
	}

	chatData := schema.UserChat{
		ChatID:                 chat.ChatID,
		LastMessageAt:          chat.LastMessageAt.Format(time.RFC3339Nano),
		InviteCode:             chat.InviteCode,
		UnreadMessageCount:     float64(chat.UnreadCount),
		ChatMembers:            Map(members, ToChatMemberResponse),
		LastMessageIsPlaintext: chat.LastMessageIsPlaintext,
		IsBlast:                chat.IsBlast,
		Audience:               schema.ChatBlastAudience(chat.Audience.String),
		AudienceContentType:    audienceContentType,
		AudienceContentID:      encodedContentId,
	}
	chatData.RecheckPermissions = rpcz.RecheckPermissionsRequired(chat.LastMessageAt, members)
	if chat.LastMessage.Valid {
		chatData.LastMessage = chat.LastMessage.String
	}
	if chat.LastActiveAt.Valid {
		chatData.LastReadAt = chat.LastActiveAt.Time.Format(time.RFC3339Nano)
	}
	if chat.ClearedHistoryAt.Valid {
		chatData.ClearedHistoryAt = chat.ClearedHistoryAt.Time.Format(time.RFC3339Nano)
	}
	return chatData
}

func ToSummaryResponse(prevCursor string, nextCursor string, summary queries.SummaryRow) schema.Summary {
	responseSummary := schema.Summary{
		TotalCount: float64(summary.TotalCount),
		PrevCount:  float64(summary.BeforeCount),
		PrevCursor: prevCursor,
		NextCount:  float64(summary.AfterCount),
		NextCursor: nextCursor,
	}
	return responseSummary
}

func ToReactionsResponse(reactions queries.Reactions) []schema.Reaction {
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
		IsPlaintext:  message.IsPlaintext,
		CreatedAt:    message.CreatedAt.Format(time.RFC3339Nano),
		Reactions:    ToReactionsResponse(message.Reactions),
	}
	return messageData
}

func ToChatPermissionsResponse(validatedPermissions map[string]queries.ChatPermissionsRow) []schema.ValidatedChatPermissions {
	var chatPermissions []schema.ValidatedChatPermissions
	for encodedId, row := range validatedPermissions {
		var permitList []schema.ChatPermission

		permitSplit := strings.Split(row.Permits, ",")
		sort.Strings(permitSplit)
		for _, v := range permitSplit {
			permitList = append(permitList, schema.ChatPermission(v))
		}
		if len(permitList) == 0 {
			continue
		}
		chatPermissions = append(chatPermissions, schema.ValidatedChatPermissions{
			UserID:                   encodedId,
			Permits:                  permitList[0],
			PermitList:               permitList,
			CurrentUserHasPermission: row.CurrentUserHasPermission,
		})
	}
	sort.Slice(chatPermissions, func(i, j int) bool {
		return chatPermissions[i].UserID < chatPermissions[j].UserID
	})
	return chatPermissions
}
