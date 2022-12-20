package server

import (
	"fmt"
	"log"
	"testing"

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

}
