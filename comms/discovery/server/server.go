package server

import (
	"encoding/json"
	"io"
	"net/http"
	"strconv"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/pubkeystore"
	"comms.audius.co/discovery/rpcz"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/peering"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/nats-io/nats.go"
)

var (
	logger = config.Logger
)

func getHealthStatus() schema.Health {
	return schema.Health{
		IsHealthy: true,
	}
}

func getChats(c echo.Context) error {
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
		Health:  getHealthStatus(),
		Data:    responseData,
		Summary: &responseSummary,
	}
	return c.JSON(200, response)
}

func getChat(c echo.Context) error {
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
	logger.Debug("chat", "userId", userId, "chatId", c.Param("id"), "chat.chatId", chat.ChatID)
	members, err := queries.ChatMembers(db.Conn, ctx, chat.ChatID)
	if err != nil {
		return err
	}
	response := schema.CommsResponse{
		Health: getHealthStatus(),
		Data:   ToChatResponse(chat, members),
	}
	return c.JSON(200, response)
}

func getMessages(c echo.Context) error {
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
		Health:  getHealthStatus(),
		Data:    Map(messages, ToMessageResponse),
		Summary: &responseSummary,
	}
	return c.JSON(200, response)
}

func NewServer(jsc nats.JetStreamContext, proc *rpcz.RPCProcessor) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.Debug = true

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "comms are UP... but this is /... see /comms")
	})

	g := e.Group("/comms")

	g.GET("", func(c echo.Context) error {
		return c.String(http.StatusOK, "comms are UP: v1")
	})

	g.GET("/pubkey/:id", func(c echo.Context) error {
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
	})

	// this is a WIP endpoint that matches identity relay
	// we could use a cloudflare worker to "tee" identity requests into NATS
	g.POST("/relay", func(c echo.Context) error {
		// todo: do EIP-712 verification here...
		// skip if bad...
		payload, err := io.ReadAll(c.Request().Body)
		if err != nil {
			return err
		}

		// subject := "audius.comms.demo"
		subject := "audius.staging.relay"

		// Publish data to the subject
		msg := nats.NewMsg(subject)
		msg.Header.Add(config.SigHeader, c.Request().Header.Get(config.SigHeader))
		msg.Data = payload
		ok, err := jsc.PublishMsg(msg)
		if err != nil {
			logger.Warn(string(payload), "err", err)
			return c.String(500, err.Error())
		}

		logger.Debug(string(payload), "seq", ok.Sequence, "relay", true)
		return c.String(200, "ok")
	})

	g.GET("/chats", getChats)

	g.GET("/chats/:id", getChat)

	g.GET("/chats/:id/messages", getMessages)

	// this is the "mutation" RPC encpoint
	// it will forward RPC to NATS.
	g.POST("/mutate", func(c echo.Context) error {
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
		err = proc.Validate(userId, rawRpc)
		if err != nil {
			return c.JSON(400, "bad request: "+err.Error())
		}

		subject := "audius.dms.demo"

		// Publish data to the subject
		msg := nats.NewMsg(subject)
		msg.Header.Add(config.SigHeader, c.Request().Header.Get(config.SigHeader))
		msg.Data = payload
		ok, err := jsc.PublishMsg(msg)
		if err != nil {
			logger.Warn(string(payload), "wallet", wallet, "err", err)
			return c.JSON(500, err.Error())
		}

		logger.Debug(string(payload), "seq", ok.Sequence, "wallet", wallet, "relay", true)
		return c.JSON(200, "ok")
	})

	g.GET("/debug/stream", func(c echo.Context) error {

		info, err := jsc.StreamInfo(config.GlobalStreamName)
		if err != nil {
			return err
		}
		return c.JSON(200, info)
	})

	g.GET("/debug/consumer", func(c echo.Context) error {

		info, err := jsc.ConsumerInfo(config.GlobalStreamName, config.WalletAddress)
		if err != nil {
			return err
		}
		return c.JSON(200, info)
	})

	return e
}
