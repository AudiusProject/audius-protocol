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
	"net/url"
	"strconv"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/db/queries"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/signing"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
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

	// Set up db
	_, err = db.Conn.Exec("truncate table chat cascade")
	assert.NoError(t, err)
	_, err = db.Conn.Exec("truncate table users cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	seededRand := rand.New(rand.NewSource(1))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user3Id := seededRand.Int31()
	user4Id := seededRand.Int31()

	// Create 1 user with wallet
	_, err = tx.Exec("insert into users (user_id, handle, wallet, is_current) values ($1, $2::text, lower($2), true)", user1Id, wallet1)
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
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id, created_at) values ($1, $2, $1, $2, now()), ($1, $2, $1, $3, now()), ($4, $2, $4, $2, now()), ($4, $2, $4, $5, now()), ($6, $2, $6, $2, now()), ($6, $2, $6, $7, now())", chatId1, user1Id, user2Id, chatId2, user3Id, chatId3, user4Id)
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
		RecheckPermissions: false,
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
		RecheckPermissions: false,
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
		req.Header.Set(signing.SigHeader, sigBase64)

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

		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health:  expectedHealth,
				Data:    expectedData,
				Summary: &expectedSummary,
			},
		)
		assert.NoError(t, err)

		if assert.NoError(t, testServer.getChats(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}

	// Test paginated GET /comms/chats
	{
		// Query /comms/chats
		reqUrl := fmt.Sprintf("/comms/chats?current_user_id=%s&timestamp=%d", url.QueryEscape(encodedUser1), time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(signing.SigHeader, sigBase64)

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
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health:  expectedHealth,
				Data:    expectedData,
				Summary: &expectedSummary,
			},
		)
		assert.NoError(t, err)

		if assert.NoError(t, testServer.getChats(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
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
		req.Header.Set(signing.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec) // test

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

		if assert.NoError(t, testServer.getChat(c)) {
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

	// Create 1 user with wallet
	_, err = tx.Exec("insert into users (user_id, handle, wallet, is_current) values ($1, $2::text, lower($2), true)", user1Id, wallet1)
	assert.NoError(t, err)

	// Create a chat
	chatId := strconv.Itoa(seededRand.Int())
	chatCreatedAt := time.Now().UTC().Add(-time.Hour * time.Duration(2))
	_, err = tx.Exec("insert into chat (chat_id, created_at, last_message_at) values ($1, $2, $2)", chatId, chatCreatedAt)
	assert.NoError(t, err)

	// Insert members 1 and 2 into chat
	_, err = tx.Exec("insert into chat_member (chat_id, invited_by_user_id, invite_code, user_id, created_at) values ($1, $2, $1, $2, now()), ($1, $2, $1, $3, now())", chatId, user1Id, user2Id)
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
		req.Header.Set(signing.SigHeader, sigBase64)

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
		req.Header.Set(signing.SigHeader, sigBase64)

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

	privateKey7, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet7 := crypto.PubkeyToAddress(privateKey7.PublicKey).Hex()

	// Set up db
	db.Conn.MustExec("truncate table chat cascade")
	db.Conn.MustExec("truncate table users cascade")
	db.Conn.MustExec("truncate table chat_permissions cascade")
	db.Conn.MustExec("truncate table follows cascade")
	db.Conn.MustExec("truncate table user_tips cascade")

	tx := db.Conn.MustBegin()

	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user3Id := seededRand.Int31()
	user4Id := seededRand.Int31()
	user5Id := seededRand.Int31()
	user6Id := seededRand.Int31()
	user7Id := seededRand.Int31()

	encodedUser1 := misc.MustEncodeHashID(int(user1Id))
	encodedUser2 := misc.MustEncodeHashID(int(user2Id))
	encodedUser3 := misc.MustEncodeHashID(int(user3Id))
	encodedUser4 := misc.MustEncodeHashID(int(user4Id))
	encodedUser5 := misc.MustEncodeHashID(int(user5Id))
	encodedUser6 := misc.MustEncodeHashID(int(user6Id))
	encodedUser7 := misc.MustEncodeHashID(int(user7Id))

	// user 1, 2, 7 have wallets
	tx.MustExec("insert into users (user_id, handle, wallet, is_current) values ($1, $2::text, lower($2), true), ($3, $4::text, lower($4), true), ($5, $6::text, lower($6), true)",
		user1Id, wallet1,
		user2Id, wallet2,
		user7Id, wallet7)

	tx.MustExec("update users set is_verified = true where user_id = $1", user2Id)

	// user 2 follows user 1
	tx.MustExec("insert into follows (follower_user_id, followee_user_id, is_current, is_delete, created_at) values ($1, $2, true, false, now())", user2Id, user1Id)

	// user 2 has tipped user 3
	tx.MustExec(`
	insert into user_tips
		(slot, signature, sender_user_id, receiver_user_id, amount, created_at, updated_at)
	values
		(1, 'a', $1, $2, 100, now(), now())
	`, user2Id, user3Id)

	// user 1 has tipped user 7
	tx.MustExec(`
	insert into user_tips
		(slot, signature, sender_user_id, receiver_user_id, amount, created_at, updated_at)
	values
		(1, 'b', $1, $2, 100, now(), now())
	`, user1Id, user7Id)

	// Set permissions:
	// - user 1: implicit all
	// - user 2: followees
	// - user 3: tippers
	// - user 4: followees
	// - user 5: explicit all
	// - user 6: none
	// - user 7: tippers + followers + verified
	tx.MustExec(`
	insert into chat_permissions (user_id, permits)
	values ($1, $2), ($3, $4), ($5, $6), ($7, $8), ($9, $10), ($11, $12), ($13, $14), ($15, $16)`,
		user2Id, schema.Followees,
		user3Id, schema.Tippers,
		user4Id, schema.Followees,
		user5Id, schema.All,
		user6Id, schema.None,
		user7Id, schema.Tippers,
		user7Id, schema.Followers,
		user7Id, schema.Verified,
	)

	err = tx.Commit()
	assert.NoError(t, err)

	// Common expected responses
	expectedHealth := schema.Health{
		IsHealthy: true,
	}

	makePermissionRequest := func(privateKey *ecdsa.PrivateKey, otherUserId ...string) (int, string) {
		uv := &url.Values{}
		uv.Set("timestamp", fmt.Sprintf("%d", time.Now().UnixMilli()))
		for _, id := range otherUserId {
			uv.Add("id", id)
		}
		reqUrl := fmt.Sprintf("/comms/chats/permissions?%s", uv.Encode())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		sigBase64 := signPayload(t, []byte(reqUrl), privateKey)
		req.Header.Set(signing.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		err = testServer.getChatPermissions(c)
		assert.NoError(t, err)
		got := rec.Body.String()

		return rec.Code, got
	}

	// Test GET /chats/permissions (current user)
	{
		code, got := makePermissionRequest(privateKey2, encodedUser2)

		// Assertions
		expectedData := ToChatPermissionsResponse(map[string]queries.ChatPermissionsRow{
			encodedUser2: {
				Permits: string(schema.Followees),
				// current user is requesting to chat with self
				// but has followees only...
				// can't follow self so false
				CurrentUserHasPermission: false,
			},
		})
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		assert.Equal(t, http.StatusOK, code)
		assert.JSONEq(t, string(expectedResponse), got)
	}

	// Test GET /chats/permissions (implicit all, explicit all, none)
	{

		code, got := makePermissionRequest(privateKey2, encodedUser1, encodedUser5, encodedUser6)

		// Assertions
		expectedData := ToChatPermissionsResponse(map[string]queries.ChatPermissionsRow{
			encodedUser1: {
				Permits:                  string(schema.All),
				CurrentUserHasPermission: true,
			},
			encodedUser5: {
				Permits:                  string(schema.All),
				CurrentUserHasPermission: true,
			},
			encodedUser6: {
				Permits:                  string(schema.None),
				CurrentUserHasPermission: false,
			},
		})
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		assert.Equal(t, http.StatusOK, code)
		assert.JSONEq(t, string(expectedResponse), got)
	}

	// Test GET /chats/permissions (followees, tippers) -> (true, false)
	{

		code, got := makePermissionRequest(privateKey1, encodedUser2, encodedUser3)

		// Assertions
		expectedData := ToChatPermissionsResponse(map[string]queries.ChatPermissionsRow{
			encodedUser2: {
				Permits:                  string(schema.Followees),
				CurrentUserHasPermission: true,
			},
			encodedUser3: {
				Permits:                  string(schema.Tippers),
				CurrentUserHasPermission: false,
			},
		})
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		assert.Equal(t, http.StatusOK, code)
		assert.JSONEq(t, string(expectedResponse), got)
	}

	// Test GET /chats/permissions (followees, tippers) -> (false, true)
	{
		code, got := makePermissionRequest(privateKey2, encodedUser3, encodedUser4)

		// Assertions
		expectedData := ToChatPermissionsResponse(map[string]queries.ChatPermissionsRow{
			encodedUser3: {
				Permits:                  string(schema.Tippers),
				CurrentUserHasPermission: true,
			},
			encodedUser4: {
				Permits:                  string(schema.Followees),
				CurrentUserHasPermission: false,
			},
		})
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		assert.Equal(t, http.StatusOK, code)
		assert.JSONEq(t, string(expectedResponse), got)
	}

	// multi-permissions test: follower
	{
		code, got := makePermissionRequest(privateKey1, encodedUser2, encodedUser7)

		// Assertions
		expectedData := ToChatPermissionsResponse(map[string]queries.ChatPermissionsRow{
			encodedUser2: {
				Permits:                  string(schema.Followees),
				CurrentUserHasPermission: true,
			},
			encodedUser7: {
				Permits:                  fmt.Sprintf("%s,%s,%s", schema.Followers, schema.Tippers, schema.Verified),
				CurrentUserHasPermission: true,
			},
		})
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		assert.Equal(t, http.StatusOK, code)
		assert.JSONEq(t, string(expectedResponse), got)
	}

	// multi-permissions test: verified
	{
		code, got := makePermissionRequest(privateKey2, encodedUser7)

		// Assertions
		expectedData := ToChatPermissionsResponse(map[string]queries.ChatPermissionsRow{
			encodedUser7: {
				Permits:                  fmt.Sprintf("%s,%s,%s", schema.Followers, schema.Tippers, schema.Verified),
				CurrentUserHasPermission: true,
			},
		})
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		assert.Equal(t, http.StatusOK, code)
		assert.JSONEq(t, string(expectedResponse), got)
		assert.Equal(t, expectedData[0].PermitList, []schema.ChatPermission{schema.Followers, schema.Tippers, schema.Verified})
	}
}

func TestGetBlockersAndBlockees(t *testing.T) {
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

	encodedUser1, err := misc.EncodeHashId(int(user1Id))
	assert.NoError(t, err)
	encodedUser3, err := misc.EncodeHashId(int(user3Id))
	assert.NoError(t, err)

	// Create 3 users
	_, err = tx.Exec("insert into users (user_id, handle, wallet, is_current) values ($1, $2::text, lower($2), true), ($3, $4::text, lower($4), true), ($5, $6::text, lower($6), true)", user1Id, wallet1, user2Id, wallet2, user3Id, wallet3)
	assert.NoError(t, err)

	// Set blocks:
	// - user 1 blocks user 3
	// - user 2 blocks no one
	// - user 3 blocks user 2
	_, err = tx.Exec("insert into chat_blocked_users (blocker_user_id, blockee_user_id, created_at) values ($1, $2, $3), ($4, $5, $3)", user1Id, user3Id, time.Now(), user3Id, user2Id)
	assert.NoError(t, err)

	err = tx.Commit()
	assert.NoError(t, err)

	// Common expected responses
	expectedHealth := schema.Health{
		IsHealthy: true,
	}

	// Test GET /chats/blockees
	{
		// Query /comms/chats/blockees
		reqUrl := fmt.Sprintf("/comms/chats/blockees?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header from user 1
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(signing.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []string{encodedUser3}
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		if assert.NoError(t, testServer.getChatBlockees(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}

	// Test GET /chats/blockees (no blocked users)
	{
		// Query /comms/chats/blockees
		reqUrl := fmt.Sprintf("/comms/chats/blockees?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header from user 2
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey2)
		req.Header.Set(signing.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []string{}
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		if assert.NoError(t, testServer.getChatBlockees(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}

	// Test GET /chats/blockers
	{
		// Query /comms/chats/blockers
		reqUrl := fmt.Sprintf("/comms/chats/blockers?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header from user 3
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey3)
		req.Header.Set(signing.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []string{encodedUser1}
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		if assert.NoError(t, testServer.getChatBlockers(c)) {
			assert.Equal(t, http.StatusOK, rec.Code)
			assert.JSONEq(t, string(expectedResponse), rec.Body.String())
		}
	}

	// Test GET /chats/blockers (no blocking users)
	{
		// Query /comms/chats/blockers
		reqUrl := fmt.Sprintf("/comms/chats/blockers?timestamp=%d", time.Now().UnixMilli())
		req, err := http.NewRequest(http.MethodGet, reqUrl, nil)
		assert.NoError(t, err)

		// Set sig header from user 1
		payload := []byte(reqUrl)
		sigBase64 := signPayload(t, payload, privateKey1)
		req.Header.Set(signing.SigHeader, sigBase64)

		rec := httptest.NewRecorder()
		c := testServer.NewContext(req, rec)

		res := rec.Result()
		defer res.Body.Close()

		// Assertions
		expectedData := []string{}
		expectedResponse, err := json.Marshal(
			schema.CommsResponse{
				Health: expectedHealth,
				Data:   expectedData,
			},
		)
		assert.NoError(t, err)

		if assert.NoError(t, testServer.getChatBlockers(c)) {
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
