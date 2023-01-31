package server

import (
	"crypto/ecdsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
)

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

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user3Id := seededRand.Int31()

	// Create 3 users
	_, err = tx.Exec("insert into users (user_id, wallet, is_current) values ($1, lower($2), true), ($3, lower($4), true), ($5, lower($6), true)", user1Id, wallet1, user2Id, wallet2, user3Id, wallet3)
	assert.NoError(t, err)

	// Create 2 chats
	chatId1 := strconv.Itoa(seededRand.Int())
	chatId2 := strconv.Itoa(seededRand.Int())
	chat1CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(60))
	chat2CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(30))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2), ($3, $4, $4)", chatId1, chat1CreatedAt, chatId2, chat2CreatedAt)
	assert.NoError(t, err)

	// Insert members into chats (1 and 2, 1 and 3)
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3), ($4, $2, $4, $2), ($4, $2, $4, $5)", chatId1, user1Id, user2Id, chatId2, user3Id)
	assert.NoError(t, err)

	// Insert 2 messages into chat 1
	messageId1 := strconv.Itoa(seededRand.Int())
	message1CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(59))
	message1 := "first message"
	messageId2 := strconv.Itoa(seededRand.Int())
	message2CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(45))
	message2 := "second message"
	_, err = tx.Exec("insert into chat_message (message_id, chat_id, user_id, created_at, ciphertext) values ($1, $2, $3, $4, $5), ($6, $2, $7, $8, $9)", messageId1, chatId1, user1Id, message1CreatedAt, message1, messageId2, user2Id, message2CreatedAt, message2)
	assert.NoError(t, err)
	_, err = tx.Exec("update chat set last_message_at = $1, last_message = $2 where chat_id = $3", message2CreatedAt, message2, chatId1)
	assert.NoError(t, err)

	err = tx.Commit()
	assert.NoError(t, err)

	// Common expected responses
	expectedHealth := schema.Health{
		IsHealthy: true,
	}
	encodedUser1, err := misc.EncodeHashId(int(user1Id))
	assert.NoError(t, err)
	encodedUser2, err := misc.EncodeHashId(int(user2Id))
	assert.NoError(t, err)
	encodedUser3, err := misc.EncodeHashId(int(user3Id))
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
		LastMessage:        message2,
		LastMessageAt:      message2CreatedAt.Format(time.RFC3339Nano),
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
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []schema.UserChat{
			expectedChat2Data,
			expectedChat1Data,
		}
		expectedSummary := schema.Summary{
			TotalCount: float64(2),
			NextCount:  float64(0),
			NextCursor: chat2CreatedAt.Format(time.RFC3339Nano),
			PrevCount:  float64(0),
			PrevCursor: message2CreatedAt.Format(time.RFC3339Nano),
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
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}

	// Test paginated GET /comms/chats
	{
		// Query /comms/chats
		req, err := http.NewRequest(http.MethodGet, "/comms/chats", nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(req.URL.Path)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(config.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		// Set query params
		before := time.Now().UTC().Add(-time.Minute * time.Duration(45)).Format(time.RFC3339Nano)
		after := time.Now().UTC().Add(-time.Hour * time.Duration(2)).Format(time.RFC3339Nano)
		queryParams := c.QueryParams()
		queryParams["before"] = []string{before}
		queryParams["after"] = []string{after}

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []schema.UserChat{
			expectedChat1Data,
		}
		expectedSummary := schema.Summary{
			TotalCount: float64(2),
			NextCount:  float64(1),
			NextCursor: message2CreatedAt.Format(time.RFC3339Nano),
			PrevCount:  float64(0),
			PrevCursor: message2CreatedAt.Format(time.RFC3339Nano),
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
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
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
		c := testServer.NewContext(req, rec)

		// Set path params
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
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
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

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()

	// Create 2 users
	_, err = tx.Exec("insert into users (user_id, wallet, is_current) values ($1, lower($2), true), ($3, lower($4), true)", user1Id, wallet1, user2Id, wallet2)
	assert.NoError(t, err)

	// Create a chat
	chatId := strconv.Itoa(seededRand.Int())
	chatCreatedAt := time.Now().UTC().Add(-time.Hour * time.Duration(2))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2)", chatId, chatCreatedAt)
	assert.NoError(t, err)

	// Insert members 1 and 2 into chat
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3)", chatId, user1Id, user2Id)
	assert.NoError(t, err)

	// Insert chat messages
	messageId1 := strconv.Itoa(seededRand.Int())
	message1CreatedAt := time.Now().UTC().Add(-time.Hour * time.Duration(2))
	message1 := "hello from user 1"
	messageId2 := strconv.Itoa(seededRand.Int())
	message2CreatedAt := time.Now().UTC().Add(-time.Hour * time.Duration(1))
	message2 := "ack from user 2"
	_, err = tx.Exec("insert into chat_message (message_id, chat_id, user_id, created_at, ciphertext) values ($1, $2, $3, $4, $5), ($6, $2, $7, $8, $9)", messageId1, chatId, user1Id, message1CreatedAt, message1, messageId2, user2Id, message2CreatedAt, message2)
	assert.NoError(t, err)

	// Insert 2 message reactions to message 1
	reaction1 := "heart"
	reaction1CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(30))
	reaction2 := "fire"
	reaction2CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(15))
	_, err = tx.Exec("insert into chat_message_reactions (user_id, message_id, reaction, created_at) values ($1, $2, $3, $4), ($5, $2, $6, $7)", user1Id, messageId1, reaction1, reaction1CreatedAt, user2Id, reaction2, reaction2CreatedAt)
	assert.NoError(t, err)

	err = tx.Commit()
	assert.NoError(t, err)

	// Common expected responses
	encodedUser1, err := misc.EncodeHashId(int(user1Id))
	assert.NoError(t, err)
	encodedUser2, err := misc.EncodeHashId(int(user2Id))
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

	// Test GET /comms/chats/:id/messages
	{
		req, err := http.NewRequest(http.MethodGet, "/comms/chats/:id/messages", nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(req.URL.Path)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(config.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		// Set path params
		c.SetParamNames("id")
		c.SetParamValues(chatId)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []schema.ChatMessage{
			expectedMessage2Data,
			expectedMessage1Data,
		}
		expectedSummary := schema.Summary{
			TotalCount: float64(2),
			NextCount:  float64(0),
			NextCursor: message2CreatedAt.Format(time.RFC3339Nano),
			PrevCount:  float64(0),
			PrevCursor: message1CreatedAt.Format(time.RFC3339Nano),
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
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}

	// Test paginated GET /comms/chats/:id/messages
	{
		req, err := http.NewRequest(http.MethodGet, "/comms/chats/:id/messages", nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(req.URL.Path)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(config.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		// Set path params
		c.SetParamNames("id")
		c.SetParamValues(chatId)

		// Set query params
		before := time.Now().UTC().Add(-time.Minute * time.Duration(15)).Format(time.RFC3339Nano)
		after := time.Now().UTC().Add(-time.Minute * time.Duration(90)).Format(time.RFC3339Nano)
		queryParams := c.QueryParams()
		queryParams["before"] = []string{before}
		queryParams["after"] = []string{after}

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []schema.ChatMessage{
			expectedMessage2Data,
		}
		expectedSummary := schema.Summary{
			TotalCount: float64(2),
			NextCount:  float64(0),
			NextCursor: message2CreatedAt.Format(time.RFC3339Nano),
			PrevCount:  float64(1),
			PrevCursor: message2CreatedAt.Format(time.RFC3339Nano),
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
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}
}

func signPayload(t *testing.T, payload []byte, privateKey *ecdsa.PrivateKey) string {
	msgHash := crypto.Keccak256Hash(payload)
	sig, err := crypto.Sign(msgHash[:], privateKey)
	assert.NoError(t, err)
	sigBase64 := base64.StdEncoding.EncodeToString(sig)
	return sigBase64
}
