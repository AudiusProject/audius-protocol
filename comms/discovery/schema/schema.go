package schema

type ValidateCanChatRPC struct {
	Method ValidateCanChatRPCMethod `json:"method"`
	Params ValidateCanChatRPCParams `json:"params"`
}

type ValidateCanChatRPCParams struct {
	ReceiverUserIDS []string `json:"receiver_user_ids"`
}

type ChatBlastRPC struct {
	Method ChatBlastRPCMethod `json:"method"`
	Params ChatBlastRPCParams `json:"params"`
}

type ChatBlastRPCParams struct {
	Audience            ChatBlastAudience    `json:"audience"`
	AudienceContentID   *string              `json:"audience_content_id,omitempty"`
	AudienceContentType *AudienceContentType `json:"audience_content_type,omitempty"`
	BlastID             string               `json:"blast_id"`
	Message             string               `json:"message"`
}

type ChatCreateRPC struct {
	Method ChatCreateRPCMethod `json:"method"`
	Params ChatCreateRPCParams `json:"params"`
}

type ChatCreateRPCParams struct {
	ChatID  string         `json:"chat_id"`
	Invites []PurpleInvite `json:"invites"`
}

type PurpleInvite struct {
	InviteCode string `json:"invite_code"`
	UserID     string `json:"user_id"`
}

type ChatDeleteRPC struct {
	Method ChatDeleteRPCMethod `json:"method"`
	Params ChatDeleteRPCParams `json:"params"`
}

type ChatDeleteRPCParams struct {
	ChatID string `json:"chat_id"`
}

type ChatInviteRPC struct {
	Method ChatInviteRPCMethod `json:"method"`
	Params ChatInviteRPCParams `json:"params"`
}

type ChatInviteRPCParams struct {
	ChatID  string         `json:"chat_id"`
	Invites []FluffyInvite `json:"invites"`
}

type FluffyInvite struct {
	InviteCode string `json:"invite_code"`
	UserID     string `json:"user_id"`
}

type ChatMessageRPC struct {
	Method ChatMessageRPCMethod `json:"method"`
	Params ChatMessageRPCParams `json:"params"`
}

type ChatMessageRPCParams struct {
	ChatID          string  `json:"chat_id"`
	IsPlaintext     *bool   `json:"is_plaintext,omitempty"`
	Message         string  `json:"message"`
	MessageID       string  `json:"message_id"`
	ParentMessageID *string `json:"parent_message_id,omitempty"`
}

type ChatReactRPC struct {
	Method ChatReactRPCMethod `json:"method"`
	Params ChatReactRPCParams `json:"params"`
}

type ChatReactRPCParams struct {
	ChatID    string  `json:"chat_id"`
	MessageID string  `json:"message_id"`
	Reaction  *string `json:"reaction"`
}

type ChatReadRPC struct {
	Method ChatReadRPCMethod `json:"method"`
	Params ChatReadRPCParams `json:"params"`
}

type ChatReadRPCParams struct {
	ChatID string `json:"chat_id"`
}

type ChatBlockRPC struct {
	Method ChatBlockRPCMethod `json:"method"`
	Params ChatBlockRPCParams `json:"params"`
}

type ChatBlockRPCParams struct {
	UserID string `json:"user_id"`
}

type ChatUnblockRPC struct {
	Method ChatUnblockRPCMethod `json:"method"`
	Params ChatUnblockRPCParams `json:"params"`
}

type ChatUnblockRPCParams struct {
	UserID string `json:"user_id"`
}

type ChatPermitRPC struct {
	Method ChatPermitRPCMethod `json:"method"`
	Params ChatPermitRPCParams `json:"params"`
}

type ChatPermitRPCParams struct {
	Allow      *bool            `json:"allow,omitempty"`
	Permit     ChatPermission   `json:"permit"`
	PermitList []ChatPermission `json:"permit_list"`
}

type RPCPayloadRequest struct {
	Method RPCMethod               `json:"method"`
	Params RPCPayloadRequestParams `json:"params"`
}

type RPCPayloadRequestParams struct {
	ReceiverUserIDS     []string             `json:"receiver_user_ids,omitempty"`
	Audience            *ChatBlastAudience   `json:"audience,omitempty"`
	AudienceContentID   *string              `json:"audience_content_id,omitempty"`
	AudienceContentType *AudienceContentType `json:"audience_content_type,omitempty"`
	BlastID             *string              `json:"blast_id,omitempty"`
	Message             *string              `json:"message,omitempty"`
	ChatID              *string              `json:"chat_id,omitempty"`
	Invites             []TentacledInvite    `json:"invites,omitempty"`
	IsPlaintext         *bool                `json:"is_plaintext,omitempty"`
	MessageID           *string              `json:"message_id,omitempty"`
	ParentMessageID     *string              `json:"parent_message_id,omitempty"`
	Reaction            *string              `json:"reaction"`
	UserID              *string              `json:"user_id,omitempty"`
	Allow               *bool                `json:"allow,omitempty"`
	Permit              *ChatPermission      `json:"permit,omitempty"`
	PermitList          []ChatPermission     `json:"permit_list,omitempty"`
}

type TentacledInvite struct {
	InviteCode string `json:"invite_code"`
	UserID     string `json:"user_id"`
}

type UserChat struct {
	Audience               ChatBlastAudience `json:"audience"`
	AudienceContentID      *string           `json:"audience_content_id,omitempty"`
	AudienceContentType    *string           `json:"audience_content_type,omitempty"`
	ChatID                 string            `json:"chat_id"`
	ChatMembers            []ChatMember      `json:"chat_members"`
	ClearedHistoryAt       string            `json:"cleared_history_at"`
	InviteCode             string            `json:"invite_code"`
	IsBlast                bool              `json:"is_blast"`
	LastMessage            string            `json:"last_message"`
	LastMessageAt          string            `json:"last_message_at"`
	LastMessageIsPlaintext bool              `json:"last_message_is_plaintext"`
	LastReadAt             string            `json:"last_read_at"`
	RecheckPermissions     bool              `json:"recheck_permissions"`
	UnreadMessageCount     float64           `json:"unread_message_count"`
}

type ChatMember struct {
	UserID string `json:"user_id"`
}

type ChatMessageReaction struct {
	CreatedAt string `json:"created_at"`
	Reaction  string `json:"reaction"`
	UserID    string `json:"user_id"`
}

type ChatMessageNullableReaction struct {
	CreatedAt string  `json:"created_at"`
	Reaction  *string `json:"reaction"`
	UserID    string  `json:"user_id"`
}

type ChatMessage struct {
	CreatedAt    string     `json:"created_at"`
	IsPlaintext  bool       `json:"is_plaintext"`
	Message      string     `json:"message"`
	MessageID    string     `json:"message_id"`
	Reactions    []Reaction `json:"reactions"`
	SenderUserID string     `json:"sender_user_id"`
}

type Reaction struct {
	CreatedAt string `json:"created_at"`
	Reaction  string `json:"reaction"`
	UserID    string `json:"user_id"`
}

type ChatInvite struct {
	InviteCode string `json:"invite_code"`
	UserID     string `json:"user_id"`
}

type ChatBlastBase struct {
	Audience            ChatBlastAudience    `json:"audience"`
	AudienceContentID   *string              `json:"audience_content_id,omitempty"`
	AudienceContentType *AudienceContentType `json:"audience_content_type,omitempty"`
	ChatID              string               `json:"chat_id"`
}

type UpgradableChatBlast struct {
	Audience            ChatBlastAudience    `json:"audience"`
	AudienceContentID   *string              `json:"audience_content_id,omitempty"`
	AudienceContentType *AudienceContentType `json:"audience_content_type,omitempty"`
	BlastID             string               `json:"blast_id"`
	ChatID              string               `json:"chat_id"`
	CreatedAt           string               `json:"created_at"`
	FromUserID          float64              `json:"from_user_id"`
	PendingChatID       string               `json:"pending_chat_id"`
	Plaintext           string               `json:"plaintext"`
}

type ChatBlast struct {
	Audience            ChatBlastAudience    `json:"audience"`
	AudienceContentID   *string              `json:"audience_content_id,omitempty"`
	AudienceContentType *AudienceContentType `json:"audience_content_type,omitempty"`
	ChatID              string               `json:"chat_id"`
	IsBlast             bool                 `json:"is_blast"`
	LastMessageAt       string               `json:"last_message_at"`
}

type ValidatedChatPermissions struct {
	CurrentUserHasPermission bool             `json:"current_user_has_permission"`
	PermitList               []ChatPermission `json:"permit_list"`
	Permits                  ChatPermission   `json:"permits"`
	UserID                   string           `json:"user_id"`
}

type CommsResponse struct {
	Data    interface{} `json:"data"`
	Health  Health      `json:"health"`
	Summary *Summary    `json:"summary,omitempty"`
}

type Health struct {
	IsHealthy bool `json:"is_healthy"`
}

type Summary struct {
	NextCount  float64 `json:"next_count"`
	NextCursor string  `json:"next_cursor"`
	PrevCount  float64 `json:"prev_count"`
	PrevCursor string  `json:"prev_cursor"`
	TotalCount float64 `json:"total_count"`
}

type ChatWebsocketEventData struct {
	Metadata Metadata   `json:"metadata"`
	RPC      RPCPayload `json:"rpc"`
}

type Metadata struct {
	ReceiverUserID string `json:"receiverUserId"`
	SenderUserID   string `json:"senderUserId"`
	Timestamp      string `json:"timestamp"`
	UserID         string `json:"userId"`
}

type RPCPayload struct {
	CurrentUserID string           `json:"current_user_id"`
	Method        RPCMethod        `json:"method"`
	Params        RPCPayloadParams `json:"params"`
	Timestamp     float64          `json:"timestamp"`
}

type RPCPayloadParams struct {
	ReceiverUserIDS     []string             `json:"receiver_user_ids,omitempty"`
	Audience            *ChatBlastAudience   `json:"audience,omitempty"`
	AudienceContentID   *string              `json:"audience_content_id,omitempty"`
	AudienceContentType *AudienceContentType `json:"audience_content_type,omitempty"`
	BlastID             *string              `json:"blast_id,omitempty"`
	Message             *string              `json:"message,omitempty"`
	ChatID              *string              `json:"chat_id,omitempty"`
	Invites             []StickyInvite       `json:"invites,omitempty"`
	IsPlaintext         *bool                `json:"is_plaintext,omitempty"`
	MessageID           *string              `json:"message_id,omitempty"`
	ParentMessageID     *string              `json:"parent_message_id,omitempty"`
	Reaction            *string              `json:"reaction"`
	UserID              *string              `json:"user_id,omitempty"`
	Allow               *bool                `json:"allow,omitempty"`
	Permit              *ChatPermission      `json:"permit,omitempty"`
	PermitList          []ChatPermission     `json:"permit_list,omitempty"`
}

type StickyInvite struct {
	InviteCode string `json:"invite_code"`
	UserID     string `json:"user_id"`
}

type ValidateCanChatRPCMethod string

const (
	MethodUserValidateCanChat ValidateCanChatRPCMethod = "user.validate_can_chat"
)

type ChatBlastRPCMethod string

const (
	MethodChatBlast ChatBlastRPCMethod = "chat.blast"
)

type ChatBlastAudience string

const (
	CustomerAudience ChatBlastAudience = "customer_audience"
	FollowerAudience ChatBlastAudience = "follower_audience"
	RemixerAudience  ChatBlastAudience = "remixer_audience"
	TipperAudience   ChatBlastAudience = "tipper_audience"
)

type AudienceContentType string

const (
	Album AudienceContentType = "album"
	Track AudienceContentType = "track"
)

type ChatCreateRPCMethod string

const (
	MethodChatCreate ChatCreateRPCMethod = "chat.create"
)

type ChatDeleteRPCMethod string

const (
	MethodChatDelete ChatDeleteRPCMethod = "chat.delete"
)

type ChatInviteRPCMethod string

const (
	MethodChatInvite ChatInviteRPCMethod = "chat.invite"
)

type ChatMessageRPCMethod string

const (
	MethodChatMessage ChatMessageRPCMethod = "chat.message"
)

type ChatReactRPCMethod string

const (
	MethodChatReact ChatReactRPCMethod = "chat.react"
)

type ChatReadRPCMethod string

const (
	MethodChatRead ChatReadRPCMethod = "chat.read"
)

type ChatBlockRPCMethod string

const (
	MethodChatBlock ChatBlockRPCMethod = "chat.block"
)

type ChatUnblockRPCMethod string

const (
	MethodChatUnblock ChatUnblockRPCMethod = "chat.unblock"
)

type ChatPermitRPCMethod string

const (
	MethodChatPermit ChatPermitRPCMethod = "chat.permit"
)

// Defines who the user allows to message them
type ChatPermission string

const (
	All       ChatPermission = "all"
	Followees ChatPermission = "followees"
	Followers ChatPermission = "followers"
	None      ChatPermission = "none"
	Tippees   ChatPermission = "tippees"
	Tippers   ChatPermission = "tippers"
	Verified  ChatPermission = "verified"
)

type RPCMethod string

const (
	RPCMethodChatBlast           RPCMethod = "chat.blast"
	RPCMethodChatBlock           RPCMethod = "chat.block"
	RPCMethodChatCreate          RPCMethod = "chat.create"
	RPCMethodChatDelete          RPCMethod = "chat.delete"
	RPCMethodChatInvite          RPCMethod = "chat.invite"
	RPCMethodChatMessage         RPCMethod = "chat.message"
	RPCMethodChatPermit          RPCMethod = "chat.permit"
	RPCMethodChatReact           RPCMethod = "chat.react"
	RPCMethodChatRead            RPCMethod = "chat.read"
	RPCMethodChatUnblock         RPCMethod = "chat.unblock"
	RPCMethodUserValidateCanChat RPCMethod = "user.validate_can_chat"
)
