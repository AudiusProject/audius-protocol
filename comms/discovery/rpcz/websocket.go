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

func websocketPush(senderUserId int32, receiverUserId int32, rpcJson json.RawMessage, timestamp time.Time, pushAll bool) {
	mu.Lock()
	defer mu.Unlock()

	for userId := range websockets {
		if !pushAll && receiverUserId != userId {
			continue
		}

		for _, s := range websockets[receiverUserId] {
			encodedSenderUserId, _ := misc.EncodeHashId(int(senderUserId))
			encodedReceiverUserId, _ := misc.EncodeHashId(int(receiverUserId))

			// this struct should match ChatWebsocketEventData
			// but we create a matching anon struct here
			// so we can simply pass thru the RPC as a json.RawMessage
			// which is simpler than satisfying the quicktype generated schema.RPC struct
			data := struct {
				RPC      json.RawMessage `json:"rpc"`
				Metadata schema.Metadata `json:"metadata"`
			}{
				rpcJson,
				schema.Metadata{Timestamp: timestamp.Format(time.RFC3339Nano), SenderUserID: encodedSenderUserId, ReceiverUserID: encodedReceiverUserId},
			}

			payload, err := json.Marshal(data)
			if err != nil {
				logger.Warn("invalid websocket json " + err.Error())
				return
			}
			err = wsutil.WriteServerMessage(s, ws.OpText, payload)
			if err != nil {
				logger.Info("websocket push failed: " + err.Error())
				removeWebsocket(receiverUserId, s)
			} else {
				logger.Debug("websocket push", "userId", receiverUserId, "payload", string(payload))
			}

			// filter out expired messages and append new one
			recent2 := []*recentMessage{}
			for _, r := range recentMessages {
				if time.Since(r.sentAt) < time.Second*10 {
					recent2 = append(recent2, r)
				}
			}
			recent2 = append(recent2, &recentMessage{
				userId:  receiverUserId,
				sentAt:  time.Now(),
				payload: payload,
			})
			recentMessages = recent2
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
