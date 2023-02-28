package rpcz

import (
	"encoding/json"
	"net"
	"os"
	"sync"

	"comms.audius.co/discovery/schema"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
	"github.com/inconshreveable/log15"
)

var (
	mu           sync.RWMutex
	websocketMap = map[int32]net.Conn{}
	logger       = log15.New()
)

func init() {
	logger.SetHandler(log15.StreamHandler(os.Stdout, log15.TerminalFormat()))
}

func RegisterWebsocket(userId int32, conn net.Conn) {
	mu.Lock()
	defer mu.Unlock()
	if existing, ok := websocketMap[userId]; ok {
		logger.Warn("existing websocket found... closing", "user_id", userId)
		existing.Close()
	}
	websocketMap[userId] = conn
}

func websocketPush(userId int32, data schema.ChatWebsocketEventData) {
	mu.RLock()
	defer mu.RUnlock()
	if conn, ok := websocketMap[userId]; ok {
		payload, err := json.Marshal(data)
		if err != nil {
			logger.Error("failed to encode json: " + err.Error())
			return
		}
		err = wsutil.WriteServerMessage(conn, ws.OpText, payload)
		if err != nil {
			logger.Info("websocket push failed: " + err.Error())
			conn.Close()
			delete(websocketMap, userId)
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
