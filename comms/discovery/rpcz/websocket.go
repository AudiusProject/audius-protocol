package rpcz

import (
	"encoding/json"
	"net"
	"sync"
	"time"

	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"golang.org/x/exp/slog"
)

var (
	mu             sync.Mutex
	websockets     = []userWebsocket{}
	recentMessages = []*recentMessage{}
	logger         = slog.Default()
)

type recentMessage struct {
	userId  int32
	sentAt  time.Time
	payload []byte
}

type userWebsocket struct {
	userId int32
	conn   net.Conn
}

func RegisterWebsocket(userId int32, conn net.Conn) {

	var pushErr error
	for _, r := range recentMessages {
		if time.Since(r.sentAt) < time.Second*10 && r.userId == userId {
			pushErr = wsutil.WriteServerMessage(conn, ws.OpText, r.payload)
			if pushErr != nil {
				logger.Info("websocket push failed: " + pushErr.Error())
				break
			}
		}
	}

	if pushErr == nil {
		mu.Lock()
		websockets = append(websockets, userWebsocket{
			userId,
			conn,
		})
		mu.Unlock()
	}
}

func removeWebsocket(toRemove userWebsocket) {
	keep := make([]userWebsocket, 0, len(websockets))
	for _, s := range websockets {
		if s == toRemove {
			s.conn.Close()
		} else {
			keep = append(keep, s)
		}
	}
	websockets = keep
}

func websocketPush(userId int32, payload []byte) {
	mu.Lock()
	defer mu.Unlock()

	// filter out expired messages and append new one
	recent2 := []*recentMessage{}
	for _, r := range recentMessages {
		if time.Since(r.sentAt) < time.Second*10 {
			recent2 = append(recent2, r)
		}
	}
	recent2 = append(recent2, &recentMessage{
		userId:  userId,
		sentAt:  time.Now(),
		payload: payload,
	})
	recentMessages = recent2

	for _, s := range websockets {
		if s.userId != userId {
			continue
		}

		err := wsutil.WriteServerMessage(s.conn, ws.OpText, payload)
		if err != nil {
			logger.Info("websocket push failed: " + err.Error())
			removeWebsocket(s)
		} else {
			logger.Debug("websocket push", "userId", userId, "payload", string(payload))
		}
	}

}

func websocketPushAll(rpcJson json.RawMessage, timestamp time.Time) {
	mu.Lock()
	defer mu.Unlock()

	for _, s := range websockets {
		encodedUserId, _ := misc.EncodeHashId(int(s.userId))

		data := struct {
			RPC      json.RawMessage `json:"rpc"`
			Metadata schema.Metadata `json:"metadata"`
		}{
			rpcJson,
			schema.Metadata{Timestamp: timestamp.Format(time.RFC3339Nano),
				// Note this is the userId of the user receiving the message
				UserID: encodedUserId},
		}

		payload, err := json.Marshal(data)
		if err != nil {
			logger.Warn("invalid websocket json " + err.Error())
			return
		}

		err = wsutil.WriteServerMessage(s.conn, ws.OpText, payload)
		if err != nil {
			logger.Info("websocket push failed: " + err.Error())
			removeWebsocket(s)
		} else {
			logger.Debug("websocket push all", "payload", string(payload))
		}
	}
}
