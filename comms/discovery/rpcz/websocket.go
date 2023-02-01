package rpcz

import (
	"encoding/json"
	"net"
	"sync"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/schema"
	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
)

var (
	mu           sync.RWMutex
	websocketMap = map[int32]net.Conn{}
)

func RegisterWebsocket(userId int32, conn net.Conn) {
	mu.Lock()
	defer mu.Unlock()
	if existing, ok := websocketMap[userId]; ok {
		config.Logger.Warn("existing websocket found... closing", "user_id", userId)
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
			config.Logger.Error("failed to encode json: " + err.Error())
			return
		}
		err = wsutil.WriteServerMessage(conn, ws.OpText, payload)
		if err != nil {
			config.Logger.Info("websocket push failed: " + err.Error())
			conn.Close()
			delete(websocketMap, userId)
		} else {
			config.Logger.Debug("websocket push", "userId", userId, "payload", string(payload))
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
