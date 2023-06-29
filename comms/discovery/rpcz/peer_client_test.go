package rpcz

import (
	"errors"
	"fmt"
	"log"
	"testing"

	"comms.audius.co/discovery/config"
	"comms.audius.co/discovery/db"
	"comms.audius.co/discovery/schema"
	"github.com/stretchr/testify/assert"
)

func TestPeerClient(t *testing.T) {
	db.Conn.MustExec(`truncate rpc_error`)

	discoveryConfig := config.Parse()

	proc, err := NewProcessor(discoveryConfig)
	if err != nil {
		log.Fatal(err)
	}

	pc := NewPeerClient("https://example.com", proc)

	op := &schema.RpcLog{
		Sig:       "sig1",
		Rpc:       []byte(`{"fun": true}`),
		RelayedBy: "https://example.com",
	}
	err = pc.insertRpcError(op, errors.New("error1"))
	assert.NoError(t, err)

	var errorCount int
	var errorText string
	err = db.Conn.QueryRow(`select error_count, error_text from rpc_error where sig = 'sig1'`).Scan(&errorCount, &errorText)
	assert.NoError(t, err)
	assert.Equal(t, 1, errorCount)
	assert.Equal(t, "error1", errorText)

	// second attempt
	err = pc.insertRpcError(op, errors.New("error2"))
	assert.NoError(t, err)

	err = db.Conn.QueryRow(`select error_count, error_text from rpc_error where sig = 'sig1'`).Scan(&errorCount, &errorText)
	assert.NoError(t, err)
	assert.Equal(t, 2, errorCount)
	assert.Equal(t, "error2", errorText)

	// add a second error
	{
		op := &schema.RpcLog{
			Sig:       "sig2",
			Rpc:       []byte(`{"fun": true}`),
			RelayedBy: "https://example.com",
		}
		err = pc.insertRpcError(op, errors.New("error2"))
		assert.NoError(t, err)
	}

	// add a third error but from an unrelated host
	// this peer client should only consider (https://example.com)
	{
		op := &schema.RpcLog{
			Sig:       "sig3",
			Rpc:       []byte(`{"fun": true}`),
			RelayedBy: "https://google.com",
		}
		err = pc.insertRpcError(op, errors.New("error3"))
		assert.NoError(t, err)
	}

	{
		var myFailed []*schema.RpcLog
		err := pc.appendRpcErrorRows(&myFailed)
		assert.NoError(t, err)
		assert.Len(t, myFailed, 2)
	}

	// increment retry above threshold
	for i := 0; i < 100; i++ {
		pc.insertRpcError(op, fmt.Errorf("error%d", i))
	}

	// should ignore error that is over threshold
	{
		var myFailed []*schema.RpcLog
		err := pc.appendRpcErrorRows(&myFailed)
		assert.NoError(t, err)
		assert.Len(t, myFailed, 1)
	}

}
