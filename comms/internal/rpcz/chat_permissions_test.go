package rpcz

import (
	"fmt"
	"testing"

	"comms.audius.co/db"
	"comms.audius.co/schema"
	"github.com/stretchr/testify/assert"
)

func TestChatPermissions(t *testing.T) {
	var err error

	// reset tables under test
	_, err = db.Conn.Exec("truncate table chat_permissions cascade")
	assert.NoError(t, err)

	tx := db.Conn.MustBegin()

	assertPermissions := func(userId int32, permits schema.ChatPermission, expected int) {
		row := tx.QueryRow("select count(*) from chat_permissions where user_id = $1 and permits = $2", userId, permits)
		var count int
		err = row.Scan(&count)
		assert.NoError(t, err)
		assert.Equal(t, expected, count)
	}

	// validate 91 can set permissions
	{
		exampleRpc := schema.RawRPC{
			Params: []byte(fmt.Sprintf(`{"permit": "all"}`)),
		}

		chatPermit := string(schema.RPCMethodChatPermit)

		err = Validators[chatPermit](tx, 91, exampleRpc)
		assert.NoError(t, err)
	}

	// 91 sets chat permissions to followees only
	userId := int32(91)
	err = chatSetPermissions(tx, userId, schema.Followees)
	assert.NoError(t, err)
	assertPermissions(userId, schema.Followees, 1)

	// 91 changes chat permissions to none
	err = chatSetPermissions(tx, userId, schema.None)
	assert.NoError(t, err)
	assertPermissions(userId, schema.Followees, 0)
	assertPermissions(userId, schema.None, 1)

	tx.Rollback()
}
