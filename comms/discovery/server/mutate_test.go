package server

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/misc"
	"comms.audius.co/discovery/schema"
	"comms.audius.co/shared/signing"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/stretchr/testify/assert"
)

func TestMutateEndpoint(t *testing.T) {
	// Generate user keys
	privateKey1, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet1 := crypto.PubkeyToAddress(privateKey1.PublicKey).Hex()

	privateKey2, err := crypto.GenerateKey()
	assert.NoError(t, err)
	wallet2 := crypto.PubkeyToAddress(privateKey2.PublicKey).Hex()

	// seed db
	tx := db.Conn.MustBegin()
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	user1Id := seededRand.Int31()
	user2Id := seededRand.Int31()
	user1IdEncoded, _ := misc.EncodeHashId(int(user1Id))
	user2IdEncoded, _ := misc.EncodeHashId(int(user2Id))

	// Create 2 users
	_, err = tx.Exec("insert into users (user_id, handle, wallet, is_current) values ($1, $2::text, lower($2), true), ($3, $4::text, lower($4), true)", user1Id, wallet1, user2Id, wallet2)
	assert.NoError(t, err)

	err = tx.Commit()
	assert.NoError(t, err)

	// Prepare RPC
	rawParams, _ := json.Marshal(schema.ChatCreateRPCParams{
		ChatID: "asdf",
		Invites: []schema.PurpleInvite{
			{
				InviteCode: "code1",
				UserID:     user1IdEncoded,
			},
			{
				InviteCode: "code2",
				UserID:     user2IdEncoded,
			},
		},
	})
	rpc := schema.RawRPC{
		Method:    string(schema.RPCMethodChatCreate),
		Params:    rawParams,
		Timestamp: time.Now().UnixMilli(),
	}
	payload, _ := json.Marshal(rpc)
	sigBase64 := signPayload(t, payload, privateKey1)

	req, err := http.NewRequest(http.MethodPost, "/comms/mutate", bytes.NewReader(payload))
	assert.NoError(t, err)
	req.Header.Set(signing.SigHeader, sigBase64)

	// simulate request
	rec := httptest.NewRecorder()
	c := testServer.NewContext(req, rec)
	assert.NoError(t, testServer.mutate(c))

	res := rec.Result()
	defer res.Body.Close()

	assert.Equal(t, 200, res.StatusCode)
	body, _ := io.ReadAll(res.Body)
	fmt.Println(string(body))

}
