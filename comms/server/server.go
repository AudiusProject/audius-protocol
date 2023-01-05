package server

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"comms.audius.co/config"
	"comms.audius.co/db"
	"comms.audius.co/db/queries"
	"comms.audius.co/internal/pubkeystore"
	"comms.audius.co/internal/rpcz"
	"comms.audius.co/jetstream"
	"comms.audius.co/misc"
	"comms.audius.co/peering"
	"comms.audius.co/schema"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/nats-io/nats.go"
)

var (
	logger = config.Logger
)

func Start() {
	e := createServer()
	e.Logger.Fatal(e.Start(":8925"))
}

func getHealthStatus() schema.Health {
	return schema.Health{
		IsHealthy: true,
	}
}

func readSignedRequest(c echo.Context) (payload []byte, wallet string, err error) {
	if c.Request().Method == "GET" {
		payload = []byte(c.Request().URL.Path)
	} else if c.Request().Method == "POST" {
		payload, err = io.ReadAll(c.Request().Body)
	} else {
		err = errors.New("unsupported request type")
	}
	if err != nil {
		return
	}

	sigHex := c.Request().Header.Get(config.SigHeader)
	sig, err := base64.StdEncoding.DecodeString(sigHex)
	if err != nil {
		err = errors.New("bad sig header: " + err.Error())
		return
	}

	// recover
	hash := crypto.Keccak256Hash(payload)
	pubkey, err := crypto.SigToPub(hash[:], sig)
	if err != nil {
		return
	}
	wallet = crypto.PubkeyToAddress(*pubkey).Hex()
	return
}

func getChats(c echo.Context) error {
	ctx := c.Request().Context()
	_, wallet, err := readSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}
	chats, err := queries.UserChats(db.Conn, ctx, userId)
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
	cursorPos := time.Now().UTC()
	if len(chats) > 0 {
		lastChat := chats[len(chats)-1]
		cursorPos = lastChat.LastMessageAt
	}
	summary, err := queries.UserChatsSummary(db.Conn, ctx, queries.UserChatsSummaryParams{UserID: userId, Cursor: cursorPos})
	if err != nil {
		return err
	}
	responseSummary := ToSummaryResponse(cursorPos.Format(time.RFC3339Nano), summary)
	response := schema.CommsResponse{
		Health:  getHealthStatus(),
		Data:    responseData,
		Summary: &responseSummary,
	}
	return c.JSON(200, response)
}

func getChat(c echo.Context) error {
	ctx := c.Request().Context()
	_, wallet, err := readSignedRequest(c)
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
	_, wallet, err := readSignedRequest(c)
	if err != nil {
		return c.String(400, "bad request: "+err.Error())
	}

	userId, err := queries.GetUserIDFromWallet(db.Conn, ctx, wallet)
	if err != nil {
		return c.String(400, "wallet not found: "+err.Error())
	}

	params := queries.ChatMessagesAndReactionsParams{UserID: int32(userId), ChatID: c.Param("id"), Cursor: time.Now().UTC(), Limit: 50}
	if c.QueryParam("cursor") != "" {
		cursor, err := time.Parse(time.RFC3339Nano, c.QueryParam("cursor"))
		if err != nil {
			return err
		}
		params.Cursor = cursor
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

	cursorPos := params.Cursor
	if len(messages) > 0 {
		cursorPos = messages[len(messages)-1].CreatedAt
	}
	summary, err := queries.ChatMessagesSummary(db.Conn, ctx, queries.ChatMessagesSummaryParams{UserID: userId, ChatID: c.Param("id"), Cursor: cursorPos})
	if err != nil {
		return err
	}
	responseSummary := ToSummaryResponse(cursorPos.Format(time.RFC3339Nano), summary)
	response := schema.CommsResponse{
		Health:  getHealthStatus(),
		Data:    Map(messages, ToMessageResponse),
		Summary: &responseSummary,
	}
	return c.JSON(200, response)
}

func createServer() *echo.Echo {
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
		return c.String(http.StatusOK, "comms are UP")
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

		jsc := jetstream.GetJetstreamContext()
		if jsc == nil {
			return c.String(500, "jetstream not ready")
		}

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
		payload, wallet, err := readSignedRequest(c)
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
		rpcz.Validate(userId, rawRpc)

		subject := "audius.dms.demo"
		jsc := jetstream.GetJetstreamContext()
		if jsc == nil {
			return c.JSON(500, "jetstream not ready")
		}

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

	// exchange is called by peer discovery providers
	// for the sake of peering
	// after validating request came from a registered peer
	// this server should respond with connection info
	g.POST("/exchange", func(c echo.Context) error {
		discoveryNodes, err := peering.GetDiscoveryNodes()
		if err != nil {
			return err
		}

		payload, senderAddress, err := readSignedRequest(c)
		if err != nil {
			return c.String(400, "bad request: "+err.Error())
		}

		var theirInfo peering.Info
		err = json.Unmarshal(payload, &theirInfo)
		if err != nil {
			return c.String(http.StatusBadRequest, "bad json")
		}

		// check senderAddress is in known list
		if !peering.WalletEquals(theirInfo.Address, senderAddress) {
			return c.String(400, "recovered wallet doesn't match payload wallet")
		}
		knownWallet := false
		for _, sp := range discoveryNodes {
			if peering.WalletEquals(senderAddress, sp.DelegateOwnerWallet) {
				knownWallet = true
			}
		}
		if !knownWallet {
			return c.String(400, "recovered wallet not a registered service provider")
		}

		// maybe we proactively add their info
		// maybe something like: go peering.AddPeer(theirInfo)
		// we'd want to do this because they might not have reverse proxy working
		// or might not have ports open
		// and they'd want to connect as client to our nats instance
		// and we want to make sure they can connect right away

		// maybe also we sign our response
		// maybe we try to move some of this signing stuff out of the http handler
		// and http request code

		peering.AddPeer(&theirInfo)

		myInfo, err := peering.MyInfo()
		if err != nil {
			return err
		}
		return c.JSON(200, myInfo)
	})

	// debug endpoint to list known peers
	g.GET("/peers", func(c echo.Context) error {
		peers := peering.ListPeers()
		// redact private info
		for idx, peer := range peers {
			peer.IP = ""
			peer.NatsRoute = ""
			peers[idx] = peer
		}
		return c.JSON(200, peers)
	})

	return e
}
