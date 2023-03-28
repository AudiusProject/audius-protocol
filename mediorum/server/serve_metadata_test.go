package server

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// add table for json blobs
// add some routes to match content-node

// test that sends track json to server 1
// read it from server 2

func TestJsonStuff(t *testing.T) {
	t.Skip("skipping metadata CID tests...")

	// replicationFactor := 3
	servers := testNetwork

	s1 := servers[0]
	s2 := servers[1]

	// let's make a POST request
	stuff := []byte(`{"day": "friday"}`)
	resp, err := http.Post(apiPath(s1.Config.Self.Host, "tracks/metadata"), "application/json", bytes.NewReader(stuff))
	assert.NoError(t, err)
	assert.Equal(t, resp.StatusCode, 200)

	txt, _ := io.ReadAll(resp.Body)
	fmt.Println(string(txt))

	time.Sleep(time.Millisecond * 100)

	// let's check that s2 has it
	var c int64
	err = s2.crud.DB.Model(&JsonCid{}).Count(&c).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(1), c)

	// dumb load test... how long it take?

	// log.Println("creating 10k stuff")
	// for i := 0; i < 10000; i++ {
	// 	err := s1.crud.Create(&JsonCid{
	// 		Cid:  fmt.Sprintf("thing_%d", i),
	// 		Data: []byte(`{"day": "friday"}`),
	// 	})
	// 	assert.NoError(t, err)
	// }
	// log.Println("done")

	// time.Sleep(time.Millisecond * 500)

	// // j := &JsonCid{}
	// var c int64
	// err := s2.crud.DB.Model(&JsonCid{}).Count(&c).Error
	// assert.NoError(t, err)
	// // assert.Equal(t, j.Cid, "abc123")
	// assert.Equal(t, c, 10000)
}
