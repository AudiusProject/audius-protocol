package server

import (
	"bytes"
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

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	sharedConfig "comms.audius.co/shared/config"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/google/go-cmp/cmp"
	"github.com/stretchr/testify/assert"
)

// NOTE compatibility issue between go and postgres: https://github.com/lib/pq/issues/227

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

	privateKey4, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet4 := crypto.PubkeyToAddress(privateKey4.PublicKey).Hex()

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
	user4Id := seededRand.Int31()

	// Create 4 users
	_, err = tx.Exec("insert into users (user_id, wallet, is_current) values ($1, lower($2), true), ($3, lower($4), true), ($5, lower($6), true), ($7, lower($8), true)", user1Id, wallet1, user2Id, wallet2, user3Id, wallet3, user4Id, wallet4)
	assert.NoError(t, err)

	// Create 3 chats
	chatId1 := strconv.Itoa(seededRand.Int())
	chatId2 := strconv.Itoa(seededRand.Int())
	chatId3 := strconv.Itoa(seededRand.Int())
	chat1CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(60))
	chat2CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(30))
	chat3CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(30))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2), ($3, $4, $4), ($5, $6, $6)", chatId1, chat1CreatedAt, chatId2, chat2CreatedAt, chatId3, chat3CreatedAt)
	assert.NoError(t, err)

	// Insert members into chats (1 and 2, 1 and 3, 1 and 4)
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id) values ($1, $2, $1, $2), ($1, $2, $1, $3), ($4, $2, $4, $2), ($4, $2, $4, $5), ($6, $2, $6, $2), ($6, $2, $6, $7)", chatId1, user1Id, user2Id, chatId2, user3Id, chatId3, user4Id)
	assert.NoError(t, err)

	// Insert 2 messages into chat 1
	messageId1 := strconv.Itoa(seededRand.Int())
	message1CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(59))
	message1 := "chat 1 first message"
	messageId2 := strconv.Itoa(seededRand.Int())
	message2CreatedAt := time.Now().UTC().Add(-time.Minute * time.Duration(45))
	message2 := "chat 1 second message"
	_, err = tx.Exec("insert into chat_message (message_id, chat_id, user_id, created_at, ciphertext) values ($1, $2, $3, $4, $5), ($6, $2, $7, $8, $9)", messageId1, chatId1, user1Id, message1CreatedAt, message1, messageId2, user2Id, message2CreatedAt, message2)
	assert.NoError(t, err)
	_, err = tx.Exec("update chat set last_message_at = $1, last_message = $2 where chat_id = $3", message2CreatedAt, message2, chatId1)
	assert.NoError(t, err)

	// Insert 1 message into chat 2
	messageId3 := strconv.Itoa(seededRand.Int())
	message3CreatedAt := chat2CreatedAt
	message3 := "chat 2 first message"
	_, err = tx.Exec("insert into chat_message (message_id, chat_id, user_id, created_at, ciphertext) values ($1, $2, $3, $4, $5)", messageId3, chatId2, user1Id, message3CreatedAt, message3)
	assert.NoError(t, err)
	_, err = tx.Exec("update chat set last_message_at = $1, last_message = $2 where chat_id = $3", message3CreatedAt, message3, chatId2)
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
		LastMessageAt:      message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
		InviteCode:         chatId1,
		UnreadMessageCount: float64(0),
		ChatMembers: []schema.ChatMember{
			expectedMember1,
			expectedMember2,
		},
	}
	expectedChat2Data := schema.UserChat{
		ChatID:             chatId2,
		LastMessage:        message3,
		LastMessageAt:      message3CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
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
		reqUrl := fmt.Sprintf("/comms/chats?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		// Excludes chats with no messages in response
		expectedData := []schema.UserChat{
			expectedChat2Data,
			expectedChat1Data,
		}
		expectedSummary := schema.Summary{
			TotalCount: float64(2),
			NextCount:  float64(0),
			NextCursor: chat2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
			PrevCount:  float64(0),
			PrevCursor: message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
		}
		expectedResponse := schema.CommsResponse{
			Health:  expectedHealth,
			Data:    expectedData,
			Summary: &expectedSummary,
		}
		if assert.NoError(t, testServer.getChats(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			var response schema.CommsResponse
			err := json.Unmarshal(rec.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.True(t, cmp.Equal(response, expectedResponse))
		}
	}

	// Test paginated GET /comms/chats
	{
		// Query /comms/chats
		reqUrl := fmt.Sprintf("/comms/chats?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

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
			NextCursor: message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
			PrevCount:  float64(0),
			PrevCursor: message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
		}
		expectedResponse := schema.CommsResponse{
			Health:  expectedHealth,
			Data:    expectedData,
			Summary: &expectedSummary,
		}
		if assert.NoError(t, testServer.getChats(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			var response schema.CommsResponse
			err := json.Unmarshal(rec.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.True(t, cmp.Equal(response, expectedResponse))
		}
	}

	// Test GET /comms/chats/:id
	{
		// Query /comms/chats/chat1
		reqUrl := fmt.Sprintf("/comms/chats/%s?timestamp=%d", chatId1, time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec) // test

		// Set path params
		c.SetParamNames("id")
		c.SetParamValues(chatId1)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedResponse := schema.CommsResponse{
			Health: expectedHealth,
			Data:   expectedChat1Data,
		}
		if assert.NoError(t, testServer.getChat(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			var response schema.CommsResponse
			err := json.Unmarshal(rec.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.True(t, cmp.Equal(response, expectedResponse))
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

	// seed db
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
			CreatedAt: reaction1CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
			Reaction:  reaction1,
			UserID:    encodedUser1,
		},
		{
			CreatedAt: reaction2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
			Reaction:  reaction2,
			UserID:    encodedUser2,
		},
	}
	expectedMessage1Data := schema.ChatMessage{
		MessageID:    messageId1,
		SenderUserID: encodedUser1,
		Message:      message1,
		CreatedAt:    message1CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
		Reactions:    expectedMessage1ReactionsData,
	}
	expectedMessage2Data := schema.ChatMessage{
		MessageID:    messageId2,
		SenderUserID: encodedUser2,
		Message:      message2,
		CreatedAt:    message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
	}

	// Test GET /comms/chats/:id/messages
	{
		reqUrl := fmt.Sprintf("/comms/chats/%s/messages?timestamp=%d", chatId, time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

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
			NextCursor: message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
			PrevCount:  float64(0),
			PrevCursor: message1CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
		}
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health:  expectedHealth,
				Data:    expectedData,
				Summary: &expectedSummary,
			},
		)
		assert.NoError(t, err)
		if assert.NoError(t, testServer.getMessages(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}

	// Test paginated GET /comms/chats/:id/messages
	{
		reqUrl := fmt.Sprintf("/comms/chats/%s/messages?timestamp=%d", chatId, time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

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
			NextCursor: message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
			PrevCount:  float64(1),
			PrevCursor: message2CreatedAt.Round(time.Microsecond).Format(time.RFC3339Nano),
		}
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health:  expectedHealth,
				Data:    expectedData,
				Summary: &expectedSummary,
			},
		)
		assert.NoError(t, err)
		if assert.NoError(t, testServer.getMessages(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}
}

func TestGetPermissions(t *testing.T) {
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

	// user 2 follows user 1
	_, err = tx.Exec("insert into follows (follower_user_id, followee_user_id, is_current, is_delete, created_at) values ($1, $2, true, false, now())", user2Id, user1Id)
	assert.NoError(t, err)

	// Set permissions:
	// - user 1: implicit all
	// - user 2: followees
	// - user3: tippers
	_, err = tx.Exec("insert into chat_permissions (user_id, permits) values ($1, $2), ($3, $4)", user2Id, schema.Followees, user3Id, schema.Tippers)

	err = tx.Commit()
	assert.NoError(t, err)

	// Common expected responses
	expectedHealth := schema.Health{
		IsHealthy: true,
	}

	// Test GET /chat_permissions (implicit ALL setting)
	{
		// Query /comms/chat_permissions
		reqUrl := fmt.Sprintf("/comms/chat_permissions?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header from user 1
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := "all"
		expectedResponse := schema.CommsResponse{
			Health: expectedHealth,
			Data:   expectedData,
		}
		if assert.NoError(t, testServer.getChatPermissions(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			var response schema.CommsResponse
			err := json.Unmarshal(rec.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.True(t, cmp.Equal(response, expectedResponse))
		}
	}

	// Test GET /chat_permissions (explicit setting)
	{
		// Query /comms/chat_permissions
		reqUrl := fmt.Sprintf("/comms/chat_permissions?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header from user 2
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey2)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := "followees"
		expectedResponse := schema.CommsResponse{
			Health: expectedHealth,
			Data:   expectedData,
		}
		if assert.NoError(t, testServer.getChatPermissions(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			var response schema.CommsResponse
			err := json.Unmarshal(rec.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.True(t, cmp.Equal(response, expectedResponse))
		}
	}

	// Test POST /validate_can_chat
	{
		// Query /comms/validate_can_chat
		reqUrl := fmt.Sprintf("/comms/validate_can_chat?timestamp=%d", time.Now().UnixMilli())
		encodedUser2, err := misc.EncodeHashId(int(user2Id))
		assert.NoError(t, err)
		encodedUser3, err := misc.EncodeHashId(int(user3Id))
		assert.NoError(t, err)
		payload := []byte(fmt.Sprintf(`{"method": "user.validate_can_chat", "params": {"receiver_user_ids": ["%s", "%s"]}}`, encodedUser2, encodedUser3))
		req, err := http.NewRequest(http.MethodPost, reqUrl, bytes.NewBuffer(payload))
		assert.NoError(t, err)

		// Set sig header from user 1
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(sharedConfig.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := map[string]interface{}{
			encodedUser2: true,
			encodedUser3: false,
		}
		expectedResponse := schema.CommsResponse{
			Health: expectedHealth,
			Data:   expectedData,
		}
		if assert.NoError(t, testServer.validateCanChat(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			var response schema.CommsResponse
			err := json.Unmarshal(rec.Body.Bytes(), &response)
			assert.NoError(t, err)
			assert.True(t, cmp.Equal(response, expectedResponse))
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
