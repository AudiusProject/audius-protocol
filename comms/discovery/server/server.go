package server

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/schema"
	sharedConfig "comms.audius.co/shared/config"
	"comms.audius.co/shared/peering"
	"comms.audius.co/shared/utils"
	"github.com/Doist/unfurlist"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/inconshreveable/log15"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func NewServer(proc *rpcz.RPCProcessor) *ChatServer {
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	// Middleware
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	s := &ChatServer{
		Echo: e,
		proc: proc,
	}

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "comms are UP... but this is /... see /comms")
	})

	g := e.Group("/comms")

	g.GET("", func(c echo.Context) error {
		return c.String(http.StatusOK, "comms are UP: v1")
	})

	config := unfurlist.WithBlocklistPrefixes(
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
	g.GET("/unfurl", echo.WrapHandler(unfurlist.New(config)))
	g.GET("/pubkey/:id", s.getPubkey)
	g.GET("/chats", s.getChats)
	g.GET("/chats/ws", s.chatWebsocket)
	g.GET("/chats/:id", s.getChat)
	g.GET("/chats/:id/messages", s.getMessages)
	g.POST("/mutate", s.mutate)

	g.GET("/chats/permissions", s.getChatPermissions)
	g.GET("/chats/blocked-users", s.getChatBlockedUsers)
	g.POST("/validate-can-chat", s.validateCanChat)

	g.GET("/debug/ws", s.debugWs)
	g.GET("/debug/sse", s.debugSse)

	g.GET("/rpc/stream", s.getRpcStream)
	g.GET("/rpc/bulk", s.getRpcBulk)

	g.GET("/debug/vars", echo.WrapHandler(http.StripPrefix("/comms", http.DefaultServeMux)))
	g.GET("/debug/pprof/*", echo.WrapHandler(http.StripPrefix("/comms", http.DefaultServeMux)))

	return s
}

var (
	logger = log15.New()
)

func init() {
	logger.SetHandler(log15.StreamHandler(os.Stdout, log15.TerminalFormat()))
}

type ChatServer struct {
	*echo.Echo
	proc *rpcz.RPCProcessor
}

func (s *ChatServer) mutate(c echo.Context) error {
	payload, wallet, err := peering.ReadSignedRequest(c)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	// unmarshal RPC and call validator
	var rawRpc schema.RawRPC
	err = json.Unmarshal(payload, &rawRpc)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, c.Request().Context(), wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}

	// call validator
	err = s.proc.Validate(userId, rawRpc)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	//
	myHost := os.Getenv("audius_discprov_url")
	rpcLog := &schema.RpcLog{
		RelayedBy:          myHost,
		JetstreamTimestamp: time.Now(),
		FromWallet:         wallet,
		Rpc:                payload,
		Sig:                c.Request().Header.Get(sharedConfig.SigHeader),
	}

	// ok, err := s.proc.SubmitAndWait(msg)
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
		IsHealthy: true,
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
				log.Println("ws read err", err)
				return
			}
			err = wsutil.WriteServerMessage(conn, op, msg)
			if err != nil {
				log.Println("ws write err", err)
				return
			}
		}
	}()
	return nil
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
			log.Println("closing connection after ", time.Since(start))
			return nil
		}
	}
}

func (s *ChatServer) chatWebsocket(c echo.Context) error {
	ctx := c.Request().Context()

	// Check that timestamp is less than 5 seconds old
	timestamp, err := strconv.ParseInt(c.QueryParam("timestamp"), 0, 64)
	if err != nil || time.Now().UnixMilli()-timestamp > 5000 {
		return c.String(400, "Invalid signature timestamp")
	}

	// Websockets from the client can't send headers, so instead, the signature is a query parameter
	// Strip out the signature query parameter to get the true signature payload
	u, err := url.Parse(c.Request().RequestURI)
	if err != nil {
		return c.String(400, "Could not parse URL")
	}
	q := u.Query()
	q.Del("signature")
	u.RawQuery = q.Encode()
	signature := c.QueryParam("signature")
	signedData := []byte(u.String())

	// Now that we have the data that was actually signed, we can recover the wallet
	wallet, err := peering.ReadSigned(signature, signedData)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}

	w := c.Response()
	r := c.Request()

	conn, _, _, err := ws.UpgradeHTTP(r, w)
	if err != nil {
		return err
	}

	// rpcz.RegisterWebsocket(userId, conn)
	time.Sleep(time.Hour)
	fmt.Println("doing nothing with ws conn", userId, conn)
	return nil
}

func (s *ChatServer) getChats(c echo.Context) error {
	ctx := c.Request().Context()
	_, wallet, err := peering.ReadSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
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
	_, wallet, err := peering.ReadSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}
	chat, err := queries.UserChat(db.Conn, ctx, queries.ChatMembershipParams{UserID: int32(userId), ChatID: c.Param("id")})
	if err != nil {
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
	_, wallet, err := peering.ReadSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
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

func (s *ChatServer) getChatPermissions(c echo.Context) error {
	ctx := c.Request().Context()
	_, wallet, err := peering.ReadSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}

	permission, err := queries.GetChatPermissions(db.Conn, ctx, userId)
	if err != nil {
		if err == sql.ErrNoRows {
			permission = schema.All
		} else {
			return err
		}
	}

	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   permission,
	}
	return c.JSON(200, response)
}

func (s *ChatServer) getChatBlockedUsers(c echo.Context) error {
	ctx := c.Request().Context()
	_, wallet, err := peering.ReadSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}

	encodedBlocked := []string{}
	blocked, err := queries.GetChatBlockedUsers(db.Conn, ctx, userId)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	if err != sql.ErrNoRows {
		for _, user := range blocked {
			encodedId, err := misc.EncodeHashId(int(user))
			if err != nil {
				return err
			}
			encodedBlocked = append(encodedBlocked, encodedId)
		}
	}

	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   encodedBlocked,
	}
	return c.JSON(200, response)
}

func (s *ChatServer) validateCanChat(c echo.Context) error {
	payload, wallet, err := peering.ReadSignedRequest(c)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, c.Request().Context(), wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}

	// Unmarshal RPC
	var rawRpc schema.RawRPC
	err = json.Unmarshal(payload, &rawRpc)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}

	// Validate and decode payload
	var params schema.ValidateCanChatRPCParams
	err = json.Unmarshal(rawRpc.Params, &params)
	if err != nil {
		return c.JSON(400, "bad request: "+err.Error())
	}
	var receiverUserIds []int32
	canChat := make(map[string]bool)
	for _, encodedId := range params.ReceiverUserIDS {
		decodedId, err := misc.DecodeHashId(encodedId)
		if err != nil {
			return c.JSON(400, "bad request: "+err.Error())
		}
		receiverUserIds = append(receiverUserIds, int32(decodedId))
		// Initialize response map
		canChat[encodedId] = true
	}

	// Validate request sender is not the blocker or blockee for each receiver
	blocks, err := queries.BulkGetChatBlockedOrBlocking(db.Conn, c.Request().Context(), queries.BulkGetChatBlockedOrBlockingParams{
		SenderUserID:    userId,
		ReceiverUserIDs: receiverUserIds,
	})
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err != sql.ErrNoRows {
		var encodedId string
		var receiver int32
		var blockedReceivers []int32
		for _, block := range blocks {
			if block.BlockerUserID == userId {
				// Request sender blocked this receiver
				receiver = block.BlockeeUserID
			} else {
				// Receiver blocked request sender
				receiver = block.BlockerUserID
			}
			// Update response map
			encodedId, err = misc.EncodeHashId(int(receiver))
			if err != nil {
				return err
			}
			canChat[encodedId] = false
			blockedReceivers = append(blockedReceivers, receiver)
		}

		// Remove blockedReceivers from receiverUserIds.
		// We know sender cannot chat with blockedReceivers - no need
		// to perform further validations.
		receiverUserIds = utils.Difference(receiverUserIds, blockedReceivers)
	}

	if len(receiverUserIds) > 0 {
		// Validate permission for each <request sender, user> pair
		permissions, err := queries.BulkGetChatPermissions(db.Conn, c.Request().Context(), receiverUserIds)
		if err != nil && err != sql.ErrNoRows {
			return err
		}
		if err != sql.ErrNoRows {
			canChat, err = validatePermissions(c, permissions, userId, canChat)
			if err != nil {
				return err
			}
		}
	}

	response := schema.CommsResponse{
		Health: s.getHealthStatus(),
		Data:   canChat,
	}
	return c.JSON(200, response)
}

func validatePermissions(c echo.Context, permissions []queries.ChatPermissionsRow, senderUserId int32, canChat map[string]bool) (map[string]bool, error) {
	// User IDs that permit chats from followees only
	var followeePermissions []int32
	// User IDs that permit chats from tippers only
	var tipperPermissions []int32
	for _, userPermission := range permissions {
		if userPermission.Permits == schema.Followees {
			// Add id to followeePermissions to bulk query later
			followeePermissions = append(followeePermissions, userPermission.UserID)
			// Initialize response map to false for now
			encodedId, err := misc.EncodeHashId(int(userPermission.UserID))
			if err != nil {
				return canChat, err
			}
			canChat[encodedId] = false
		} else if userPermission.Permits == schema.Tippers {
			// Add id to tipperPermissions to bulk query later
			tipperPermissions = append(tipperPermissions, userPermission.UserID)
			// Initialize response map to false for now
			encodedId, err := misc.EncodeHashId(int(userPermission.UserID))
			if err != nil {
				return canChat, err
			}
			canChat[encodedId] = false
		}
	}

	if len(followeePermissions) > 0 {
		// Query follows table to validate <sender, receiver> pair against users with followees only permissions
		follows, err := queries.BulkGetFollowers(db.Conn, c.Request().Context(), queries.BulkGetFollowersParams{
			FollowerUserIDs: followeePermissions,
			FolloweeUserID:  senderUserId,
		})
		if err != nil && err != sql.ErrNoRows {
			return canChat, err
		}
		if err != sql.ErrNoRows {
			// Update response map if current follow record exists
			for _, follow := range follows {
				encodedId, err := misc.EncodeHashId(int(follow.FollowerUserID))
				if err != nil {
					return canChat, err
				}
				canChat[encodedId] = true
			}
		}
	}

	if len(tipperPermissions) > 0 {
		// Query tips table to validate <sender, receiver> pair against users with tippers only permissions
		tips, err := queries.BulkGetTipReceivers(db.Conn, c.Request().Context(), queries.BulkGetTipReceiversParams{
			SenderUserID:    senderUserId,
			ReceiverUserIDs: tipperPermissions,
		})
		if err != nil && err != sql.ErrNoRows {
			return canChat, err
		}
		if err != sql.ErrNoRows {
			// Update response map if aggregate tip record exists
			for _, tip := range tips {
				encodedId, err := misc.EncodeHashId(int(tip.ReceiverUserID))
				if err != nil {
					return canChat, err
				}
				canChat[encodedId] = true
			}
		}
	}

	return canChat, nil
}
func (ss *ChatServer) getRpcStream(c echo.Context) error {
	w := c.Response()
	r := c.Request()
	startedAt := time.Now()

	go func() {
		// Received Browser Disconnection
		<-r.Context().Done()
		// ss.logger.Info("sse client connection closed", "ip", r.RemoteAddr)
		log.Println("sse client connection closed", "ip", r.RemoteAddr, r.URL.String(), "took", time.Since(startedAt))
	}()

	ss.proc.SSEServer.ServeHTTP(w, r)
	return nil
}

func (ss *ChatServer) getRpcBulk(c echo.Context) error {
	var rpcs []schema.RpcLog
	query := `select * from rpc_log where relayed_by = $1 order by jetstream_timestamp asc`
	myHost := os.Getenv("audius_discprov_url")
	err := db.Conn.Select(&rpcs, query, myHost)
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
