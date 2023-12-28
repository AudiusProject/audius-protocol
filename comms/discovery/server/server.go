package server

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/signing"
	"github.com/Doist/unfurlist"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"golang.org/x/exp/slog"
)

func NewServer(discoveryConfig *config.DiscoveryConfig, proc *rpcz.RPCProcessor) *ChatServer {
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	// Middleware
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())
	e.Use(middleware.Logger())

	s := &ChatServer{
		Echo:   e,
		proc:   proc,
		config: discoveryConfig,
	}

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "comms are UP... but this is /... see /comms")
	})

	g := e.Group("/comms")

	g.GET("", s.getStatus)

	unfurlBlocklist := unfurlist.WithBlocklistPrefixes(
		[]string{
			"http://localhost",
			"http://127",
			"http://10",
			"http://169.254",
			"http://172.16",
			"http://192.168",
			"http://::1",
			"http://fe80::",
		},
	)
	unfurlHeaders := unfurlist.WithExtraHeaders(map[string]string{"User-Agent": "twitterbot"})
	g.GET("/unfurl", echo.WrapHandler(unfurlist.New(unfurlBlocklist, unfurlHeaders)))
	g.GET("/pubkey/:id", s.getPubkey)
	g.GET("/chats", s.getChats)
	g.GET("/chats/ws", s.chatWebsocket)
	g.GET("/chats/:id", s.getChat)
	g.GET("/chats/:id/messages", s.getMessages)
	g.GET("/chats/unread", s.getUnreadChatCount)
	g.POST("/mutate", s.mutate)

	g.GET("/chats/permissions", s.getChatPermissions)
	g.GET("/chats/blockees", s.getChatBlockees)
	g.GET("/chats/blockers", s.getChatBlockers)

	g.GET("/debug/ws", s.debugWs)
	g.GET("/debug/sse", s.debugSse)
	g.GET("/debug/cursors", s.debugCursors)
	g.GET("/debug/failed", s.debugFailed)

	g.GET("/rpc/bulk", s.getRpcBulk, middleware.BasicAuth(s.checkRegisteredNodeBasicAuth))
	g.POST("/rpc/receive", s.postRpcReceive, middleware.BasicAuth(s.checkRegisteredNodeBasicAuth))

	g.GET("/debug/vars", echo.WrapHandler(http.StripPrefix("/comms", http.DefaultServeMux)))
	g.GET("/debug/pprof/*", echo.WrapHandler(http.StripPrefix("/comms", http.DefaultServeMux)))

	return s
}

var (
	logger = slog.Default()
)

type ChatServer struct {
	*echo.Echo
	proc           *rpcz.RPCProcessor
	config         *config.DiscoveryConfig
	websocketError error
}

func (s *ChatServer) getStatus(c echo.Context) error {
	errors := s.proc.SweeperErrors()
	return c.JSON(http.StatusOK, map[string]any{
		"host":                 s.config.MyHost,
		"wallet":               s.config.MyWallet,
		"is_registered_wallet": s.config.IsRegisteredWallet,
		"commit":               vcsRevision,
		"built":                vcsBuildTime,
		"booted":               bootTime,
		"healthy":              s.isHealthy(),
		"errors":               errors,
		"websocket_error":      s.websocketError,
	})
}

func (s *ChatServer) isHealthy() bool {
	if s.config.IsDev || s.config.IsSandbox {
		return true
	}
	return s.config.IsRegisteredWallet && s.websocketError == nil
}

type ValidatedPermission struct {
	Permits                  schema.ChatPermission `json:"permits"`
	CurrentUserHasPermission bool                  `json:"current_user_has_permission"`
}

func (s *ChatServer) mutate(c echo.Context) error {
	payload, wallet, err := readSignedPost(c)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	// unmarshal RPC and call validator
	var rawRpc schema.RawRPC
	err = json.Unmarshal(payload, &rawRpc)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	//
	rpcLog := &schema.RpcLog{
		RelayedBy:  s.config.MyHost,
		RelayedAt:  time.Now(),
		FromWallet: wallet,
		Rpc:        payload,
		Sig:        c.Request().Header.Get(signing.SigHeader),
	}

	userId, err := rpcz.GetRPCCurrentUserID(rpcLog, &rawRpc)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}

	// call validator
	err = s.proc.Validate(userId, rawRpc)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	ok, err := s.proc.ApplyAndPublish(rpcLog)
	if err != nil {
		logger.Warn(string(payload), "wallet", wallet, "err", err)
		return err
	}
	logger.Debug(string(payload), "wallet", wallet, "relay", true)
	return c.JSON(200, ok)
}

func (s *ChatServer) getHealthStatus() schema.Health {
	return schema.Health{
		IsHealthy: s.isHealthy(),
	}
}

func (s *ChatServer) getPubkey(c echo.Context) error {
	id, err := misc.DecodeHashId(c.Param("id"))
	if err != nil {
		return c.String(400, "bad id parameter: "+err.Error())
	}

	pubkey, err := pubkeystore.RecoverUserPublicKeyBase64(c.Request().Context(), id)
	if err != nil {
		return err
	}

	return c.JSON(200, map[string]interface{}{
		"data": pubkey,
	})
}

func (s *ChatServer) debugWs(c echo.Context) error {
	w := c.Response()
	r := c.Request()

	conn, _, _, err := ws.UpgradeHTTP(r, w)
	if err != nil {
		return err
	}
	go func() {
		defer conn.Close()

		for {
			msg, op, err := wsutil.ReadClientData(conn)
			if err != nil {
				slog.Debug("ws read err", "err", err)
				return
			}
			err = wsutil.WriteServerMessage(conn, op, msg)
			if err != nil {
				slog.Debug("ws write err", "err", err)
				return
			}
		}
	}()
	return nil
}

func (s *ChatServer) debugCursors(c echo.Context) error {
	var since time.Time
	if t, err := time.Parse(time.RFC3339Nano, c.QueryParam("since")); err == nil {
		since = t
	}
	var cursors []struct {
		Host      string     `db:"relayed_by" json:"relayed_by"`
		RelayedAt time.Time  `db:"relayed_at" json:"relayed_at"`
		RpcCursor *time.Time `db:"rpc_cursor" json:"rpc_cursor"`
		Count     int        `db:"count" json:"count"`
	}
	q := `
	select
		l.relayed_by,
		max(l.relayed_at) as relayed_at,
		max(c.relayed_at) as rpc_cursor,
		count(*) as count
	from rpc_log l
	left join rpc_cursor c on l.relayed_by = c.relayed_by
	where l.relayed_at > $1
	group by 1;
	`
	err := db.Conn.Select(&cursors, q, since)
	if err != nil {
		return err
	}
	return c.JSON(200, cursors)
}

func (s *ChatServer) debugFailed(c echo.Context) error {
	var failed []struct {
		RpcLogJson json.RawMessage `db:"rpc_log_json" json:"rpc_log_json"`
		ErrorCount int             `db:"error_count" json:"error_count"`
		ErrorText  string          `db:"error_text" json:"error_text"`
	}
	q := `
	select
		rpc_log_json, error_count, error_text
	from rpc_error
	order by last_attempt desc
	limit 5000;
	`
	err := db.Conn.Select(&failed, q)
	if err != nil {
		return err
	}
	return c.JSON(200, failed)
}

func (s *ChatServer) debugSse(c echo.Context) error {
	w := c.Response()
	ticker := time.NewTicker(1 * time.Second)
	start := time.Now()

	c.Response().Header().Set("Content-Type", "text/event-stream; charset=UTF-8")
	c.Response().Header().Set("Cache-Control", "no-store")
	c.Response().Header().Set("Connection", "keep-alive")

	for {
		select {
		case <-ticker.C:
			fmt.Fprint(w, "data:"+time.Now().String()+"\n\n")
			w.Flush()
		case <-c.Request().Context().Done():
			slog.Debug("closing connection", "lasted", time.Since(start))
			return nil
		}
	}
}

func (s *ChatServer) chatWebsocket(c echo.Context) error {
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	w := c.Response()
	r := c.Request()

	conn, _, _, err := ws.UpgradeHTTP(r, w)
	if err != nil {
		return err
	}

	rpcz.RegisterWebsocket(userId, conn)
	return nil
}

func (s *ChatServer) getChats(c echo.Context) error {
	ctx := c.Request().Context()
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	params := queries.UserChatsParams{UserID: int32(userId), Before: time.Now().UTC(), After: time.Time{}, Limit: 50}
	if c.QueryParam("before") != "" {
		beforeCursor, err := time.Parse(time.RFC3339Nano, c.QueryParam("before"))
		if err != nil {
			return err
		}
		params.Before = beforeCursor
	}
	if c.QueryParam("after") != "" {
		afterCursor, err := time.Parse(time.RFC3339Nano, c.QueryParam("after"))
		if err != nil {
			return err
		}
		params.After = afterCursor
	}
	if c.QueryParam("limit") != "" {
		limit, err := strconv.Atoi(c.QueryParam("limit"))
		if err != nil {
			return err
		}
		params.Limit = int32(limit)
	}

	chats, err := queries.UserChats(db.Conn, ctx, params)
	if err != nil {
		return err
	}
	responseData := make([]schema.UserChat, len(chats))
	for i := range chats {
		members, err := queries.ChatMembers(db.Conn, ctx, chats[i].ChatID)
		if err != nil {
			return err
		}
		responseData[i] = ToChatResponse(chats[i], members)
	}
	beforeCursorPos := params.Before
	afterCursorPos := params.After
	if len(chats) > 0 {
		beforeCursorPos = chats[len(chats)-1].LastMessageAt
		afterCursorPos = chats[0].LastMessageAt
	}
	summary, err := queries.UserChatsSummary(db.Conn, ctx, queries.UserChatsSummaryParams{UserID: userId, Before: beforeCursorPos, After: afterCursorPos})
	if err != nil {
		return err
	}
	responseSummary := ToSummaryResponse(beforeCursorPos.Format(time.RFC3339Nano), afterCursorPos.Format(time.RFC3339Nano), summary)
	response := schema.CommsResponse{
		Health:  s.getHealthStatus(),
		Data:    responseData,
		Summary: &responseSummary,
	}
	return c.JSON(200, response)
}

func (s *ChatServer) getChat(c echo.Context) error {
	ctx := c.Request().Context()
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	chat, err := queries.UserChat(db.Conn, ctx, queries.ChatMembershipParams{UserID: int32(userId), ChatID: c.Param("id")})
	if err != nil {
		if err == sql.ErrNoRows {
			return c.String(404, "chat does not exist")
		}
		return err
	}
	members, err := queries.ChatMembers(db.Conn, ctx, chat.ChatID)
	if err != nil {
		return err
	}
	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   ToChatResponse(chat, members),
	}
	return c.JSON(200, response)
}

func (s *ChatServer) getMessages(c echo.Context) error {
	ctx := c.Request().Context()
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	params := queries.ChatMessagesAndReactionsParams{UserID: int32(userId), ChatID: c.Param("id"), Before: time.Now().UTC(), After: time.Time{}, Limit: 50}
	if c.QueryParam("before") != "" {
		beforeCursor, err := time.Parse(time.RFC3339Nano, c.QueryParam("before"))
		if err != nil {
			return err
		}
		params.Before = beforeCursor
	}
	if c.QueryParam("after") != "" {
		afterCursor, err := time.Parse(time.RFC3339Nano, c.QueryParam("after"))
		if err != nil {
			return err
		}
		params.After = afterCursor
	}
	if c.QueryParam("limit") != "" {
		limit, err := strconv.Atoi(c.QueryParam("limit"))
		if err != nil {
			return err
		}
		params.Limit = int32(limit)
	}

	messages, err := queries.ChatMessagesAndReactions(db.Conn, ctx, params)
	if err != nil {
		return err
	}

	beforeCursorPos := params.Before
	afterCursorPos := params.After
	if len(messages) > 0 {
		beforeCursorPos = messages[len(messages)-1].CreatedAt
		afterCursorPos = messages[0].CreatedAt
	}
	summary, err := queries.ChatMessagesSummary(db.Conn, ctx, queries.ChatMessagesSummaryParams{UserID: userId, ChatID: c.Param("id"), Before: beforeCursorPos, After: afterCursorPos})
	if err != nil {
		return err
	}
	responseSummary := ToSummaryResponse(beforeCursorPos.Format(time.RFC3339Nano), afterCursorPos.Format(time.RFC3339Nano), summary)
	response := schema.CommsResponse{
		Health:  s.getHealthStatus(),
		Data:    Map(messages, ToMessageResponse),
		Summary: &responseSummary,
	}
	return c.JSON(200, response)
}

func (s *ChatServer) getUnreadChatCount(c echo.Context) error {
	ctx := c.Request().Context()
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	unreadCount, err := queries.UnreadChatCount(db.Conn, ctx, userId)
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err == sql.ErrNoRows {
		unreadCount = 0
	}

	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   unreadCount,
	}
	return c.JSON(200, response)
}

func (s *ChatServer) getChatPermissions(c echo.Context) error {
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	validatedPermissions := make(map[string]*ValidatedPermission)

	query := c.Request().URL.Query()
	encodedIds := query["id"]
	if encodedIds != nil && len(encodedIds) > 0 {
		var userIds []int32
		for _, encodedId := range encodedIds {
			decodedId, err := misc.DecodeHashId(encodedId)
			if err != nil {
				return c.JSON(400, "bad request: "+err.Error())
			}
			userIds = append(userIds, int32(decodedId))
			// Initialize response map
			validatedPermissions[encodedId] = &ValidatedPermission{
				Permits:                  schema.All,
				CurrentUserHasPermission: true,
			}
		}

		// Validate permission for each <request sender, user> pair
		permissions, err := queries.BulkGetChatPermissions(db.Conn, c.Request().Context(), userIds)
		if err != nil && err != sql.ErrNoRows {
			return err
		}
		if err != sql.ErrNoRows {
			err = validatePermissions(c, permissions, userId, validatedPermissions)
			if err != nil {
				return err
			}
		}
	}

	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   ToChatPermissionsResponse(validatedPermissions),
	}
	return c.JSON(200, response)
}

func (s *ChatServer) getChatBlockees(c echo.Context) error {
	ctx := c.Request().Context()
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	encodedBlockees := []string{}
	blockees, err := queries.GetChatBlockees(db.Conn, ctx, userId)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err != sql.ErrNoRows {
		for _, user := range blockees {
			encodedId, err := misc.EncodeHashId(int(user))
			if err != nil {
				return err
			}
			encodedBlockees = append(encodedBlockees, encodedId)
		}
	}

	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   encodedBlockees,
	}
	return c.JSON(200, response)
}

func (s *ChatServer) getChatBlockers(c echo.Context) error {
	ctx := c.Request().Context()
	userId, err := userIdForSignedGet(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	encodedBlockers := []string{}
	blockers, err := queries.GetChatBlockers(db.Conn, ctx, userId)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err != sql.ErrNoRows {
		for _, user := range blockers {
			encodedId, err := misc.EncodeHashId(int(user))
			if err != nil {
				return err
			}
			encodedBlockers = append(encodedBlockers, encodedId)
		}
	}

	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   encodedBlockers,
	}
	return c.JSON(200, response)
}

func getValidatedPermission(userId int32, validatedPermissions map[string]*ValidatedPermission) (*ValidatedPermission, error) {
	encodedId, err := misc.EncodeHashId(int(userId))
	if err != nil {
		return nil, err
	}
	validatedPermission, ok := validatedPermissions[encodedId]
	if !ok || validatedPermission == nil {
		return validatedPermission, fmt.Errorf(`Could not find encoded id %s in response map`, encodedId)
	}
	return validatedPermission, nil
}

func validateFolloweePermissions(c echo.Context, userIds []int32, currentUserId int32, validatedPermissions map[string]*ValidatedPermission) error {
	// Query follows table to validate <sender, receiver> pair against users with followees only permissions
	follows, err := queries.BulkGetFollowers(db.Conn, c.Request().Context(), queries.BulkGetFollowersParams{
		FollowerUserIDs: userIds,
		FolloweeUserID:  currentUserId,
	})
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err != sql.ErrNoRows {
		// Update response map if current follow record exists
		for _, follow := range follows {
			validatedPermission, err := getValidatedPermission(follow.FollowerUserID, validatedPermissions)
			if err != nil {
				return err
			}
			(*validatedPermission).CurrentUserHasPermission = true
		}
	}
	return nil
}

func validateTipperPermissions(c echo.Context, userIds []int32, currentUserId int32, validatedPermissions map[string]*ValidatedPermission) error {
	// Query tips table to validate <sender, receiver> pair against users with tippers only permissions
	tips, err := queries.BulkGetTipReceivers(db.Conn, c.Request().Context(), queries.BulkGetTipReceiversParams{
		SenderUserID:    currentUserId,
		ReceiverUserIDs: userIds,
	})
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err != sql.ErrNoRows {
		// Update response map if aggregate tip record exists
		for _, tip := range tips {
			validatedPermission, err := getValidatedPermission(tip.ReceiverUserID, validatedPermissions)
			if err != nil {
				return err
			}
			(*validatedPermission).CurrentUserHasPermission = true
		}
	}
	return nil
}

func validatePermissions(c echo.Context, permissions []queries.ChatPermissionsRow, currentUserId int32, validatedPermissions map[string]*ValidatedPermission) error {
	// User IDs that permit chats from followees only
	var followeePermissions []int32
	// User IDs that permit chats from tippers only
	var tipperPermissions []int32
	for _, userPermission := range permissions {
		// Add ids to validate by bulk querying respective tables later
		// Don't validate for current user
		if userPermission.UserID != currentUserId {
			if userPermission.Permits == schema.Followees {
				followeePermissions = append(followeePermissions, userPermission.UserID)
			} else if userPermission.Permits == schema.Tippers {
				tipperPermissions = append(tipperPermissions, userPermission.UserID)
			}
		}

		// Add permissions to response map
		validatedPermission, err := getValidatedPermission(userPermission.UserID, validatedPermissions)
		if err != nil {
			return err
		}
		(*validatedPermission).Permits = userPermission.Permits
		if userPermission.Permits == schema.All || userPermission.UserID == currentUserId {
			(*validatedPermission).CurrentUserHasPermission = true
		} else {
			// Initialize response map to false for now
			(*validatedPermission).CurrentUserHasPermission = false
		}
	}

	if len(followeePermissions) > 0 {
		err := validateFolloweePermissions(c, followeePermissions, currentUserId, validatedPermissions)
		if err != nil {
			return err
		}
	}

	if len(tipperPermissions) > 0 {
		err := validateTipperPermissions(c, tipperPermissions, currentUserId, validatedPermissions)
		if err != nil {
			return err
		}
	}

	return nil
}

func (ss *ChatServer) getRpcBulk(c echo.Context) error {

	var rpcs []schema.RpcLog

	var after time.Time
	if t, err := time.Parse(time.RFC3339Nano, c.QueryParam("after")); err == nil {
		after = t
	} else {
		fmt.Println("failed to parse time", err, c.QueryParam("after"), c.QueryString())
	}

	query := `select * from rpc_log where applied_at > $1 order by applied_at asc limit 10000`
	err := db.Conn.Select(&rpcs, query, after.Truncate(time.Microsecond))
	if err != nil {
		return err
	}

	// using this with debug=true
	// pretty prints the json and sig match fails
	// ouch!
	// return c.JSON(200, rpcs)

	j, err := json.Marshal(rpcs)
	if err != nil {
		return err
	}
	return c.JSONBlob(200, j)

}

func (ss *ChatServer) postRpcReceive(c echo.Context) error {

	// bind to RpcRow
	rpc := new(schema.RpcLog)
	if err := c.Bind(rpc); err != nil {
		return c.String(http.StatusBadRequest, err.Error())
	}

	// apply
	err := ss.proc.Apply(rpc)
	if err != nil {
		return err
	}

	slog.Info("got relay", "from", rpc.RelayedBy, "sig", rpc.Sig)

	return c.String(200, "OK")
}

func (ss *ChatServer) StartWebsocketTester() {
	for {
		time.Sleep(time.Minute)
		ss.websocketError = ss.doWebsocketTest()
	}
}

func (ss *ChatServer) doWebsocketTest() error {
	wsUrl, err := url.Parse(strings.Replace(ss.config.MyHost, "http", "ws", 1))
	if err != nil {
		return err
	}

	wsUrl = wsUrl.JoinPath("/comms/debug/ws")

	ctx := context.Background()
	con, _, _, err := ws.Dial(ctx, wsUrl.String())
	if err != nil {
		return err
	}
	return con.Close()
}
