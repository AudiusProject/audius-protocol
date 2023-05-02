package rpcz

import (
	"encoding/json"
	"net"
	"sync"
	"time"

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
	mu.Lock()
	defer mu.Unlock()
	websockets = append(websockets, userWebsocket{
		userId,
		conn,
	})

	for _, r := range recentMessages {
		if time.Since(r.sentAt) < time.Second*10 && r.userId == userId {
			err := wsutil.WriteServerMessage(conn, ws.OpText, r.payload)
			if err != nil {
				logger.Info("websocket push failed: " + err.Error())
			}
		}
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

func websocketPush(userId int32, data schema.ChatWebsocketEventData) {
	mu.Lock()
	defer mu.Unlock()

	payload, err := json.Marshal(data)
	if err != nil {
		logger.Error("failed to encode json: ", err)
		return
	}

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

		err = wsutil.WriteServerMessage(s.conn, ws.OpText, payload)
		if err != nil {
			logger.Info("websocket push failed: " + err.Error())
			removeWebsocket(s)
		} else {
			logger.Debug("websocket push", "userId", userId, "payload", string(payload))
		}
	}

}

/*
const loc = window.location;
const proto = loc.protocol == 'https:' ? 'wss:' : 'ws:'
const uri = `${proto}${loc.host}/chats/ws`
const ws = new WebSocket(uri)

ws.onopen = function() {
	console.log('WS Connected')
}

ws.onclose = function() {
	console.log('WS Close')
}

ws.onerror = function(event) {
	console.log('WS Error', event)
	this.fallback = true
	this.pollFallback()
	setInterval(() => this.pollFallback(), 5000)
}

ws.onmessage = function(evt) {
	console.log('ws msg', evt)
}
*/
