package server

import (
	"bytes"
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"comms.audius.co/config"
	"comms.audius.co/db"
	"comms.audius.co/misc"
	"comms.audius.co/schema"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
)

// func TestServer(t *testing.T) {
// 	e := createServer()
// 	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(userJSON))
// 	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
// 	rec := httptest.NewRecorder()
// 	c := e.NewContext(req, rec)

// 	// Assertions
// 	if assert.NoError(t, h.createUser(c)) {
// 		assert.Equal(t, http.StatusCreated, rec.Code)
// 		assert.Equal(t, userJSON, rec.Body.String())
// 	}
// }

func TestSig(t *testing.T) {
	privateKey, err := crypto.GenerateKey()
	assert.NoError(t, err)

	address := crypto.PubkeyToAddress(privateKey.PublicKey).Hex()
	fmt.Println(address)

	// sign
	data := []byte("hello")
	hash := crypto.Keccak256Hash(data)

	signature, err := crypto.Sign(hash.Bytes(), privateKey)
	if err != nil {
		log.Fatal(err)
	}

	// fmt.Println(hexutil.Encode(signature))

	// recover
	sigPublicKey, err := crypto.SigToPub(hash.Bytes(), signature)
	if err != nil {
		log.Fatal(err)
	}
	publicKeyBytes := crypto.FromECDSAPub(sigPublicKey)

	fmt.Println(hexutil.Encode(publicKeyBytes))
	address2 := crypto.PubkeyToAddress(*sigPublicKey).Hex()
	fmt.Println(address2)
	assert.Equal(t, address, address2)
}

func TestGetChats(t *testing.T) {
	var err error

	// Generate user keys
	privateKey1, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet1 := crypto.PubkeyToAddress(privateKey1.PublicKey).Hex()

	privateKey2, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet2 := crypto.PubkeyToAddress(privateKey2.PublicKey).Hex()

	privateKey3, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet3 := crypto.PubkeyToAddress(privateKey3.PublicKey).Hex()

	// Set up db
	_, err = db.Conn.Exec("truncate table chat cascade")
	assert.NoError(t, err)
	_, err = db.Conn.Exec("truncate table users cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()
	// Create 3 users
	_, err = tx.Exec("insert into users (user_id, wallet, is_current) values ($1, lower($2), true), ($3, lower($4), true), ($5, lower($6), true)", 1, wallet1, 2, wallet2, 3, wallet3)
	assert.NoError(t, err)

	// Create 2 chats
	chatId1 := "chat1"
	chatId2 := "chat2"
	chat1CreatedAt := time.Now().UTC()
	chat2CreatedAt := time.Now().UTC().Add(time.Minute * time.Duration(30))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2), ($3, $4, $4)", chatId1, chat1CreatedAt, chatId2, chat2CreatedAt)
	assert.NoError(t, err)

	// Insert members into chats (1 and 2, 1 and 3)
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3), ($4, $2, $4, $2), ($4, $2, $4, $5)", chatId1, 1, 2, chatId2, 3)
	assert.NoError(t, err)
	err = tx.Commit()
	assert.NoError(t, err)

	// Common expected responses
	expectedHealth := schema.Health{
		IsHealthy: true,
	}
	encodedUser1, err := misc.EncodeHashId(1)
	assert.NoError(t, err)
	encodedUser2, err := misc.EncodeHashId(2)
	assert.NoError(t, err)
	encodedUser3, err := misc.EncodeHashId(3)
	assert.NoError(t, err)
	expectedMember1 := schema.ChatMember{
		UserID: encodedUser1,
	}
	expectedMember2 := schema.ChatMember{
		UserID: encodedUser2,
	}
	expectedMember3 := schema.ChatMember{
		UserID: encodedUser3,
	}
	expectedChat1Data := schema.UserChat{
		ChatID:             chatId1,
		LastMessageAt:      chat1CreatedAt.Format(time.RFC3339Nano),
		InviteCode:         chatId1,
		UnreadMessageCount: float64(0),
		ChatMembers: []schema.ChatMember{
			expectedMember1,
			expectedMember2,
		},
	}
	expectedChat2Data := schema.UserChat{
		ChatID:             chatId2,
		LastMessageAt:      chat2CreatedAt.Format(time.RFC3339Nano),
		InviteCode:         chatId2,
		UnreadMessageCount: float64(0),
		ChatMembers: []schema.ChatMember{
			expectedMember1,
			expectedMember3,
		},
	}

	e := createServer()

	// Test GET /comms/chats
	{
		// Query /comms/chats
		req, err := http.NewRequest(http.MethodGet, "/comms/chats", nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(req.URL.Path)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(config.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []schema.UserChat{
			expectedChat2Data,
			expectedChat1Data,
		}
		expectedSummary := schema.Summary{
			TotalCount:     float64(2),
			RemainingCount: float64(0),
			NextCursor:     chat1CreatedAt.Format(time.RFC3339Nano),
		}
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health:  expectedHealth,
				Data:    expectedData,
				Summary: &expectedSummary,
			},
		)
		assert.NoError(t, err)
		if assert.NoError(t, getChats(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			// Remove insignificant space characters
			compactResp := new(bytes.Buffer)
			err = json.Compact(compactResp, rec.Body.Bytes())
			assert.Equal(t, string(expectedResponse), compactResp.String())
		}
	}

	// Test GET /comms/chats/:id
	{
		// Query /comms/chats/chat1
		req, err := http.NewRequest(http.MethodGet, "/comms/chat/:id", nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(req.URL.Path)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(config.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		// Set query params
		c.SetParamNames("id")
		c.SetParamValues(chatId1)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedChat1Data,
			},
		)
		assert.NoError(t, err)
		if assert.NoError(t, getChat(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			// Remove insignificant space characters
			compactResp := new(bytes.Buffer)
			err = json.Compact(compactResp, rec.Body.Bytes())
			assert.Equal(t, string(expectedResponse), compactResp.String())
		}
	}
}

func TestGetMessages(t *testing.T) {
	var err error

	// Generate user keys
	privateKey1, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet1 := crypto.PubkeyToAddress(privateKey1.PublicKey).Hex()

	privateKey2, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet2 := crypto.PubkeyToAddress(privateKey2.PublicKey).Hex()

	// Set up db
	_, err = db.Conn.Exec("truncate table chat cascade")
	assert.NoError(t, err)
	_, err = db.Conn.Exec("truncate table users cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()
	// Create 2 users
	_, err = tx.Exec("insert into users (user_id, wallet, is_current) values ($1, lower($2), true), ($3, lower($4), true)", 1, wallet1, 2, wallet2)
	assert.NoError(t, err)

	// Create a chat
	chatId := "chat1"
	chatCreatedAt := time.Now().UTC().Add(-time.Hour * time.Duration(2))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2)", chatId, chatCreatedAt)
	assert.NoError(t, err)

	// Insert members 1 and 2 into chat
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3)", chatId, 1, 2)
	assert.NoError(t, err)

	// Insert chat messages
	messageId1 := "message1"
	message1CreatedAt := time.Now().UTC().Add(-time.Hour * time.Duration(2))
	message1 := "hello from user 1"
	messageId2 := "message2"
	message2CreatedAt := time.Now().UTC().Add(-time.Hour * time.Duration(1))
	message2 := "ack from user 2"
	_, err = tx.Exec("insert into chat_message (message_id, chat_id, user_id, created_at, ciphertext) values ($1, $2, $3, $4, $5), ($6, $2, $7, $8, $9)", messageId1, chatId, 1, message1CreatedAt, message1, messageId2, 2, message2CreatedAt, message2)
	assert.NoError(t, err)

	// Insert 2 message reactions to message 1
	reaction1 := "heart"
	reaction1CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(30))
	reaction2 := "fire"
	reaction2CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(15))
	_, err = tx.Exec("insert into chat_message_reactions (user_id, message_id, reaction, created_at) values ($1, $2, $3, $4), ($5, $2, $6, $7)", 1, messageId1, reaction1, reaction1CreatedAt, 2, reaction2, reaction2CreatedAt)
	assert.NoError(t, err)

	err = tx.Commit()
	assert.NoError(t, err)

	// Test GET /comms/chats/:id/messages
	e := createServer()
	req, err := http.NewRequest(http.MethodGet, "/comms/chats/:id/messages", nil)
	assert.NoError(t, err)

	// Set sig header
	payload := []byte(req.URL.Path)
	sigBase64 := signPayload(t, payload, privateKey1)
	req.Header.Set(config.SigHeader, sigBase64)

	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	// Set query params
	c.SetParamNames("id")
	c.SetParamValues(chatId)

	res := rec.Result()
	defer res.Body.Close()

	// Assertions
	encodedUser1, err := misc.EncodeHashId(1)
	assert.NoError(t, err)
	encodedUser2, err := misc.EncodeHashId(2)
	assert.NoError(t, err)
	expectedHealth := schema.Health{
		IsHealthy: true,
	}
	expectedMessage1ReactionsData := []schema.Reaction{
		{
			CreatedAt: reaction1CreatedAt.Format(time.RFC3339Nano),
			Reaction:  reaction1,
			UserID:    encodedUser1,
		},
		{
			CreatedAt: reaction2CreatedAt.Format(time.RFC3339Nano),
			Reaction:  reaction2,
			UserID:    encodedUser2,
		},
	}
	expectedMessage1Data := schema.ChatMessage{
		MessageID:    messageId1,
		SenderUserID: encodedUser1,
		Message:      message1,
		CreatedAt:    message1CreatedAt.Format(time.RFC3339Nano),
		Reactions:    expectedMessage1ReactionsData,
	}
	expectedMessage2Data := schema.ChatMessage{
		MessageID:    messageId2,
		SenderUserID: encodedUser2,
		Message:      message2,
		CreatedAt:    message2CreatedAt.Format(time.RFC3339Nano),
	}
	expectedData := []schema.ChatMessage{
		expectedMessage2Data,
		expectedMessage1Data,
	}
	expectedSummary := schema.Summary{
		TotalCount:     float64(2),
		RemainingCount: float64(0),
		NextCursor:     message1CreatedAt.Format(time.RFC3339Nano),
	}
	expectedResponse, err := json.Marshal(
		schema.CommsResponse{
			Health:  expectedHealth,
			Data:    expectedData,
			Summary: &expectedSummary,
		},
	)
	assert.NoError(t, err)
	if assert.NoError(t, getMessages(c)) {
		assert.Equal(t, http.StatusOK, rec.Code)
		// Remove insignificant space characters
		compactResp := new(bytes.Buffer)
		err = json.Compact(compactResp, rec.Body.Bytes())
		assert.Equal(t, string(expectedResponse), compactResp.String())
	}
}

func signPayload(t *testing.T, payload []byte, privateKey *ecdsa.PrivateKey) string {
	msgHash := crypto.Keccak256Hash(payload)
	sig, err := crypto.Sign(msgHash[:], privateKey)
	assert.NoError(t, err)
	sigBase64 := base64.StdEncoding.EncodeToString(sig)
	return sigBase64
}
