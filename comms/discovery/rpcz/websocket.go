package rpcz

import (
	"net"
	"sync"
	"time"

	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"golang.org/x/exp/slog"
)

var (
	mu             sync.Mutex
	websockets     = make(map[int32][]net.Conn)
	recentMessages = []*recentMessage{}
	logger         = slog.Default()
)

type recentMessage struct {
	userId  int32
	sentAt  time.Time
	payload []byte
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
		websockets[userId] = append(websockets[userId], conn)
		mu.Unlock()
	}
}

func removeWebsocket(userId int32, toRemove net.Conn) {
	keep := make([]net.Conn, 0, len(websockets[userId]))
	for _, s := range websockets[userId] {
		if s == toRemove {
			s.Close()
		} else {
			keep = append(keep, s)
		}
	}
	websockets[userId] = keep
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

	for _, s := range websockets[userId] {
		err := wsutil.WriteServerMessage(s, ws.OpText, payload)
		if err != nil {
			logger.Info("websocket push failed: " + err.Error())
			removeWebsocket(userId, s)
		} else {
			logger.Debug("websocket push", "userId", userId, "payload", string(payload))
		}
	}

}
